/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

router.post('/', optionalAuthMiddleware, orderController.createOrder);
router.get('/', authMiddleware, orderController.getMyOrders);
router.get('/:id', authMiddleware, orderController.getOrder);

module.exports = router;
