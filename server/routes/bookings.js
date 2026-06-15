const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const MemoryStore = require('../models/MemoryStore');
const { auth, checkRole } = require('../middleware/auth');

// @route   POST /api/bookings
router.post('/', auth, async (req, res) => {
  try {
    const { chargerId, scheduledAt, durationMinutes, estimatedCost } = req.body;

    if (mongoose.connection.readyState === 1) {
      const charger = await Charger.findById(chargerId);
      if (!charger) {
        return res.status(404).json({ error: 'Charger not found.' });
      }

      if (!charger.isLive) {
        return res.status(400).json({ error: 'This charger is currently offline.' });
      }

      const booking = new Booking({
        userId: req.user._id,
        chargerId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes,
        estimatedCost,
        status: 'pending',
        paymentId: `pay_mock_${Math.random().toString(36).substr(2, 9)}`
      });

      await booking.save();
      return res.status(201).json(booking);
    } else {
      // Memory fallback
      const charger = MemoryStore.chargers.find(c => c._id === chargerId);
      if (!charger) {
        return res.status(404).json({ error: 'Charger not found.' });
      }

      if (!charger.isLive) {
        return res.status(400).json({ error: 'This charger is currently offline.' });
      }

      const mockId = `bk_${Math.random().toString(36).substr(2, 9)}`;
      const newBooking = {
        _id: mockId,
        userId: req.user._id,
        chargerId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: Number(durationMinutes),
        estimatedCost: Number(estimatedCost),
        status: 'pending',
        paymentId: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };

      MemoryStore.bookings.push(newBooking);
      return res.status(201).json(newBooking);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating booking.' });
  }
});

// @route   GET /api/bookings/me
router.get('/me', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const bookings = await Booking.find({ userId: req.user._id })
        .populate({
          path: 'chargerId',
          populate: { path: 'merchantId', select: 'name email' }
        })
        .sort({ createdAt: -1 });
      return res.json(bookings);
    } else {
      // Memory fallback
      const userBookings = MemoryStore.bookings
        .filter(b => b.userId === req.user._id)
        .map(b => {
          const charger = MemoryStore.chargers.find(c => c._id === b.chargerId);
          let populatedCharger = null;
          if (charger) {
            const host = MemoryStore.users.find(u => u._id === charger.merchantId) || { name: 'Rajesh Sharma', email: 'merchant@evnest.com' };
            populatedCharger = {
              ...charger,
              merchantId: { _id: host._id, name: host.name, email: host.email }
            };
          }
          return {
            ...b,
            chargerId: populatedCharger
          };
        });
      
      // Sort desc by date
      userBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(userBookings);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving bookings.' });
  }
});

// @route   GET /api/bookings/merchant
router.get('/merchant', auth, checkRole(['merchant']), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const chargers = await Charger.find({ merchantId: req.user._id });
      const chargerIds = chargers.map(c => c._id);

      const bookings = await Booking.find({ chargerId: { $in: chargerIds } })
        .populate('userId', 'name email carModel')
        .populate('chargerId')
        .sort({ createdAt: -1 });

      return res.json(bookings);
    } else {
      // Memory fallback — find chargers owned by this merchant
      const merchantChargers = MemoryStore.chargers.filter(c => c.merchantId === req.user._id);
      const merchantChargerIds = merchantChargers.map(c => c._id);

      // If merchant has no chargers (e.g. new dynamic demo account), show all bookings
      const targetIds = merchantChargerIds.length > 0
        ? merchantChargerIds
        : MemoryStore.chargers.map(c => c._id);

      const merchantBookings = MemoryStore.bookings
        .filter(b => targetIds.includes(b.chargerId))
        .map(b => {
          const driver = MemoryStore.users.find(u => u._id === b.userId) || {
            _id: b.userId,
            name: 'Amit Patel',
            email: 'driver@evnest.com',
            carModel: 'Tata Nexon EV Max'
          };
          const charger = MemoryStore.chargers.find(c => c._id === b.chargerId);
          const hostUser = charger
            ? (MemoryStore.users.find(u => u._id === charger.merchantId) || { name: 'Demo Host' })
            : { name: 'Demo Host' };
          return {
            ...b,
            userId: {
              _id: driver._id,
              name: driver.name,
              email: driver.email,
              carModel: driver.carModel || 'EV'
            },
            chargerId: charger
              ? { ...charger, merchantId: { _id: hostUser._id, name: hostUser.name } }
              : null
          };
        });

      merchantBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(merchantBookings);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving merchant bookings.' });
  }
});

// @route   PATCH /api/bookings/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status.' });
    }

    if (mongoose.connection.readyState === 1) {
      const booking = await Booking.findById(req.params.id).populate('chargerId');
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      const isDriver = booking.userId.toString() === req.user._id.toString();
      const isMerchant = booking.chargerId.merchantId.toString() === req.user._id.toString();

      if (!isDriver && !isMerchant) {
        return res.status(403).json({ error: 'Not authorized to change this booking status.' });
      }

      if (isDriver && !isMerchant && status !== 'cancelled') {
        return res.status(403).json({ error: 'Drivers can only cancel bookings.' });
      }

      booking.status = status;
      await booking.save();
      return res.json(booking);
    } else {
      // Memory fallback
      const bookingIndex = MemoryStore.bookings.findIndex(b => b._id === req.params.id);
      if (bookingIndex === -1) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      const booking = MemoryStore.bookings[bookingIndex];
      const charger = MemoryStore.chargers.find(c => c._id === booking.chargerId);
      
      const isDriver = booking.userId === req.user._id;
      const isMerchant = charger && charger.merchantId === req.user._id;

      if (!isDriver && !isMerchant) {
        return res.status(403).json({ error: 'Not authorized to change this booking status.' });
      }

      if (isDriver && !isMerchant && status !== 'cancelled') {
        return res.status(403).json({ error: 'Drivers can only cancel bookings.' });
      }

      booking.status = status;
      MemoryStore.bookings[bookingIndex] = booking;
      return res.json(booking);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating booking status.' });
  }
});

module.exports = router;
