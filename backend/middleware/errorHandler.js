'use strict';

/**
 * errorHandler.js
 * Global Express error-handling middleware (must be 4-argument signature).
 * Mount this as the LAST app.use() in server.js.
 *
 * Handles:
 *   - Mongoose ValidationError  → 400
 *   - Mongoose Duplicate Key    → 409
 *   - Mongoose CastError        → 400
 *   - JsonWebTokenError         → 401
 *   - TokenExpiredError         → 401
 *   - Custom status codes       → custom
 *   - Everything else           → 500
 *
 * In non-production environments the error stack is included in the response
 * to aid debugging.
 */

/**
 * @param {Error} err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next  // eslint-disable-line no-unused-vars
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const isDev = process.env.NODE_ENV !== 'production';
  const stackPayload = isDev ? { stack: err.stack } : {};
  const requestId = req.headers['x-request-id'] || 'none';

  // ── Mongoose: document validation failed ──────────────────────────────────
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors:  Object.values(err.errors).map((e) => e.message),
      requestId,
      ...stackPayload,
    });
  }

  // ── Mongoose: duplicate key (unique index violation) ──────────────────────
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate entry',
      requestId,
      ...stackPayload,
    });
  }

  // ── Mongoose: bad ObjectId format ─────────────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      requestId,
      ...stackPayload,
    });
  }

  // ── JWT: Invalid signature/token ──────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      requestId,
      ...stackPayload,
    });
  }

  // ── JWT: Expired token ────────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired. Please log in again.',
      requestId,
      ...stackPayload,
    });
  }

  // ── Custom Defined HTTP Status Code ───────────────────────────────────────
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
      requestId,
      ...stackPayload,
    });
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return res.status(500).json({
    message: 'Internal server error',
    requestId,
    ...stackPayload,
  });
};

module.exports = errorHandler;
