const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Charger = require('../models/Charger');
const MemoryStore = require('../models/MemoryStore');

// Helper to calculate distance using Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Comprehensive map of all 44 Gujarat towns to coordinates
const cityCoords = {
  // Major cities
  surat: { lat: 21.1702, lng: 72.8311 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  baroda: { lat: 22.3072, lng: 73.1812 }, // alias
  rajkot: { lat: 22.3039, lng: 70.8022 },
  // Medium cities
  gandhinagar: { lat: 23.2156, lng: 72.6369 },
  anand: { lat: 22.5645, lng: 72.9289 },
  nadiad: { lat: 22.6916, lng: 72.8634 },
  bharuch: { lat: 21.7051, lng: 72.9959 },
  ankleshwar: { lat: 21.6264, lng: 73.0152 },
  vapi: { lat: 20.3718, lng: 72.9090 },
  valsad: { lat: 20.5993, lng: 72.9342 },
  navsari: { lat: 20.9467, lng: 72.9520 },
  bhavnagar: { lat: 21.7645, lng: 72.1519 },
  jamnagar: { lat: 22.4707, lng: 70.0577 },
  bhuj: { lat: 23.2420, lng: 69.6670 },
  junagadh: { lat: 21.5222, lng: 70.4579 },
  morbi: { lat: 22.8120, lng: 70.8235 },
  surendranagar: { lat: 22.7262, lng: 71.6380 },
  mehsana: { lat: 23.6010, lng: 72.3997 },
  palanpur: { lat: 24.1722, lng: 72.4340 },
  gandhidham: { lat: 23.0763, lng: 70.1337 },
  // Small towns and highway transit nodes
  limbdi: { lat: 22.5641, lng: 71.8080 },
  chotila: { lat: 22.4278, lng: 71.3033 },
  dholera: { lat: 22.2530, lng: 72.1930 },
  dhandhuka: { lat: 22.3683, lng: 71.9836 },
  jetpur: { lat: 21.7615, lng: 70.6276 },
  veraval: { lat: 20.9015, lng: 70.4005 },
  porbandar: { lat: 21.6417, lng: 69.6093 },
  dwarka: { lat: 22.2442, lng: 68.9684 },
  radhanpur: { lat: 23.8318, lng: 71.6050 },
  deesa: { lat: 24.2580, lng: 72.1915 },
  himatnagar: { lat: 23.5979, lng: 72.9623 },
  modasa: { lat: 23.4682, lng: 73.3001 },
  godhra: { lat: 22.7766, lng: 73.6149 },
  halol: { lat: 22.5029, lng: 73.4651 },
  vyara: { lat: 21.1212, lng: 73.4011 },
  bardoli: { lat: 21.1215, lng: 73.1130 },
  saputara: { lat: 20.7321, lng: 73.7486 },
  dharampur: { lat: 20.5404, lng: 73.1818 },
  chikhli: { lat: 20.7589, lng: 73.0645 },
  anjar: { lat: 23.1134, lng: 70.0275 },
  mundra: { lat: 22.8395, lng: 69.7249 },
  mandvi: { lat: 22.8340, lng: 69.3551 },
  patan: { lat: 23.8493, lng: 72.1257 },
  dahod: { lat: 22.8376, lng: 74.2570 },
};

// Speed categories understood by users
const speedKeywords = {
  fast: 22,    // 22kW+ is considered fast
  rapid: 50,   // 50kW+ is rapid DC
  slow: 3.3,   // 3.3kW slow home
};

// EV model to recommended connector mapping  
const evConnectors = {
  nexon: 'CCS', 'zs ev': 'CCS', tiago: 'Bharat AC',
  comet: 'Bharat AC', atto: 'CCS', punch: 'CCS',
  ioniq: 'CCS', ev6: 'CCS', xuv400: 'CCS',
  'bmw ix': 'CCS', 'mercedes eqs': 'CCS', 'audi q8': 'CCS',
};

// Smart natural language fallback parser — recognizes all 44 Gujarat towns
function fallbackParse(message) {
  const msg = message.toLowerCase();
  let location = null, maxPrice = null, connectorType = null, carModel = null, minSpeedKw = null;

  // 1. Detect city / town name from full list
  for (const city of Object.keys(cityCoords)) {
    if (msg.includes(city)) {
      location = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // 2. Detect price constraint
  const priceMatch = msg.match(/(?:under|below|max|within|less than|₹|rs\.?)\s*(\d+)/i)
    || msg.match(/(\d+)\s*(?:rs|rupees?|per kwh|\/kwh)/i);
  if (priceMatch) maxPrice = Number(priceMatch[1]);

  // 3. Detect connector type
  if (msg.includes('ccs') || msg.includes('dc fast') || msg.includes('dc')) connectorType = 'CCS';
  else if (msg.includes('type2') || msg.includes('type 2') || msg.includes('ac fast')) connectorType = 'Type2';
  else if (msg.includes('chademo')) connectorType = 'CHAdeMO';
  else if (msg.includes('bharat')) connectorType = 'Bharat AC';

  // 4. Detect speed preference
  if (msg.includes('rapid') || msg.includes('superfast') || msg.includes('50kw') || msg.includes('50 kw')) minSpeedKw = 50;
  else if (msg.includes('fast') || msg.includes('quick') || msg.includes('22kw') || msg.includes('22 kw')) minSpeedKw = 22;

  // 5. Detect EV model and infer connector if not specified
  for (const [car, recConnector] of Object.entries(evConnectors)) {
    if (msg.includes(car)) {
      carModel = car.toUpperCase();
      if (!connectorType) connectorType = recConnector;
      break;
    }
  }

  return { location, maxPrice, connectorType, carModel, minSpeedKw, isFallback: true };
}

// Build a human-readable suggestion string from parsed query
function buildSuggestion(parsed, count) {
  const parts = [];
  if (parsed.location) parts.push(`in ${parsed.location}`);
  if (parsed.connectorType) parts.push(`with ${parsed.connectorType} connector`);
  if (parsed.maxPrice) parts.push(`under ₹${parsed.maxPrice}/kWh`);
  if (parsed.minSpeedKw) parts.push(`at ${parsed.minSpeedKw}kW+`);
  if (parsed.carModel) parts.push(`for your ${parsed.carModel}`);

  if (count === 0) {
    return `I searched ${parts.length ? parts.join(', ') : 'the Gujarat network'} but found no matches. Try relaxing your filters — for example, remove the price limit or try a nearby city.`;
  }
  return `Found ${count} charger${count > 1 ? 's' : ''} ${parts.length ? parts.join(', ') : 'nearby'}! Here are the top results:`;
}

// @route   POST /api/ai/search
// @desc    Parse natural language and return matching chargers
// @access  Public
router.post('/search', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    let parsed = { location: null, maxPrice: null, connectorType: null, carModel: null, minSpeedKw: null };
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are an EV charging network assistant for Gujarat, India.
Extract from the user message these fields:
- location: city or town name string (or null)
- maxPrice: max price in ₹/kWh as a number (or null)
- connectorType: one of "CCS", "Type2", "CHAdeMO", "Bharat AC" (or null)
- carModel: EV car model name string (or null)
- minSpeedKw: minimum charging speed in kW as a number (or null)

Return ONLY a JSON object with exactly these five fields. Do NOT add explanation.
User message: "${message.replace(/"/g, "'")}"`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = { ...parsed, ...JSON.parse(jsonMatch[0]) };
        }
      } catch (geminiError) {
        console.warn('Gemini API error, using smart fallback:', geminiError.message);
        parsed = fallbackParse(message);
      }
    } else {
      parsed = fallbackParse(message);
    }

    console.log('[AI] Parsed query:', JSON.stringify(parsed));

    let results = [];

    if (mongoose.connection.readyState === 1) {
      // MongoDB mode
      let dbQuery = { isLive: true };
      if (parsed.connectorType) dbQuery.connectorType = parsed.connectorType;
      if (parsed.maxPrice) dbQuery.pricePerKwh = { $lte: parsed.maxPrice };
      if (parsed.minSpeedKw) dbQuery.speedKw = { $gte: parsed.minSpeedKw };
      results = await Charger.find(dbQuery).populate('merchantId', 'name email').limit(200);
    } else {
      // In-memory fallback mode
      results = MemoryStore.chargers.filter(c => {
        if (!c.isLive) return false;
        if (parsed.connectorType && c.connectorType !== parsed.connectorType) return false;
        if (parsed.maxPrice && c.pricePerKwh > parsed.maxPrice) return false;
        if (parsed.minSpeedKw && c.speedKw < parsed.minSpeedKw) return false;
        return true;
      }).map(c => {
        const merchant = MemoryStore.users.find(u => u._id === c.merchantId) || { name: 'Rajesh Sharma', email: 'merchant@evnest.com' };
        return { ...c, merchantId: { _id: merchant._id, name: merchant.name, email: merchant.email } };
      });
    }

    // Filter & rank by city coordinates if location is recognized
    if (parsed.location) {
      const cityKey = parsed.location.toLowerCase();
      const targetCoords = cityCoords[cityKey];

      if (targetCoords) {
        results = results
          .map(c => {
            const rawC = c._doc ? c._doc : c;
            rawC.distance = getDistance(targetCoords.lat, targetCoords.lng, rawC.lat, rawC.lng);
            return c;
          })
          .filter(c => {
            const rawC = c._doc ? c._doc : c;
            return rawC.distance <= 80;
          });
        
        results.sort((a, b) => {
          const dA = (a._doc ? a._doc : a).distance || 0;
          const dB = (b._doc ? b._doc : b).distance || 0;
          return dA - dB;
        });
      } else {
        // Regex text search on address/title/description
        const regex = new RegExp(parsed.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        results = results.filter(
          c => regex.test(c.address) || regex.test(c.title) || regex.test(c.description)
        );
      }
    }

    const finalResults = results.slice(0, 3);
    const suggestion = buildSuggestion(parsed, finalResults.length);

    res.json({
      query: parsed,
      chargers: finalResults,
      suggestion,
    });

  } catch (err) {
    console.error('[AI] Route error:', err);
    res.status(500).json({ error: 'AI processing failed. Please try again.' });
  }
});

module.exports = router;
