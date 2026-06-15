const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  chargerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charger',
    required: true,
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
  },
  estimatedCost: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentId: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', BookingSchema);
