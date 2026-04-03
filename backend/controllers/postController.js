'use strict';

// Implemented in Layer 4 — import will resolve then
const matchService    = require('../services/matchService');
const Post            = require('../models/Post');
const MatchScoreCache = require('../models/MatchScoreCache');

// Status-transition rule table
const VALID_TRANSITIONS = {
  open:     ['matched'],
  matched:  ['open', 'resolved'],
  resolved: [],
};

// Fields callers are allowed to change via PUT
const UPDATABLE_FIELDS = [
  'title',
  'description',
  'category',
  'zone',
  'incidentDate',
  'imageUrls',
];

// ─── GET /api/posts ───────────────────────────────────────────────────────────

const getPosts = async (req, res) => {
  const {
    type, category, zone, status,
    from, to, q,
    page  = 1,
    limit = 10,
  } = req.query;

  // Build filter
  const filter = { isDeleted: false };

  if (type)     filter.type     = type;
  if (category) filter.category = category;
  if (zone)     filter.zone     = zone;

  if (status) {
    filter.status = status;
  } else {
    filter.status = { $in: ['open', 'matched'] };
  }

  if (from || to) {
    filter.incidentDate = {};
    if (from) filter.incidentDate.$gte = new Date(from);
    if (to)   filter.incidentDate.$lte = new Date(to);
  }

  if (q) {
    filter.$text = { $search: q };
  }

  // Sorting
  const sort = q
    ? { score: { $meta: 'textScore' } }
    : { createdAt: -1 };

  // Pagination
  const pageNum  = Number(page);
  const limitNum = Number(limit);
  const skip     = (pageNum - 1) * limitNum;

  const [posts, total] = await Promise.all([
    Post.find(filter, q ? { score: { $meta: 'textScore' } } : undefined)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return res.status(200).json({
    posts,
    total,
    page:  pageNum,
    pages: Math.ceil(total / limitNum),
  });
};

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────

const getPostById = async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, isDeleted: false }).lean();

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  return res.status(200).json(post);
};

// ─── GET /api/posts/mine ──────────────────────────────────────────────────────

const getMyPosts = async (req, res) => {
  const filter = { authorId: req.user.id || req.user._id, isDeleted: false };

  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).lean(),
    Post.countDocuments(filter),
  ]);

  return res.status(200).json({ posts, total });
};

// ─── POST /api/posts ──────────────────────────────────────────────────────────

const createPost = async (req, res) => {
  const post = await Post.create({
    ...req.body,
    authorId: req.user.id || req.user._id,
    status:   'open',
  });

  // Trigger match engine (stub — replaced in Layer 4)
  await matchService.runMatchFor(post);

  // Fetch fresh cache count
  const cache = await MatchScoreCache.findOne({ sourcePostId: post._id }).lean();

  return res.status(201).json({
    post,
    matchCount: cache?.matches?.length ?? 0,
  });
};

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────

const updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post || post.isDeleted) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.authorId.toString() !== (req.user.id || req.user._id)) {
    return res.status(403).json({ message: 'Not authorised' });
  }

  if (post.status === 'resolved') {
    return res.status(403).json({ message: 'Resolved posts cannot be edited' });
  }

  // Apply only allowed fields
  UPDATABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      post[field] = req.body[field];
    }
  });

  await post.save();

  // Invalidate stale match cache and re-run matching
  await MatchScoreCache.deleteOne({ sourcePostId: post._id });
  await matchService.runMatchFor(post);

  return res.status(200).json(post);
};

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────

const deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post || post.isDeleted) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.authorId.toString() !== (req.user.id || req.user._id)) {
    return res.status(403).json({ message: 'Not authorised' });
  }

  // Soft delete
  post.isDeleted = true;
  post.deletedAt = new Date();
  await post.save();

  // Remove stale match cache
  await MatchScoreCache.deleteOne({ sourcePostId: post._id });

  return res.status(200).json({ message: 'Post removed successfully' });
};

// ─── PATCH /api/posts/:id/status (admin only) ────────────────────────────────

const updateStatus = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const post = await Post.findOne({ _id: req.params.id, isDeleted: false });

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const current = post.status;
  const target  = req.body.status;

  if (!VALID_TRANSITIONS[current].includes(target)) {
    return res.status(400).json({
      message: `Cannot transition from ${current} to ${target}`,
    });
  }

  post.status = target;
  await post.save();

  return res.status(200).json(post);
};

module.exports = {
  getPosts,
  getPostById,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  updateStatus,
};
