const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const MemoryStore = require('../models/MemoryStore');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token, authorization denied.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'evnest_super_secret_key_12345');
    
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-password');
    } else {
      // Offline fallback
      user = MemoryStore.users.find(u => u._id === decoded.id);
      if (user) {
        // Create user shell without password
        const { password, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Token is valid, but user could not be found.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token validation failed, authorization denied.' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions.' });
    }
    next();
  }
};

module.exports = { auth, checkRole };
