const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const MemoryStore = require('../models/MemoryStore');
const { auth } = require('../middleware/auth');

// @route   POST /api/reviews/:chargerId
router.post('/:chargerId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { chargerId } = req.params;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please provide a rating between 1 and 5.' });
    }

    if (!comment) {
      return res.status(400).json({ error: 'Please provide a comment.' });
    }

    if (mongoose.connection.readyState === 1) {
      const existingReview = await Review.findOne({ userId: req.user._id, chargerId });
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this charger.' });
      }

      const review = new Review({
        userId: req.user._id,
        chargerId,
        rating,
        comment
      });

      await review.save();
      const populatedReview = await Review.findById(review._id).populate('userId', 'name');
      return res.status(201).json(populatedReview);
    } else {
      // Memory fallback
      const existingReview = MemoryStore.reviews.find(
        r => r.userId._id === req.user._id && r.chargerId === chargerId
      );
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this charger.' });
      }

      const mockId = `rev_${Math.random().toString(36).substr(2, 9)}`;
      const newReview = {
        _id: mockId,
        userId: { _id: req.user._id, name: req.user.name },
        chargerId,
        rating: Number(rating),
        comment,
        createdAt: new Date()
      };

      MemoryStore.reviews.push(newReview);
      return res.status(201).json(newReview);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating review.' });
  }
});

// @route   GET /api/reviews/:chargerId
router.get('/:chargerId', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const reviews = await Review.find({ chargerId: req.params.chargerId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 });
      return res.json(reviews);
    } else {
      // Memory fallback
      const reviewsList = MemoryStore.reviews
        .filter(r => r.chargerId === req.params.chargerId)
        .map(r => {
          // Ensure driver details are structured
          const driver = typeof r.userId === 'string' 
            ? MemoryStore.users.find(u => u._id === r.userId) || { name: 'Driver' }
            : r.userId;
          return {
            ...r,
            userId: { _id: driver._id, name: driver.name }
          };
        });
      
      reviewsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(reviewsList);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving reviews.' });
  }
});

module.exports = router;
