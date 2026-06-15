const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const MemoryStore = require('../models/MemoryStore');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'evnest_super_secret_key_12345',
    { expiresIn: '7d' }
  );
};

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, carModel, batteryCapacityKwh } = req.body;
    const cleanEmail = (email || 'user@evnest.com').trim().toLowerCase();
    const cleanName = name || 'Demo User';
    const cleanRole = role || 'user';

    // In frictionless P2P demo, check MemoryStore first
    let user = MemoryStore.users.find(u => u.email === cleanEmail);
    if (!user) {
      user = {
        _id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        name: cleanName,
        email: cleanEmail,
        password: password || 'password123',
        role: cleanRole,
        carModel: cleanRole === 'user' ? (carModel || 'Tata Nexon EV') : undefined,
        batteryCapacityKwh: cleanRole === 'user' ? Number(batteryCapacityKwh || 40.5) : undefined,
        createdAt: new Date()
      };
      MemoryStore.users.push(user);
    } else {
      // Overwrite/update existing user with new registration details (frictionless P2P demo)
      user.name = cleanName;
      user.role = cleanRole;
      user.carModel = cleanRole === 'user' ? (carModel || 'Tata Nexon EV') : undefined;
      user.batteryCapacityKwh = cleanRole === 'user' ? Number(batteryCapacityKwh || 40.5) : undefined;
      if (password) user.password = password;
    }

    const token = generateToken(user);
    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        carModel: user.carModel,
        batteryCapacityKwh: user.batteryCapacityKwh
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || 'driver@evnest.com').trim().toLowerCase();

    // In frictionless P2P demo, find or create on the fly
    let user = MemoryStore.users.find(u => u.email === cleanEmail);
    if (!user) {
      // Auto-create on the fly
      // Check if email has "merchant", "host", or "owner" to designate a merchant role
      const isMerchant = cleanEmail.includes('merchant') || cleanEmail.includes('host') || cleanEmail.includes('owner');
      const role = isMerchant ? 'merchant' : 'user';
      user = {
        _id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        name: isMerchant ? 'Demo Host' : 'Demo Driver',
        email: cleanEmail,
        password: password || 'password123',
        role: role,
        carModel: role === 'user' ? 'Tata Nexon EV Max' : undefined,
        batteryCapacityKwh: role === 'user' ? 40.5 : undefined,
        createdAt: new Date()
      };
      MemoryStore.users.push(user);
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        carModel: user.carModel,
        batteryCapacityKwh: user.batteryCapacityKwh
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
