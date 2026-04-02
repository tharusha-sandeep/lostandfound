'use strict';

const { Router } = require('express');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateRequest');
const v        = require('../validators/postValidators');
const ctrl          = require('../controllers/postController');
const matchCtrl     = require('../controllers/matchController');

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/posts — browse with filters, pagination, full-text search
router.get('/', v.queryFilters, validate, ctrl.getPosts);

// ── Authenticated ─────────────────────────────────────────────────────────────

// GET /api/posts/mine — posts belonging to the current user
router.get('/mine', protect, ctrl.getMyPosts);

// GET /api/posts/:id — single post detail
router.get('/:id', ctrl.getPostById);

// POST /api/posts — create a new post
router.post('/', protect, v.createPost, validate, ctrl.createPost);

// PUT /api/posts/:id — edit a post (owner only)
router.put('/:id', protect, v.updatePost, validate, ctrl.updatePost);

// DELETE /api/posts/:id — soft-delete a post (owner only)
router.delete('/:id', protect, ctrl.deletePost);

// PATCH /api/posts/:id/status — status transition (admin only)
router.patch('/:id/status', protect, v.updateStatus, validate, ctrl.updateStatus);

// GET /api/posts/:id/matches — owner or admin
router.get('/:id/matches', protect, matchCtrl.getMatchesForPost);

module.exports = router;