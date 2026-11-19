/**
 * RetailCorp Payment & Billing Microservice (Port 5005)
 */
const http = require('http');

const PORT = process.env.PORT || 5005;
const SERVICE_NAME = 'payment-service';
const START_TIME = Date.now();
let requestCount = 0;
let chaosMode = false; // Chaos engineering injection flag

const transactions = [
  {
    transactionId: 'PAY-TX-98412',
    orderId: 'ORD-7821-X9',
    amount: 69.38,
    currency: 'USD',
    status: 'Captured',
    cardLast4: '4242',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    transactionId: 'PAY-TX-98413',
    orderId: 'ORD-5412-A3',
    amount: 302.37,
    currency: 'USD',
    status: 'Captured',
    cardLast4: '8888',
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
      chaosMode
    }));
  }

  if (url.pathname === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: SERVICE_NAME, status: 'ready', gatewayStatus: 'connected' }));
  }

  if (url.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return res.end([
      `# HELP http_requests_total Total requests to ${SERVICE_NAME}`,
      `# TYPE http_requests_total counter`,
      `http_requests_total{service="${SERVICE_NAME}"} ${requestCount}`,
      `# HELP payment_transactions_total Total processed payments`,
      `# TYPE payment_transactions_total counter`,
      `payment_transactions_total ${transactions.length}`
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

  // Chaos Injection Toggle (For SRE fault drills)
  if (url.pathname === '/payments/chaos' && req.method === 'POST') {
    chaosMode = !chaosMode;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, chaosMode, message: `Chaos mode set to: ${chaosMode}` }));
  }

  // Process Payment
  if (url.pathname === '/payments/process' && req.method === 'POST') {
    // If Chaos Mode is active, simulate a 500 error or latency
    if (chaosMode) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'SIMULATED_FAILURE: Upstream Payment Gateway Timeout' }));
    }

    const { amount, orderId, cardNumber = '4242' } = body;
    const cardLast4 = String(cardNumber).slice(-4) || '4242';

    const tx = {
      transactionId: 'PAY-TX-' + Math.floor(10000 + Math.random() * 90000),
      orderId: orderId || 'ORD-NEW',
      amount: Number(amount) || 0,
      currency: 'USD',
      status: 'Captured',
      cardLast4,
      timestamp: new Date().toISOString()
    };
    transactions.push(tx);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Payment authorized and captured successfully',
      transaction: tx
    }));
  }

  // GET /payments (List transactions)
  if (url.pathname === '/payments' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      service: SERVICE_NAME,
      total: transactions.length,
      transactions: [...transactions].reverse()
    }));
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Not Found on ${SERVICE_NAME}` }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
});
