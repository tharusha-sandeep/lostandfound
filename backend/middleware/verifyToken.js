'use strict';

const jwt = require('jsonwebtoken');

/**
 * verifyToken.js
 * Production JWT middleware. Validates the Bearer token in the Authorization
 * header and populates req.user with the decoded payload.
 *
 * Expected req.user shape (must match mockAuth):
 *   { _id: String, name: String, email: String, role: 'student'|'admin' }
 *
 * // TODO Week 11: Replace secret with shared JWT_SECRET from auth module
 */

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = {
  ...decoded,
  _id: decoded.id  // map id → _id so postController works
};
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;
