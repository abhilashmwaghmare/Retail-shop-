/**
 * RetailCorp Order Orchestration Microservice (Port 5004)
 */
const http = require('http');

const PORT = process.env.PORT || 5004;
const SERVICE_NAME = 'order-service';
const START_TIME = Date.now();
let requestCount = 0;

// Order Store
const orders = [
  {
    id: 'ORD-7821-X9',
    userId: 'usr-admin-01',
    customerName: 'Platform Administrator',
    items: [
      { id: 'prod-001', title: 'Cloud Architecture & Kubernetes Handbook', price: 54.99, quantity: 1 }
    ],
    subtotal: 54.99,
    tax: 4.40,
    shipping: 9.99,
    total: 69.38,
    status: 'Delivered',
    paymentId: 'PAY-TX-98412',
    shippingAddress: '42 Cloud Way, Suite 100, Sydney NSW 2000',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'ORD-5412-A3',
    userId: 'usr-devops-02',
    customerName: 'Alex Rivera (SRE Lead)',
    items: [
      { id: 'prod-002', title: 'Apex Mechanical Keyboard RGB', price: 149.99, quantity: 1 },
      { id: 'prod-005', title: 'DevOps Zero-Downtime Hoodie', price: 64.99, quantity: 2 }
    ],
    subtotal: 279.97,
    tax: 22.40,
    shipping: 0,
    total: 302.37,
    status: 'Confirmed',
    paymentId: 'PAY-TX-98413',
    shippingAddress: '10 SRE Parkway, Melbourne VIC 3000',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const server = http.createServer(async (req, res) => {
  requestCount++;
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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
      orderCount: orders.length
    }));
  }

  if (url.pathname === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: SERVICE_NAME, status: 'ready', totalVolume: orders.reduce((acc, o) => acc + o.total, 0) }));
  }

  if (url.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return res.end([
      `# HELP http_requests_total Total requests to ${SERVICE_NAME}`,
      `# TYPE http_requests_total counter`,
      `http_requests_total{service="${SERVICE_NAME}"} ${requestCount}`,
      `# HELP orders_created_total Total orders placed`,
      `# TYPE orders_created_total counter`,
      `orders_created_total ${orders.length}`
    ].join('\n') + '\n');
  }

  // Parse Body
  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const raw = Buffer.concat(buffers).toString();
      if (raw) body = JSON.parse(raw);
    } catch (e) { /* ignore */ }
  }

  // GET /orders (All orders)
  if (url.pathname === '/orders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      service: SERVICE_NAME,
      total: orders.length,
      orders: [...orders].reverse()
    }));
  }

  // GET /orders/:id
  if (url.pathname.startsWith('/orders/') && !url.pathname.includes('/user') && !url.pathname.includes('/status') && req.method === 'GET') {
    const id = url.pathname.replace('/orders/', '');
    const order = orders.find(o => o.id === id);
    if (!order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Order not found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, order }));
  }

  // POST /orders (Place new order)
  if (url.pathname === '/orders' && req.method === 'POST') {
    const { items, customerName, email, shippingAddress, paymentDetails } = body;
    if (!items || !items.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Cannot place empty order' }));
    }

    const subtotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 100 ? 0 : 9.99;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    const newOrder = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.random().toString(36).substring(2, 4).toUpperCase(),
      userId: body.userId || 'guest-user',
      customerName: customerName || 'Valued Customer',
      email: email || 'customer@retailcorp.internal',
      items,
      subtotal: Number(subtotal.toFixed(2)),
      tax,
      shipping,
      total,
      status: 'Confirmed',
      paymentId: 'PAY-TX-' + Math.floor(10000 + Math.random() * 90000),
      shippingAddress: shippingAddress || '123 Cloud St, Sydney',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Order placed successfully across microservices mesh',
      order: newOrder
    }));
  }

  // PUT /orders/:id/status (Admin status update)
  if (url.pathname.includes('/status') && req.method === 'PUT') {
    const parts = url.pathname.split('/');
    const orderId = parts[2];
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Order not found' }));
    }
    order.status = body.status || order.status;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, order }));
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Not Found on ${SERVICE_NAME}` }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
});
