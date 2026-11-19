/**
 * Order Model with ACID Transactions
 */

const { query, inMemoryStore, pool } = require('../config/db');
const { getProductById } = require('./productModel');

async function createOrderTransaction({ userId, customerEmail, shippingAddress, items }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Pre-validate stock and compute total
  let totalAmount = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }
    const qty = parseInt(item.quantity, 10);
    if (qty <= 0) {
      throw new Error(`Quantity for product ${product.name} must be greater than zero`);
    }
    if (product.stock_quantity < qty) {
      throw new Error(`Insufficient inventory for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${qty}`);
    }
    const itemTotal = parseFloat(product.price) * qty;
    totalAmount += itemTotal;
    verifiedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: parseFloat(product.price)
    });
  }

  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    // In-memory mock execution
    for (const item of verifiedItems) {
      const p = inMemoryStore.products.find(x => x.id === item.productId);
      if (p) p.stock_quantity -= item.quantity;
    }
    const newOrder = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      user_id: userId || null,
      customer_email: customerEmail,
      shipping_address: shippingAddress || 'Standard Digital Delivery',
      total_amount: totalAmount.toFixed(2),
      status: 'PROCESSING',
      created_at: new Date().toISOString(),
      items: verifiedItems
    };
    inMemoryStore.orders.push(newOrder);
    return newOrder;
  }

  // PostgreSQL client transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      `INSERT INTO orders (order_number, user_id, customer_email, shipping_address, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'PROCESSING')
       RETURNING *`,
      [orderNumber, userId || null, customerEmail, shippingAddress || 'Standard Delivery', totalAmount]
    );
    const order = orderRes.rows[0];

    for (const item of verifiedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.productId, item.productName, item.quantity, item.unitPrice]
      );
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
        [item.quantity, item.productId]
      );
    }

    await client.query('COMMIT');
    order.items = verifiedItems;
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getOrdersByUser(userId) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    return inMemoryStore.orders.filter(o => o.user_id === userId);
  }
  const res = await query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
}

async function getOrderById(orderId) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    return inMemoryStore.orders.find(o => o.id === orderId || o.order_number === orderId) || null;
  }
  const orderRes = await query(`SELECT * FROM orders WHERE id = $1 OR order_number = $1`, [orderId]);
  if (!orderRes.rows[0]) return null;
  const order = orderRes.rows[0];
  const itemsRes = await query(`SELECT * FROM order_items WHERE order_id = $1`, [order.id]);
  order.items = itemsRes.rows;
  return order;
}

async function getAllOrders(limit = 50) {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    return inMemoryStore.orders.slice(0, limit);
  }
  const res = await query(`SELECT * FROM orders ORDER BY created_at DESC LIMIT $1`, [limit]);
  return res.rows;
}

module.exports = {
  createOrderTransaction,
  getOrdersByUser,
  getOrderById,
  getAllOrders
};
