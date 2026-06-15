const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Charger = require('../models/Charger');
const MemoryStore = require('../models/MemoryStore');
const { auth, checkRole } = require('../middleware/auth');

// Helper function to calculate distance using Haversine formula (in km)
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

// @route   GET /api/chargers
// @desc    Get all live chargers
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const chargers = await Charger.find({ isLive: true }).populate('merchantId', 'name email');
      return res.json(chargers);
    } else {
      // Memory fallback: Populate merchant details mock
      const chargers = MemoryStore.chargers.filter(c => c.isLive).map(c => {
        const merchant = MemoryStore.users.find(u => u._id === c.merchantId) || { name: 'Rajesh Sharma', email: 'merchant@evnest.com' };
        return { ...c, merchantId: { _id: merchant._id, name: merchant.name, email: merchant.email } };
      });
      return res.json(chargers);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving chargers.' });
  }
});

// @route   GET /api/chargers/search
// @desc    Search and filter chargers
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, radius, maxPrice, connectorType, minSpeed, locationName } = req.query;

    let chargersList = [];

    if (mongoose.connection.readyState === 1) {
      let query = { isLive: true };
      if (connectorType) query.connectorType = connectorType;
      if (minSpeed) query.speedKw = { $gte: Number(minSpeed) };
      if (maxPrice) query.pricePerKwh = { $lte: Number(maxPrice) };
      
      chargersList = await Charger.find(query).populate('merchantId', 'name email');
    } else {
      // Memory fallback
      chargersList = MemoryStore.chargers.filter(c => {
        if (!c.isLive) return false;
        if (connectorType && c.connectorType !== connectorType) return false;
        if (minSpeed && c.speedKw < Number(minSpeed)) return false;
        if (maxPrice && c.pricePerKwh > Number(maxPrice)) return false;
        return true;
      }).map(c => {
        const merchant = MemoryStore.users.find(u => u._id === c.merchantId) || { name: 'Rajesh Sharma', email: 'merchant@evnest.com' };
        return { ...c, merchantId: { _id: merchant._id, name: merchant.name, email: merchant.email } };
      });
    }

    // Filter by text search
    if (locationName && !lat && !lng) {
      const searchRegex = new RegExp(locationName, 'i');
      chargersList = chargersList.filter(
        c => searchRegex.test(c.address) || searchRegex.test(c.title) || searchRegex.test(c.description)
      );
    }

    // Filter by coordinates
    if (lat && lng) {
      const originLat = Number(lat);
      const originLng = Number(lng);
      const maxDist = Number(radius) || 50;

      chargersList = chargersList.filter(c => {
        const dist = getDistance(originLat, originLng, c.lat, c.lng);
        // Attach distance
        if (c._doc) {
          c._doc.distance = dist;
        } else {
          c.distance = dist;
        }
        return dist <= maxDist;
      });

      chargersList.sort((a, b) => {
        const distA = a._doc ? a._doc.distance : a.distance;
        const distB = b._doc ? b._doc.distance : b.distance;
        return distA - distB;
      });
    }

    res.json(chargersList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error searching chargers.' });
  }
});

// @route   GET /api/chargers/:id
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const charger = await Charger.findById(req.params.id).populate('merchantId', 'name email');
      if (!charger) {
        return res.status(404).json({ error: 'Charger listing not found.' });
      }
      return res.json(charger);
    } else {
      // Memory fallback
      const charger = MemoryStore.chargers.find(c => c._id === req.params.id);
      if (!charger) {
        return res.status(404).json({ error: 'Charger listing not found.' });
      }
      const merchant = MemoryStore.users.find(u => u._id === charger.merchantId) || { name: 'Rajesh Sharma', email: 'merchant@evnest.com' };
      return res.json({
        ...charger,
        merchantId: { _id: merchant._id, name: merchant.name, email: merchant.email }
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving charger.' });
  }
});

// @route   POST /api/chargers
router.post('/', auth, checkRole(['merchant']), async (req, res) => {
  try {
    const { title, description, address, lat, lng, connectorType, speedKw, baseElectricityCost, markupPercent, photos } = req.body;
    const calculatedPrice = baseElectricityCost * (1 + markupPercent / 100);
    const resolvedPrice = parseFloat(calculatedPrice.toFixed(2));
    const defaultPhotos = photos || ['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80'];

    if (mongoose.connection.readyState === 1) {
      const charger = new Charger({
        merchantId: req.user._id,
        title,
        description,
        address,
        lat,
        lng,
        connectorType,
        speedKw,
        baseElectricityCost,
        markupPercent,
        pricePerKwh: resolvedPrice,
        photos: defaultPhotos,
        isLive: true
      });

      await charger.save();
      return res.status(201).json(charger);
    } else {
      // Memory fallback
      const mockId = `chg_${Math.random().toString(36).substr(2, 9)}`;
      const newCharger = {
        _id: mockId,
        merchantId: req.user._id,
        title,
        description,
        address,
        lat: Number(lat),
        lng: Number(lng),
        connectorType,
        speedKw: Number(speedKw),
        baseElectricityCost: Number(baseElectricityCost),
        markupPercent: Number(markupPercent),
        pricePerKwh: resolvedPrice,
        photos: defaultPhotos,
        isLive: true,
        createdAt: new Date()
      };

      MemoryStore.chargers.push(newCharger);
      return res.status(201).json(newCharger);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating charger listing.' });
  }
});

// @route   PUT /api/chargers/:id
router.put('/:id', auth, checkRole(['merchant']), async (req, res) => {
  try {
    const { title, description, address, lat, lng, connectorType, speedKw, baseElectricityCost, markupPercent, photos } = req.body;
    const calculatedPrice = baseElectricityCost * (1 + markupPercent / 100);
    const resolvedPrice = parseFloat(calculatedPrice.toFixed(2));

    if (mongoose.connection.readyState === 1) {
      let charger = await Charger.findById(req.params.id);
      if (!charger) {
        return res.status(404).json({ error: 'Charger listing not found.' });
      }

      if (charger.merchantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to update this listing.' });
      }

      charger.title = title || charger.title;
      charger.description = description || charger.description;
      charger.address = address || charger.address;
      charger.lat = lat !== undefined ? lat : charger.lat;
      charger.lng = lng !== undefined ? lng : charger.lng;
      charger.connectorType = connectorType || charger.connectorType;
      charger.speedKw = speedKw !== undefined ? speedKw : charger.speedKw;
      charger.baseElectricityCost = baseElectricityCost !== undefined ? baseElectricityCost : charger.baseElectricityCost;
      charger.markupPercent = markupPercent !== undefined ? markupPercent : charger.markupPercent;
      charger.pricePerKwh = resolvedPrice;
      if (photos) charger.photos = photos;

      await charger.save();
      return res.json(charger);
    } else {
      // Memory fallback
      const chargerIndex = MemoryStore.chargers.findIndex(c => c._id === req.params.id);
      if (chargerIndex === -1) {
        return res.status(404).json({ error: 'Charger listing not found.' });
      }

      const charger = MemoryStore.chargers[chargerIndex];
      if (charger.merchantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to update this listing.' });
      }

      const updatedCharger = {
        ...charger,
        title: title || charger.title,
        description: description || charger.description,
        address: address || charger.address,
        lat: lat !== undefined ? Number(lat) : charger.lat,
        lng: lng !== undefined ? Number(lng) : charger.lng,
        connectorType: connectorType || charger.connectorType,
        speedKw: speedKw !== undefined ? Number(speedKw) : charger.speedKw,
        baseElectricityCost: baseElectricityCost !== undefined ? Number(baseElectricityCost) : charger.baseElectricityCost,
        markupPercent: markupPercent !== undefined ? Number(markupPercent) : charger.markupPercent,
        pricePerKwh: resolvedPrice,
        photos: photos || charger.photos
      };

      MemoryStore.chargers[chargerIndex] = updatedCharger;
      return res.json(updatedCharger);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating charger listing.' });
  }
});

// @route   PATCH /api/chargers/:id/toggle
router.patch('/:id/toggle', auth, checkRole(['merchant']), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const charger = await Charger.findById(req.params.id);
      if (!charger) {
        return res.status(404).json({ error: 'Charger listing not found.' });
      }

      if (charger.merchantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to modify this listing.' });
      }

      charger.isLive = !charger.isLive;
      await charger.save();
      return res.json(charger);
    } else {
      // Memory fallback
      const chargerIndex = MemoryStore.chargers.findIndex(c => c._id === req.params.id);
      if (chargerIndex === -1) {
        return res.status(404).json({ error: 'Charger listing not found.' });
      }

      const charger = MemoryStore.chargers[chargerIndex];
      if (charger.merchantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to modify this listing.' });
      }

      charger.isLive = !charger.isLive;
      return res.json(charger);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error toggling live status.' });
  }
});

// @route   DELETE /api/chargers/:id
router.delete('/:id', auth, checkRole(['merchant']), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const charger = await Charger.findById(req.params.id);
      if (!charger) {
        return res.status(404).json({ error: 'Charger listing not found.' });
      }

      if (charger.merchantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this listing.' });
      }

      await Charger.deleteOne({ _id: req.params.id });
      return res.json({ message: 'Charger listing deleted successfully.' });
    } else {
      // Memory fallback
      const chargerIndex = MemoryStore.chargers.findIndex(c => c._id === req.params.id);
      if (chargerIndex === -1) {
        return res.status(404).json({ error: 'Charger listing not found.' });
      }

      const charger = MemoryStore.chargers[chargerIndex];
      if (charger.merchantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this listing.' });
      }

      MemoryStore.chargers.splice(chargerIndex, 1);
      return res.json({ message: 'Charger listing deleted successfully.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting charger listing.' });
  }
});

module.exports = router;
