/**
 * Order Controller
 */

const { createOrderTransaction, getOrdersByUser, getOrderById } = require('../models/orderModel');

async function createOrder(req, res) {
  try {
    const { customerEmail, shippingAddress, items } = req.body || {};
    const email = customerEmail || (req.user ? req.user.email : null);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: customerEmail is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: items array must contain at least one product'
      });
    }

    const order = await createOrderTransaction({
      userId: req.user ? req.user.id : null,
      customerEmail: email,
      shippingAddress: shippingAddress || 'Standard Delivery',
      items
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function getMyOrders(req, res) {
  try {
    const orders = await getOrdersByUser(req.user.id);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getOrder(req, res) {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    // Authorization check
    if (req.user.role !== 'ADMIN' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this order' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrder
};
