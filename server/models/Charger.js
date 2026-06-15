const mongoose = require('mongoose');

const ChargerSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  connectorType: {
    type: String,
    enum: ['Type2', 'CCS', 'CHAdeMO', 'Bharat AC'],
    required: true,
  },
  speedKw: {
    type: Number,
    required: true,
  },
  baseElectricityCost: {
    type: Number,
    required: true,
  },
  markupPercent: {
    type: Number,
    required: true,
    default: 20,
  },
  pricePerKwh: {
    type: Number,
    required: true,
  },
  photos: [{
    type: String,
  }],
  isLive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Charger', ChargerSchema);
