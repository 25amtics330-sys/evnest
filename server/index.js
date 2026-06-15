require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const chargerRoutes = require('./routes/chargers');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'EVNest Backend' });
});

// Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);

// Start server immediately to keep application responsive from second 1
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Connect to MongoDB asynchronously in the background
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/evnest';
  console.log('Connecting to MongoDB in background at:', mongoUri);
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB successfully!');
    })
    .catch((err) => {
      console.warn('[Warning] Database is offline, but server is fully active in mock-db demo mode.');
    });
});
