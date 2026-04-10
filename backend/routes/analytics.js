'use strict';

const express = require('express');
const router  = express.Router();
const Post    = require('../models/Post');
const User    = require('../models/User');
const Claim   = require('../models/Claim');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

// ─── Helper: build date $match from ?range= query ────────────────────────────
function dateMatch(range, field = 'createdAt') {
  const days = parseInt(range, 10);
  if (!range || range === 'all' || isNaN(days)) return {};
  return { [field]: { $gte: new Date(Date.now() - days * 864e5) } };
}

// ─── GET /api/analytics/summary ───────────────────────────────────────────────
// Top-level KPI cards
router.get('/summary', async (req, res, next) => {
  try {
    const { range = 'all' } = req.query;
    const dm = dateMatch(range);

    const [
      postStats,
      claimStats,
      userStats,
      resolutionTime,
    ] = await Promise.all([
      // Post breakdown by type & status
      Post.aggregate([
        { $match: { isDeleted: false, ...dm } },
        { $group: {
            _id: { type: '$type', status: '$status' },
            count: { $sum: 1 },
        }},
      ]),

      // Claim breakdown by status
      Claim.aggregate([
        { $match: dm },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // User stats
      User.aggregate([
        { $match: { role: 'student', ...dm } },
        { $group: {
            _id: null,
            total: { $sum: 1 },
            banned: { $sum: { $cond: ['$isBanned', 1, 0] } },
        }},
      ]),

      // Average resolution time (resolved posts: incidentDate → resolvedAt via Claim)
      Claim.aggregate([
        { $match: { status: 'approved', resolvedAt: { $ne: null } } },
        { $lookup: {
            from: 'posts',
            localField: 'postId',
            foreignField: '_id',
            as: 'post',
        }},
        { $unwind: '$post' },
        { $project: {
            daysToResolve: {
              $divide: [
                { $subtract: ['$resolvedAt', '$post.incidentDate'] },
                864e5,
              ],
            },
        }},
        { $group: {
            _id: null,
            avgDays: { $avg: '$daysToResolve' },
            minDays: { $min: '$daysToResolve' },
            maxDays: { $max: '$daysToResolve' },
        }},
      ]),
    ]);

    // Reshape post stats
    const posts = { lost: {}, found: {} };
    let totalPosts = 0;
    for (const { _id, count } of postStats) {
      posts[_id.type][_id.status] = count;
      totalPosts += count;
    }

    const claims = {};
    let totalClaims = 0;
    for (const { _id, count } of claimStats) {
      claims[_id] = count;
      totalClaims += count;
    }

    const users = userStats[0] ?? { total: 0, banned: 0 };
    const rt    = resolutionTime[0] ?? { avgDays: 0, minDays: 0, maxDays: 0 };

    // Resolution rate = resolved posts / total posts
    const resolvedPosts =
      (posts.lost.resolved ?? 0) + (posts.found.resolved ?? 0);
    const resolutionRate = totalPosts
      ? Math.round((resolvedPosts / totalPosts) * 100)
      : 0;

    // Claim approval rate
    const approvalRate = totalClaims
      ? Math.round(((claims.approved ?? 0) / totalClaims) * 100)
      : 0;

    res.json({
      posts: { ...posts, total: totalPosts },
      claims: { ...claims, total: totalClaims },
      users,
      resolutionRate,
      approvalRate,
      avgResolutionDays: Math.round((rt.avgDays ?? 0) * 10) / 10,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/analytics/trends ────────────────────────────────────────────────
// Posts and claims over time (daily/weekly buckets)
router.get('/trends', async (req, res, next) => {
  try {
    const { range = '30', bucket = 'day' } = req.query;
    const dm = dateMatch(range);

    const dateTrunc = bucket === 'week'
      ? { $dateToString: { format: '%Y-%U', date: '$createdAt' } }
      : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const [postTrend, claimTrend] = await Promise.all([
      Post.aggregate([
        { $match: { isDeleted: false, ...dm } },
        { $group: {
            _id: { date: dateTrunc, type: '$type' },
            count: { $sum: 1 },
        }},
        { $sort: { '_id.date': 1 } },
      ]),
      Claim.aggregate([
        { $match: dm },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Merge into unified date series
    const dateMap = {};
    for (const { _id, count } of postTrend) {
      if (!dateMap[_id.date]) dateMap[_id.date] = { date: _id.date, lost: 0, found: 0, claims: 0 };
      dateMap[_id.date][_id.type] = count;
    }
    for (const { _id, count } of claimTrend) {
      if (!dateMap[_id]) dateMap[_id] = { date: _id, lost: 0, found: 0, claims: 0 };
      dateMap[_id].claims = count;
    }

    const series = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    res.json({ series });
  } catch (err) { next(err); }
});

// ─── GET /api/analytics/zones ─────────────────────────────────────────────────
// Items by zone — hotspot analysis
router.get('/zones', async (req, res, next) => {
  try {
    const { range = 'all' } = req.query;
    const dm = dateMatch(range, 'incidentDate');

    const [zoneBreakdown, zoneResolution] = await Promise.all([
      Post.aggregate([
        { $match: { isDeleted: false, ...dm } },
        { $group: {
            _id: { zone: '$zone', type: '$type', status: '$status' },
            count: { $sum: 1 },
        }},
      ]),
      // Resolution rate per zone
      Post.aggregate([
        { $match: { isDeleted: false, ...dm } },
        { $group: {
            _id: '$zone',
            total:    { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        }},
      ]),
    ]);

    // Build zone map
    const zones = {};
    for (const { _id, count } of zoneBreakdown) {
      if (!zones[_id.zone]) zones[_id.zone] = { zone: _id.zone, lost: 0, found: 0, resolved: 0, matched: 0, open: 0, total: 0, resolutionRate: 0 };
      zones[_id.zone][_id.type] = (zones[_id.zone][_id.type] ?? 0) + count;
      zones[_id.zone][_id.status] = (zones[_id.zone][_id.status] ?? 0) + count;
      zones[_id.zone].total += count;
    }
    for (const { _id, total, resolved } of zoneResolution) {
      if (zones[_id]) {
        zones[_id].resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
      }
    }

    res.json({ zones: Object.values(zones).sort((a, b) => b.total - a.total) });
  } catch (err) { next(err); }
});

// ─── GET /api/analytics/categories ───────────────────────────────────────────
// Category breakdown + recovery rates
router.get('/categories', async (req, res, next) => {
  try {
    const { range = 'all' } = req.query;
    const dm = dateMatch(range, 'incidentDate');

    const data = await Post.aggregate([
      { $match: { isDeleted: false, ...dm } },
      { $group: {
          _id: { category: '$category', type: '$type', status: '$status' },
          count: { $sum: 1 },
          avgMatchCount: { $avg: '$matchCount' },
      }},
    ]);

    const cats = {};
    for (const { _id, count, avgMatchCount } of data) {
      if (!cats[_id.category]) cats[_id.category] = {
        category: _id.category, lost: 0, found: 0,
        resolved: 0, matched: 0, open: 0, total: 0,
        avgMatchCount: 0, recoveryRate: 0,
      };
      cats[_id.category][_id.type]   += count;
      cats[_id.category][_id.status] += count;
      cats[_id.category].total       += count;
      cats[_id.category].avgMatchCount = Math.round(avgMatchCount * 10) / 10;
    }
    // Recovery rate = resolved / lost (items reported lost that got resolved)
    for (const c of Object.values(cats)) {
      c.recoveryRate = c.lost ? Math.round((c.resolved / c.lost) * 100) : 0;
    }

    res.json({ categories: Object.values(cats).sort((a, b) => b.total - a.total) });
  } catch (err) { next(err); }
});

// ─── GET /api/analytics/timing ────────────────────────────────────────────────
// Day-of-week and hour-of-day incident patterns
router.get('/timing', async (req, res, next) => {
  try {
    const { range = 'all' } = req.query;
    const dm = dateMatch(range, 'incidentDate');

    const [byDow, reportingLag] = await Promise.all([
      // Incidents by day of week (0=Sun … 6=Sat)
      Post.aggregate([
        { $match: { isDeleted: false, ...dm } },
        { $group: {
            _id: {
              dow:  { $dayOfWeek: '$incidentDate' },
              type: '$type',
            },
            count: { $sum: 1 },
        }},
        { $sort: { '_id.dow': 1 } },
      ]),
      // Reporting lag: days between incidentDate and createdAt
      Post.aggregate([
        { $match: { isDeleted: false, ...dm } },
        { $project: {
            type: 1,
            lagDays: {
              $divide: [
                { $subtract: ['$createdAt', '$incidentDate'] },
                864e5,
              ],
            },
        }},
        { $group: {
            _id: '$type',
            avgLag: { $avg: '$lagDays' },
            medianBucket: {
              // bucket into 0–1, 1–3, 3–7, 7+ days
              $push: '$lagDays',
            },
        }},
      ]),
    ]);

    const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowMap = {};
    for (const { _id, count } of byDow) {
      const name = DOW_NAMES[_id.dow - 1] ?? 'Unknown';
      if (!dowMap[name]) dowMap[name] = { day: name, lost: 0, found: 0 };
      dowMap[name][_id.type] = count;
    }
    const dowSeries = DOW_NAMES.map((d) => dowMap[d] ?? { day: d, lost: 0, found: 0 });

    // Lag buckets
    const lagBuckets = { '0–1d': 0, '1–3d': 0, '3–7d': 0, '7d+': 0 };
    for (const { medianBucket } of reportingLag) {
      for (const lag of medianBucket) {
        if      (lag <= 1)  lagBuckets['0–1d']++;
        else if (lag <= 3)  lagBuckets['1–3d']++;
        else if (lag <= 7)  lagBuckets['3–7d']++;
        else                lagBuckets['7d+']++;
      }
    }

    const avgLags = {};
    for (const { _id, avgLag } of reportingLag) {
      avgLags[_id] = Math.round(avgLag * 10) / 10;
    }

    res.json({ dowSeries, lagBuckets, avgLags });
  } catch (err) { next(err); }
});

// ─── GET /api/analytics/users ─────────────────────────────────────────────────
// User engagement — top reporters, faculty breakdown
router.get('/users', async (req, res, next) => {
  try {
    const { range = 'all' } = req.query;
    const dm = dateMatch(range);

    const [facultyBreakdown, topReporters, registrationTrend] = await Promise.all([
      // Posts by faculty (joined via author)
      Post.aggregate([
        { $match: { isDeleted: false, ...dm } },
        { $lookup: { from: 'users', localField: 'authorId', foreignField: '_id', as: 'author' } },
        { $unwind: '$author' },
        { $group: {
            _id: { faculty: '$author.faculty', type: '$type' },
            count: { $sum: 1 },
        }},
      ]),

      // Top 10 most active users by post count
      Post.aggregate([
        { $match: { isDeleted: false, ...dm } },
        { $group: {
            _id: '$authorId',
            postCount: { $sum: 1 },
            lostCount: { $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] } },
            foundCount: { $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] } },
        }},
        { $sort: { postCount: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: {
            name: '$user.name',
            faculty: '$user.faculty',
            postCount: 1, lostCount: 1, foundCount: 1,
        }},
      ]),

      // New user registrations over time
      User.aggregate([
        { $match: { role: 'student', ...dm } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Faculty map
    const faculties = {};
    for (const { _id, count } of facultyBreakdown) {
      if (!faculties[_id.faculty]) faculties[_id.faculty] = { faculty: _id.faculty, lost: 0, found: 0, total: 0 };
      faculties[_id.faculty][_id.type] += count;
      faculties[_id.faculty].total     += count;
    }

    res.json({
      facultyBreakdown: Object.values(faculties).sort((a, b) => b.total - a.total),
      topReporters,
      registrationTrend: registrationTrend.map(r => ({ date: r._id, count: r.count })),
    });
  } catch (err) { next(err); }
});

// ─── GET /api/analytics/health ────────────────────────────────────────────────
// Data quality / missing-field audit
router.get('/health', async (req, res, next) => {
  try {
    const [missingImg, staleOpen, highMatchLowResolution] = await Promise.all([
      // Posts with no images
      Post.countDocuments({ isDeleted: false, imageUrls: { $size: 0 } }),

      // Open posts older than 30 days (stale)
      Post.countDocuments({
        isDeleted: false,
        status: 'open',
        createdAt: { $lt: new Date(Date.now() - 30 * 864e5) },
      }),

      // Posts with matchCount > 2 but still open (high interest, unresolved)
      Post.countDocuments({
        isDeleted: false,
        status: 'open',
        matchCount: { $gt: 2 },
      }),
    ]);

    res.json({ missingImg, staleOpen, highMatchLowResolution });
  } catch (err) { next(err); }
});

module.exports = router;
