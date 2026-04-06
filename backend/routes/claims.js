'use strict';

const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Post = require('../models/Post');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const { adminOnly } = require('../middleware/authMiddleware');
const {
  sendClaimStatusEmail,
  sendNewClaimAlertEmail,
  sendFinderNotificationEmail,
} = require('../utils/emailService');
// ─── SUBMIT A CLAIM ──────────────────────────────────────
// POST /api/claims
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { postId, identifyingDetail } = req.body;
    const claimantId = req.user.id || req.user._id;

    // check post exists
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // cant claim your own post
    if (post.authorId.toString() === claimantId.toString()) {
      return res.status(400).json({ message: 'You cannot claim your own post' });
    }

    // post must be open or matched
    if (post.status === 'resolved') {
      return res.status(400).json({ message: 'This post has already been resolved' });
    }

    // check if already claimed
    const existing = await Claim.findOne({ postId, claimantId });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a claim for this post' });
    }

    // validate identifying detail
    if (!identifyingDetail || identifyingDetail.trim().length < 10) {
      return res.status(400).json({ message: 'Please provide more detail to verify your claim (min 10 characters)' });
    }

    // create claim
    const claim = await Claim.create({
      postId,
      claimantId,
      identifyingDetail: identifyingDetail.trim(),
    });

    // get claimant details for email
    const claimant = await User.findById(claimantId).select('name email');

    // notify admin via email
    await sendNewClaimAlertEmail(post.title, claimant.name, claimant.email);

    res.status(201).json({
      message: 'Claim submitted successfully. Admin will review and contact you.',
      claim,
    });

  } catch (err) {
    // handle duplicate claim error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted a claim for this post' });
    }
    next(err);
  }
});

// ─── GET MY CLAIMS ───────────────────────────────────────
// GET /api/claims/mine
router.get('/mine', verifyToken, async (req, res, next) => {
  try {
    const claimantId = req.user.id || req.user._id;

    const claims = await Claim.find({ claimantId })
      .populate('postId', 'title category zone type status imageUrls')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ claims, total: claims.length });

  } catch (err) {
    next(err);
  }
});

// ─── GET ALL CLAIMS (ADMIN) ──────────────────────────────
// GET /api/claims
router.get('/', verifyToken, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const claims = await Claim.find(filter)
      .populate('postId', 'title category zone type status imageUrls authorId')
      .populate('claimantId', 'name email faculty')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ claims, total: claims.length });

  } catch (err) {
    next(err);
  }
});

// ─── GET SINGLE CLAIM (ADMIN) ────────────────────────────
// GET /api/claims/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('postId', 'title description category zone type status imageUrls authorId incidentDate')
      .populate('claimantId', 'name email faculty')
      .lean();

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // only admin or the claimant can view
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin';
    const isClaimant = claim.claimantId._id.toString() === userId.toString();

    if (!isAdmin && !isClaimant) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    res.json(claim);

  } catch (err) {
    next(err);
  }
});

// ─── APPROVE / REJECT CLAIM (ADMIN) ─────────────────────
// PATCH /api/claims/:id
router.patch('/:id', verifyToken, adminOnly, async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const adminId = req.user.id || req.user._id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const claim = await Claim.findById(req.params.id)
      .populate('postId', 'title authorId status')
      .populate('claimantId', 'name email');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: 'Claim has already been reviewed' });
    }

    // update claim
    claim.status = status;
    claim.adminNote = adminNote || '';
    claim.resolvedAt = new Date();
    claim.resolvedBy = adminId;
    await claim.save();

    // if approved update post status to resolved
    if (status === 'approved') {
      await Post.findByIdAndUpdate(claim.postId._id, { status: 'resolved' });
    }

    // send email to claimant
await sendClaimStatusEmail(
  claim.claimantId.email,
  status,
  claim.postId.title,
  adminNote || ''
);

// if approved also email the finder (post owner)
if (status === 'approved') {
  const finder = await User.findById(claim.postId.authorId).select('name email');
  if (finder) {
    await sendFinderNotificationEmail(
      finder.email,
      finder.name,
      claim.postId.title,
      claim.claimantId.name,
      adminNote || ''
    );
  }
}

    res.json({
      message: `Claim ${status} successfully`,
      claim,
    });

  } catch (err) {
    next(err);
  }
});

// ─── DELETE A CLAIM (claimant only, pending only) ────────
// DELETE /api/claims/:id
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const claimantId = req.user.id || req.user._id;

    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.claimantId.toString() !== claimantId.toString()) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot withdraw a claim that has already been reviewed' });
    }

    await claim.deleteOne();

    res.json({ message: 'Claim withdrawn successfully' });

  } catch (err) {
    next(err);
  }
});

module.exports = router;