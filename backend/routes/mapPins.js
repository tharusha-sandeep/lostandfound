'use strict';

const express = require('express');
const router  = express.Router();

const MapPin = require('../models/MapPin');
const Post   = require('../models/Post');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_FLOORS = ['b', '1', '2', '3', '4', '5', '6', '7'];

/**
 * Build a date-range filter from a ?range= query param.
 * Supported values: 1d | 7d | 30d | 90d | 180d | 365d | all
 */
function buildDateFilter(range) {
  if (!range || range === 'all') return {};
  const days = parseInt(range, 10);
  if (isNaN(days)) return {};
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { incidentDate: { $gte: since } };
}

// ─── GET /api/mappins  (all roles — authenticated) ────────────────────────────
// Returns pins suitable for heatmap rendering.
// Query params:
//   floor  – filter by floor (optional)
//   range  – 1d | 7d | 30d | 90d | 180d | 365d | all  (default: all)
//   type   – lost | found | both                        (default: both)
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.floor && VALID_FLOORS.includes(req.query.floor)) {
      filter.floor = req.query.floor;
    }

    if (req.query.type && req.query.type !== 'both') {
      filter.postType = req.query.type;
    }

    Object.assign(filter, buildDateFilter(req.query.range));

    const pins = await MapPin.find(filter)
      .populate('postId', 'title category status type incidentDate')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ count: pins.length, pins });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/mappins  (admin only) ─────────────────────────────────────────
// Body: { postId, floor, x, y }
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { postId, floor, x, y } = req.body;

    if (!postId || !floor || x == null || y == null) {
      return res.status(400).json({ message: 'postId, floor, x and y are required.' });
    }

    if (!VALID_FLOORS.includes(String(floor))) {
      return res.status(400).json({ message: `floor must be one of: ${VALID_FLOORS.join(', ')}` });
    }

    if (x < 0 || x > 1 || y < 0 || y > 1) {
      return res.status(400).json({ message: 'x and y must be fractions between 0 and 1.' });
    }

    // Load the post to denormalise key fields
    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Upsert: update the pin if one already exists for this post
    const pin = await MapPin.findOneAndUpdate(
      { postId },
      {
        postId,
        floor: String(floor),
        x: Number(x),
        y: Number(y),
        postType:     post.type,
        postStatus:   post.status,
        incidentDate: post.incidentDate,
        pinnedBy:     req.user.id || req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Pin saved.', pin });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/mappins/:id  (admin only) ────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const pin = await MapPin.findByIdAndDelete(req.params.id);
    if (!pin) return res.status(404).json({ message: 'Pin not found.' });
    res.json({ message: 'Pin removed.' });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/mappins/sync-status (admin only) ──────────────────────────────
// Utility: sync postStatus on all pins from their parent posts (run ad-hoc).
router.patch('/sync-status', protect, adminOnly, async (req, res, next) => {
  try {
    const pins = await MapPin.find({});
    let updated = 0;
    for (const pin of pins) {
      const post = await Post.findById(pin.postId);
      if (post && post.status !== pin.postStatus) {
        pin.postStatus = post.status;
        await pin.save();
        updated++;
      }
    }
    res.json({ message: `Synced ${updated} pins.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;