/**
 * Prometheus Telemetry Middleware (4 Golden Signals)
 */

let promClient;
try {
  promClient = require('prom-client');
} catch (e) {
  promClient = null;
}

const startTime = Date.now();
const telemetryStore = {
  requestsTotal: {},
  inFlight: 0,
  errorsTotal: 0
};

let register;
let httpRequestsCounter;
let httpRequestDuration;
let inFlightGauge;

if (promClient && promClient.Registry) {
  register = new promClient.Registry();
  promClient.collectDefaultMetrics({ register, prefix: 'ecommerce_' });

  httpRequestsCounter = new promClient.Counter({
    name: 'ecommerce_http_requests_total',
    help: 'Total count of processed HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
  });

  httpRequestDuration = new promClient.Histogram({
    name: 'ecommerce_http_request_duration_seconds',
    help: 'HTTP request latency histogram in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [register]
  });

  inFlightGauge = new promClient.Gauge({
    name: 'ecommerce_http_requests_in_flight',
    help: 'Current active requests being processed',
    registers: [register]
  });
}

function metricsMiddleware(req, res, next) {
  const startHr = process.hrtime();
  telemetryStore.inFlight++;
  if (inFlightGauge) inFlightGauge.inc();

  res.on('finish', () => {
    telemetryStore.inFlight = Math.max(0, telemetryStore.inFlight - 1);
    if (inFlightGauge) inFlightGauge.dec();

    const elapsedHr = process.hrtime(startHr);
    const elapsedSeconds = elapsedHr[0] + elapsedHr[1] / 1e9;
    const route = req.baseUrl + (req.route ? req.route.path : req.path || 'unknown');
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Fallback store
    const key = `${method} ${route} ${statusCode}`;
    telemetryStore.requestsTotal[key] = (telemetryStore.requestsTotal[key] || 0) + 1;
    if (res.statusCode >= 400) telemetryStore.errorsTotal++;

    if (httpRequestsCounter) {
      httpRequestsCounter.inc({ method, route, status_code: statusCode });
    }
    if (httpRequestDuration) {
      httpRequestDuration.observe({ method, route, status_code: statusCode }, elapsedSeconds);
    }
  });

  next();
}

async function getPrometheusMetrics(dbHealth) {
  if (promClient && register) {
    return await register.metrics();
  }

  // Standalone Prometheus Exporter String
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();
  let text = `# HELP ecommerce_uptime_seconds Total service uptime in seconds
# TYPE ecommerce_uptime_seconds gauge
ecommerce_uptime_seconds ${uptime}
# HELP ecommerce_http_requests_in_flight Active in-flight requests
# TYPE ecommerce_http_requests_in_flight gauge
ecommerce_http_requests_in_flight ${telemetryStore.inFlight}
# HELP ecommerce_errors_total Total 4xx and 5xx responses
# TYPE ecommerce_errors_total counter
ecommerce_errors_total ${telemetryStore.errorsTotal}
# HELP ecommerce_process_resident_memory_bytes Resident memory bytes
# TYPE ecommerce_process_resident_memory_bytes gauge
ecommerce_process_resident_memory_bytes ${mem.rss}
# HELP ecommerce_http_requests_total Total HTTP requests
# TYPE ecommerce_http_requests_total counter
`;

  for (const [key, count] of Object.entries(telemetryStore.requestsTotal)) {
    const parts = key.split(' ');
    text += `ecommerce_http_requests_total{method="${parts[0]}",route="${parts[1]}",status_code="${parts[2]}"} ${count}\n`;
  }

  if (dbHealth) {
    text += `# HELP ecommerce_db_healthy Database health (1 = UP, 0 = DOWN)
# TYPE ecommerce_db_healthy gauge
ecommerce_db_healthy ${dbHealth.healthy ? 1 : 0}
# HELP ecommerce_db_latency_ms Database ping latency in ms
# TYPE ecommerce_db_latency_ms gauge
ecommerce_db_latency_ms ${dbHealth.latencyMs || 0}
`;
  }

  return text;
}

module.exports = {
  metricsMiddleware,
  getPrometheusMetrics
};
