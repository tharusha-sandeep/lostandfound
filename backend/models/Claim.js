'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClaimSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    claimantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // private identifying detail — not shown publicly
    identifyingDetail: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'Please provide more detail to verify your claim'],
      maxlength: [500, 'Detail must be under 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

// one claim per user per post
ClaimSchema.index(
  { postId: 1, claimantId: 1 },
  { unique: true, name: 'one_claim_per_user_per_post' }
);

module.exports = mongoose.model('Claim', ClaimSchema);