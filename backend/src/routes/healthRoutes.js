/**
 * Health Probes & Observability Simulation Routes
 */

const express = require('express');
const router = express.Router();
const { checkDatabaseHealth } = require('../config/db');
const { getPrometheusMetrics } = require('../middleware/metrics');

const APP_VERSION = process.env.APP_VERSION || '1.0.0';

// 1. Kubernetes Liveness Probe: process is alive
router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: APP_VERSION
  });
});

// 2. Kubernetes Readiness Probe: downstream dependencies (PostgreSQL)
router.get('/ready', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const isReady = dbHealth.healthy;
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    version: APP_VERSION
  });
});

// 3. Prometheus Scrape Endpoint
router.get('/metrics', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const text = await getPrometheusMetrics(dbHealth);
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(text);
});

// 4. CPU Burn Simulation for testing high CPU alerts & HPA autoscaling
router.get('/api/simulate/cpu', (req, res) => {
  const durationMs = Math.min(parseInt(req.query.duration || '1000', 10), 10000);
  const start = Date.now();
  let count = 0;
  while (Date.now() - start < durationMs) {
    count += Math.sqrt(Math.random() * 1000000);
  }
  res.json({
    success: true,
    message: `Burned CPU cycles for ${durationMs}ms`,
    computedIterations: count
  });
});

// 5. Error Simulation for testing Alertmanager 5xx threshold alerts
router.get('/api/simulate/error', (req, res) => {
  res.status(500).json({
    success: false,
    error: 'Simulated 500 Internal Server Error for SRE alert verification',
    code: 'ERR_SIMULATED_ALERT'
  });
});

module.exports = router;
