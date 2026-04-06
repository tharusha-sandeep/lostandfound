'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * MapPin stores a geo-tagged reference to a lost/found post on a specific
 * building floor.  Coordinates are stored as fractions (0–1) of the map image
 * dimensions so they remain resolution-independent.
 */
const MapPinSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },

    // 'b' = basement, '1'–'7' = floors 1–7
    floor: {
      type: String,
      enum: ['b', '1', '2', '3', '4', '5', '6', '7'],
      required: true,
      index: true,
    },

    // Fractional position within the floor map image (0–1)
    x: { type: Number, required: true, min: 0, max: 1 },
    y: { type: Number, required: true, min: 0, max: 1 },

    // Denormalised fields copied from the post for fast heatmap queries
    postType:   { type: String, enum: ['lost', 'found'], required: true },
    postStatus: { type: String, enum: ['open', 'matched', 'resolved'], default: 'open' },
    incidentDate: { type: Date, required: true },

    // Admin who pinned it
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

MapPinSchema.index({ floor: 1, incidentDate: -1 });
MapPinSchema.index({ postId: 1 }, { unique: true }); // one pin per post

module.exports = mongoose.model('MapPin', MapPinSchema);