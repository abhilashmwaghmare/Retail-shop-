/**
 * Admin Dashboard Controller
 */

const { query, inMemoryStore, pool } = require('../config/db');
const { getAllOrders } = require('../models/orderModel');

async function getDashboardSummary(req, res) {
  try {
    if (process.env.USE_MOCK_DB === 'true' || !pool) {
      const orders = inMemoryStore.orders;
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const lowStockProducts = inMemoryStore.products.filter(p => p.stock_quantity < 20);

      return res.json({
        success: true,
        data: {
          metrics: {
            totalRevenue: totalRevenue.toFixed(2),
            totalOrders: orders.length,
            totalProducts: inMemoryStore.products.length,
            totalUsers: inMemoryStore.users.length,
            lowStockCount: lowStockProducts.length
          },
          lowStockProducts,
          recentOrders: orders.slice(0, 10)
        }
      });
    }

    const revenueRes = await query('SELECT COALESCE(SUM(total_amount), 0) AS total_revenue, COUNT(*) AS total_orders FROM orders');
    const productsRes = await query('SELECT COUNT(*) AS total_products FROM products');
    const usersRes = await query('SELECT COUNT(*) AS total_users FROM users WHERE role = $1', ['CUSTOMER']);
    const lowStockRes = await query('SELECT * FROM products WHERE stock_quantity < 20 ORDER BY stock_quantity ASC LIMIT 10');
    const recentOrders = await getAllOrders(10);

    res.json({
      success: true,
      data: {
        metrics: {
          totalRevenue: parseFloat(revenueRes.rows[0].total_revenue).toFixed(2),
          totalOrders: parseInt(revenueRes.rows[0].total_orders, 10),
          totalProducts: parseInt(productsRes.rows[0].total_products, 10),
          totalUsers: parseInt(usersRes.rows[0].total_users, 10),
          lowStockCount: lowStockRes.rows.length
        },
        lowStockProducts: lowStockRes.rows,
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboardSummary
};
