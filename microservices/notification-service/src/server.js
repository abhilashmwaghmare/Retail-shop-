/**
 * RetailCorp Notification & Event Dispatcher Microservice (Port 5006)
 */
const http = require('http');

const PORT = process.env.PORT || 5006;
const SERVICE_NAME = 'notification-service';
const START_TIME = Date.now();
let requestCount = 0;

const notifications = [
  {
    id: 'NOTIF-01',
    channel: 'EMAIL',
    recipient: 'admin@retailcorp.com',
    subject: 'Order #ORD-7821-X9 Delivered',
    status: 'Sent',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'NOTIF-02',
    channel: 'SMS',
    recipient: '+61400111222',
    subject: 'Order #ORD-5412-A3 Confirmed & Dispatched',
    status: 'Delivered',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const server = http.createServer(async (req, res) => {
  requestCount++;
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // SRE Probes
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      service: SERVICE_NAME,
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      dispatchedCount: notifications.length
    }));
  }

  if (url.pathname === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: SERVICE_NAME, status: 'ready', queueStatus: 'idle' }));
  }

  if (url.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return res.end([
      `# HELP http_requests_total Total requests to ${SERVICE_NAME}`,
      `# TYPE http_requests_total counter`,
      `http_requests_total{service="${SERVICE_NAME}"} ${requestCount}`,
      `# HELP notifications_dispatched_total Total dispatched messages`,
      `# TYPE notifications_dispatched_total counter`,
      `notifications_dispatched_total ${notifications.length}`
    ].join('\n') + '\n');
  }

  // Parse Body
  let body = {};
  if (req.method === 'POST') {
    try {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const raw = Buffer.concat(buffers).toString();
      if (raw) body = JSON.parse(raw);
    } catch (e) { /* ignore */ }
  }

  // Send Notification
  if (url.pathname === '/notifications/send' && req.method === 'POST') {
    const { recipient, subject, channel = 'EMAIL', orderId } = body;
    const notif = {
      id: 'NOTIF-' + Math.floor(100 + Math.random() * 900),
      channel,
      recipient: recipient || 'customer@retailcorp.internal',
      subject: subject || `Order ${orderId || 'Notification'} update`,
      status: 'Sent',
      timestamp: new Date().toISOString()
    };
    notifications.push(notif);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Notification queued and sent asynchronously',
      notification: notif
    }));
  }

  // GET /notifications/history
  if (url.pathname === '/notifications/history' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      service: SERVICE_NAME,
      total: notifications.length,
      history: [...notifications].reverse()
    }));
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Not Found on ${SERVICE_NAME}` }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
});
