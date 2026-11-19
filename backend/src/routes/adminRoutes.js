/**
 * Admin Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/auth');

router.get('/dashboard', authMiddleware, adminOnlyMiddleware, adminController.getDashboardSummary);

module.exports = router;
