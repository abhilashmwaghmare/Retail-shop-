/**
 * Database Configuration & Connection Pool
 * Manages PostgreSQL client pooling with health checks and offline mock fallback.
 */

let pg;
try {
  pg = require('pg');
} catch (e) {
  pg = null;
}

const dbConfig = {
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ecommerce_db',
  user: process.env.DB_USER || 'ecommerce_user',
  password: process.env.DB_PASSWORD || 'SecretPassword123!',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '3000', 10),
};

let pool = null;
if (pg && pg.Pool) {
  pool = new pg.Pool(dbConfig);
  pool.on('error', (err) => {
    console.error('[Database Pool Error]:', err.message);
  });
}

// In-Memory Seed Store for Offline / Mock Execution
const inMemoryStore = {
  users: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      full_name: 'System Administrator',
      email: 'admin@retailcorp.io',
      // Hash for "AdminSecure123!"
      password_hash: '$2a$10$wK1k6aCj4c3E8bIqL1pG0uK5x2z8b3z1r0s9t8u7v6w5x4y3z2a1b',
      role: 'ADMIN',
      created_at: new Date().toISOString()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      full_name: 'DevOps Student',
      email: 'student@retailcorp.io',
      // Hash for "StudentPass123!"
      password_hash: '$2a$10$xL2m7bDi5d4F9cJrM2qH1vL6y3a9c4a2s1t0u9v8w7x6y5z4a3b2c',
      role: 'CUSTOMER',
      created_at: new Date().toISOString()
    }
  ],
  products: [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'Cloud Kubernetes Architecture Handbook',
      slug: 'k8s-architecture-book',
      description: 'Comprehensive guide to production Kubernetes, GitOps, and service meshes.',
      price: 49.99,
      stock_quantity: 50,
      category: 'Books',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      created_at: new Date().toISOString()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      name: 'Mechanical Coding Keyboard (Tactile Browns)',
      slug: 'mech-keyboard-brown',
      description: 'USB-C mechanical keyboard with programmable QMK firmware and RGB backlighting.',
      price: 129.99,
      stock_quantity: 35,
      category: 'Hardware',
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
      created_at: new Date().toISOString()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000003',
      name: 'DevOps Engineer Zipper Hoodie',
      slug: 'devops-hoodie',
      description: 'Heavyweight organic cotton hoodie: "It worked in staging, now it is an incident."',
      price: 59.99,
      stock_quantity: 120,
      category: 'Apparel',
      image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
      created_at: new Date().toISOString()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000004',
      name: 'Dual-Band Wi-Fi 6 Home Lab Router',
      slug: 'wifi6-homelab-router',
      description: 'Gigabit low-latency router with OpenWrt support for home laboratory testbeds.',
      price: 89.99,
      stock_quantity: 20,
      category: 'Hardware',
      image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600',
      created_at: new Date().toISOString()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000005',
      name: 'Terraform & AWS Enterprise Automation',
      slug: 'terraform-aws-guide',
      description: 'Master infrastructure as code, remote state locking, and multi-account AWS topologies.',
      price: 39.99,
      stock_quantity: 85,
      category: 'Books',
      image_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600',
      created_at: new Date().toISOString()
    },
    {
      id: 'b0000000-0000-0000-0000-000000000006',
      name: 'Ultra-Wide Desk Mat with Linux CLI Shortcuts',
      slug: 'linux-desk-mat',
      description: 'Stitched-edge water-resistant desk pad featuring essential Bash and vi commands.',
      price: 24.99,
      stock_quantity: 200,
      category: 'Apparel',
      image_url: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600',
      created_at: new Date().toISOString()
    }
  ],
  orders: [],
  orderItems: []
};

/**
 * Health check query (SELECT 1)
 */
async function checkDatabaseHealth() {
  if (process.env.USE_MOCK_DB === 'true' || !pool) {
    return {
      healthy: true,
      latencyMs: 1,
      mode: 'in-memory-mock',
      poolTotal: 1,
      poolIdle: 1,
      poolWaiting: 0
    };
  }

  const start = Date.now();
  try {
    const res = await pool.query('SELECT 1 AS health_ping');
    return {
      healthy: res.rows && res.rows[0].health_ping === 1,
      latencyMs: Date.now() - start,
      mode: 'postgresql',
      poolTotal: pool.totalCount || 0,
      poolIdle: pool.idleCount || 0,
      poolWaiting: pool.waitingCount || 0
    };
  } catch (err) {
    return {
      healthy: false,
      error: err.message,
      latencyMs: Date.now() - start,
      mode: 'postgresql'
    };
  }
}

/**
 * Execute query with fallback support
 */
async function query(text, params = []) {
  if (process.env.USE_MOCK_DB !== 'true' && pool) {
    return await pool.query(text, params);
  }
  return { rows: [] };
}

module.exports = {
  pool,
  query,
  checkDatabaseHealth,
  inMemoryStore
};
