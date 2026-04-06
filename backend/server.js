'use strict';

// Must be required FIRST so async route errors are forwarded to errorHandler
require('express-async-errors');

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();
const { initEmailListeners } = require('./services/emailNotificationService');
initEmailListeners();

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();

// ─── Shared Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const claimRoutes = require('./routes/claims');
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/claims', claimRoutes);

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Post & Discovery API running on port ${PORT}`);
});

module.exports = app; // exported for testing
