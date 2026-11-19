/**
 * RetailCorp Shopping Cart Microservice (Port 5003)
 */
const http = require('http');

const PORT = process.env.PORT || 5003;
const SERVICE_NAME = 'cart-service';
const START_TIME = Date.now();
let requestCount = 0;

// User carts stored by userId (default guest id: 'guest')
const carts = new Map();

function getOrCreateCart(userId) {
  if (!carts.has(userId)) {
    carts.set(userId, {
      userId,
      items: [],
      updatedAt: new Date().toISOString()
    });
  }
  return carts.get(userId);
}

function calculateCartTotals(cart) {
  const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 9.99;
  const total = Number((subtotal + tax + shipping).toFixed(2));
  const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax,
    shipping,
    total,
    itemCount,
    qualifiesForFreeShipping: subtotal > 100
  };
}

const server = http.createServer(async (req, res) => {
  requestCount++;
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
      activeCarts: carts.size
    }));
  }

  if (url.pathname === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: SERVICE_NAME, status: 'ready', memory: process.memoryUsage().heapUsed }));
  }

  if (url.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return res.end([
      `# HELP http_requests_total Total requests to ${SERVICE_NAME}`,
      `# TYPE http_requests_total counter`,
      `http_requests_total{service="${SERVICE_NAME}"} ${requestCount}`,
      `# HELP active_carts_total Total active shopping carts`,
      `# TYPE active_carts_total gauge`,
      `active_carts_total ${carts.size}`
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

  // Cart API: GET /cart/:userId
  if (url.pathname.startsWith('/cart/') && req.method === 'GET') {
    const userId = url.pathname.replace('/cart/', '');
    const cart = getOrCreateCart(userId);
    const totals = calculateCartTotals(cart);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      service: SERVICE_NAME,
      cart: {
        userId,
        items: cart.items,
        ...totals,
        updatedAt: cart.updatedAt
      }
    }));
  }

  // Cart API: POST /cart/:userId/items (Add Item)
  if (url.pathname.includes('/items') && req.method === 'POST') {
    const parts = url.pathname.split('/');
    const userId = parts[2];
    const cart = getOrCreateCart(userId);

    const { id, title, price, imageUrl, quantity = 1 } = body;
    if (!id || !price) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Product id and price required' }));
    }

    const existingIndex = cart.items.findIndex(item => item.id === id);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        id,
        title: title || 'Item',
        price: Number(price),
        imageUrl: imageUrl || '',
        quantity: Number(quantity)
      });
    }
    cart.updatedAt = new Date().toISOString();
    const totals = calculateCartTotals(cart);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Item added to cart',
      cart: { userId, items: cart.items, ...totals }
    }));
  }

  // Cart API: PUT /cart/:userId/items/:productId (Update quantity)
  if (url.pathname.includes('/items/') && req.method === 'PUT') {
    const parts = url.pathname.split('/');
    const userId = parts[2];
    const productId = parts[4];
    const cart = getOrCreateCart(userId);

    const { quantity } = body;
    const existingIndex = cart.items.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(existingIndex, 1);
      } else {
        cart.items[existingIndex].quantity = Number(quantity);
      }
    }
    cart.updatedAt = new Date().toISOString();
    const totals = calculateCartTotals(cart);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, cart: { userId, items: cart.items, ...totals } }));
  }

  // Cart API: DELETE /cart/:userId/items/:productId (Remove item)
  if (url.pathname.includes('/items/') && req.method === 'DELETE') {
    const parts = url.pathname.split('/');
    const userId = parts[2];
    const productId = parts[4];
    const cart = getOrCreateCart(userId);

    cart.items = cart.items.filter(item => item.id !== productId);
    cart.updatedAt = new Date().toISOString();
    const totals = calculateCartTotals(cart);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Item removed', cart: { userId, items: cart.items, ...totals } }));
  }

  // Cart API: DELETE /cart/:userId (Clear cart)
  if (url.pathname.startsWith('/cart/') && req.method === 'DELETE') {
    const userId = url.pathname.replace('/cart/', '');
    const cart = getOrCreateCart(userId);
    cart.items = [];
    cart.updatedAt = new Date().toISOString();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Cart cleared' }));
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Not Found on ${SERVICE_NAME}` }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
});
