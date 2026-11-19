/**
 * Authentication and Authorization Middleware
 */

const { verifyToken } = require('../utils/security');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed: Missing or invalid Bearer token'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: `Authentication failed: ${err.message}`
    });
  }
}

function adminOnlyMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Administrator privileges required for this operation'
    });
  }
  next();
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch (e) {
      // Ignore invalid optional tokens
    }
  }
  next();
}

module.exports = {
  authMiddleware,
  adminOnlyMiddleware,
  optionalAuthMiddleware
};
