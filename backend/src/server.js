/**
 * Production E-Commerce Backend Server
 */

const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const { pool } = require('./config/db');
const { metricsMiddleware } = require('./middleware/metrics');

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const NODE_ENV = process.env.NODE_ENV || 'production';

let express;
try { express = require('express'); } catch (e) { express = null; }

let app;
let server;

if (express) {
  app = express();

  let cors;
  try {
    cors = require('cors');
    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
  } catch (e) { /* ignore */ }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(metricsMiddleware);

  // Root Service Metadata
  app.get('/', (req, res) => {
    res.json({
      service: 'retailcorp-ecommerce-backend',
      version: APP_VERSION,
      environment: NODE_ENV,
      status: 'operational',
      uptimeSeconds: Math.floor(process.uptime()),
      endpoints: {
        healthz: '/healthz',
        ready: '/ready',
        metrics: '/metrics',
        auth: '/api/auth',
        products: '/api/products',
        orders: '/api/orders',
        admin: '/api/admin'
      }
    });
  });

  // Health and Observability
  const healthRoutes = require('./routes/healthRoutes');
  app.use('/', healthRoutes);

  // Business REST APIs
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/products', require('./routes/productRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[Unhandled Error]:', err.stack || err.message);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  });

  server = http.createServer(app);
} else {
  // Pure Node HTTP fallback
  const { checkDatabaseHealth } = require('./config/db');
  const { getPrometheusMetrics } = require('./middleware/metrics');

  server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'alive', version: APP_VERSION }));
    }
    if (req.url === '/ready') {
      const dbHealth = await checkDatabaseHealth();
      res.writeHead(dbHealth.healthy ? 200 : 503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: dbHealth.healthy ? 'ready' : 'unhealthy', database: dbHealth }));
    }
    if (req.url === '/metrics') {
      const dbHealth = await checkDatabaseHealth();
      const text = await getPrometheusMetrics(dbHealth);
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
      return res.end(text);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ service: 'retailcorp-ecommerce-backend', status: 'operational' }));
  });
}

function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, HOST, () => {
      console.log(`[Backend Server] Listening on http://${HOST}:${port} (${NODE_ENV}, v${APP_VERSION})`);
      resolve(server);
    });
  });
}

function gracefulShutdown(signal) {
  console.log(`[Backend Server] Received ${signal}. Draining connections...`);
  if (server) {
    server.close(() => {
      console.log('[Backend Server] HTTP listeners closed.');
      if (pool && typeof pool.end === 'function') {
        pool.end(() => {
          console.log('[Backend Server] Database pool closed.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
