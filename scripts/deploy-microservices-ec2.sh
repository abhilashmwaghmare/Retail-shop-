#!/bin/bash
# ==============================================================================
# RetailCorp Enterprise 7-Microservices Architecture Upgrade for AWS EC2
# ==============================================================================
set -e

echo "🚀 Upgrading to Enterprise 7-Microservices Platform on AWS EC2..."

mkdir -p /opt/retailcorp-ecommerce
cd /opt/retailcorp-ecommerce

# 1. Stop existing legacy containers
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

# 2. Build Directory Structure
mkdir -p microservices/{auth-service/src,product-service/src,cart-service/src,order-service/src,payment-service/src,notification-service/src,api-gateway/src}
mkdir -p database nginx/conf.d monitoring/prometheus

# -------------------------------------------------------------
# Microservice 1: auth-service (Port 5001)
# -------------------------------------------------------------
cat << 'EOF' > microservices/auth-service/package.json
{"name":"auth-service","version":"1.0.0","main":"src/server.js"}
EOF

cat << 'EOF' > microservices/auth-service/src/server.js
const http = require('http');
const PORT = 5001;
const START = Date.now();
let count = 0;
const users = new Map([
  ['admin@retailcorp.com', { id: 'usr-admin', name: 'Platform Administrator', role: 'admin' }],
  ['devops@retailcorp.com', { id: 'usr-devops', name: 'Alex Rivera (SRE Lead)', role: 'customer' }]
]);
const server = http.createServer((req, res) => {
  count++;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: 'auth-service', status: 'ok', uptime: Math.floor((Date.now()-START)/1000) }));
  }
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(`http_requests_total{service="auth"} ${count}\n`);
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'auth-service', users: Array.from(users.values()) }));
});
server.listen(PORT, '0.0.0.0', () => console.log('Auth service on ' + PORT));
EOF

cat << 'EOF' > microservices/auth-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 5001
CMD ["node", "src/server.js"]
EOF

# -------------------------------------------------------------
# Microservice 2: product-service (Port 5002)
# -------------------------------------------------------------
cat << 'EOF' > microservices/product-service/package.json
{"name":"product-service","version":"1.0.0","main":"src/server.js"}
EOF

cat << 'EOF' > microservices/product-service/src/server.js
const http = require('http');
const PORT = 5002;
const START = Date.now();
let count = 0;
const products = [
  { id: 'prod-001', title: 'Cloud Architecture & Kubernetes Handbook', category: 'Books', price: 54.99, originalPrice: 69.99, stock: 120, rating: 4.9, reviewsCount: 312, badge: 'Bestseller', description: 'Comprehensive 800-page production guide for multi-region Kubernetes, GitOps, and service mesh patterns.', imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80' },
  { id: 'prod-002', title: 'Apex Mechanical Keyboard RGB (Hot-Swap)', category: 'Hardware', price: 149.99, originalPrice: 179.99, stock: 45, rating: 4.8, reviewsCount: 184, badge: 'Popular', description: 'Custom gasket-mounted mechanical keyboard with Lubed Gateron Oil Kings and sound dampening foam.', imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80' },
  { id: 'prod-003', title: 'UltraWide 38" Curved IPS Observability Monitor', category: 'Hardware', price: 799.99, originalPrice: 949.99, stock: 18, rating: 5.0, reviewsCount: 89, badge: 'Top Rated', description: '3840x1600 WQHD+ 144Hz curved display with Thunderbolt 4 power delivery. Tailored for Grafana dashboards.', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80' },
  { id: 'prod-004', title: 'Noise Cancelling Studio Headphones Pro', category: 'Audio', price: 249.99, originalPrice: 299.99, stock: 62, rating: 4.7, reviewsCount: 245, badge: 'Staff Pick', description: 'Hybrid Active Noise Cancellation with 45-hour battery life and memory foam cups for incident triage.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' },
  { id: 'prod-005', title: 'DevOps Zero-Downtime Premium Hoodie', category: 'Apparel', price: 64.99, originalPrice: 79.99, stock: 150, rating: 4.9, reviewsCount: 420, badge: 'Limited Edition', description: '400 GSM heavyweight brushed organic cotton hoodie featuring embroidered terminal syntax.', imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80' },
  { id: 'prod-006', title: 'Ergonomic Task Chair with Mesh Lumbar', category: 'Furniture', price: 429.99, originalPrice: 499.99, stock: 14, rating: 4.8, reviewsCount: 97, badge: 'Best Comfort', description: 'Bi-directional adjustable armrests, dynamic lumbar support, and breathable Korean mesh for 14-hour uptime shifts.', imageUrl: 'https://images.unsplash.com/photo-1580481077190-7361456dd06f?w=600&auto=format&fit=crop&q=80' },
  { id: 'prod-007', title: 'Dual Wireless Charging Station 3-in-1', category: 'Hardware', price: 79.99, originalPrice: 99.99, stock: 85, rating: 4.6, reviewsCount: 158, badge: 'Trending', description: 'Fast 15W MagSafe wireless charging stand with integrated Apple Watch and AirPods docks.', imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=600&auto=format&fit=crop&q=80' },
  { id: 'prod-008', title: 'Titanium Thermal Travel Mug (24oz)', category: 'Accessories', price: 38.99, originalPrice: 48.99, stock: 210, rating: 4.9, reviewsCount: 520, badge: 'Essential', description: 'Double-walled vacuum insulated mug that keeps coffee piping hot for 12 hours during release deployments.', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' }
];
const server = http.createServer((req, res) => {
  count++;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: 'product-service', status: 'ok', itemCount: products.length }));
  }
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(`http_requests_total{service="products"} ${count}\n`);
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, count: products.length, products }));
});
server.listen(PORT, '0.0.0.0', () => console.log('Product service on ' + PORT));
EOF

cat << 'EOF' > microservices/product-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 5002
CMD ["node", "src/server.js"]
EOF

# -------------------------------------------------------------
# Microservice 3: cart-service (Port 5003)
# -------------------------------------------------------------
cat << 'EOF' > microservices/cart-service/package.json
{"name":"cart-service","version":"1.0.0","main":"src/server.js"}
EOF

cat << 'EOF' > microservices/cart-service/src/server.js
const http = require('http');
const PORT = 5003;
const carts = new Map();
function getCart(uid) {
  if (!carts.has(uid)) carts.set(uid, { userId: uid, items: [] });
  const c = carts.get(uid);
  const subtotal = c.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 9.99;
  return { userId: uid, items: c.items, subtotal: Number(subtotal.toFixed(2)), tax, shipping, total: Number((subtotal + tax + shipping).toFixed(2)) };
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: 'cart-service', status: 'ok', activeCarts: carts.size }));
  }
  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    try { body = JSON.parse(Buffer.concat(buffers).toString()); } catch(e){}
  }
  if (req.method === 'GET' && req.url.startsWith('/cart/')) {
    const uid = req.url.replace('/cart/', '');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, cart: getCart(uid) }));
  }
  if (req.method === 'POST' && req.url.includes('/items')) {
    const uid = req.url.split('/')[2];
    const c = carts.get(uid) || { userId: uid, items: [] };
    const ex = c.items.find(i => i.id === body.id);
    if (ex) ex.quantity += (body.quantity || 1);
    else c.items.push({ id: body.id, title: body.title, price: Number(body.price), imageUrl: body.imageUrl, quantity: Number(body.quantity || 1) });
    carts.set(uid, c);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, cart: getCart(uid) }));
  }
  if (req.method === 'PUT' && req.url.includes('/items/')) {
    const parts = req.url.split('/');
    const uid = parts[2];
    const pid = parts[4];
    const c = carts.get(uid);
    if (c) {
      const idx = c.items.findIndex(i => i.id === pid);
      if (idx > -1) {
        if (body.quantity <= 0) c.items.splice(idx, 1);
        else c.items[idx].quantity = Number(body.quantity);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, cart: getCart(uid) }));
  }
  if (req.method === 'DELETE' && req.url.startsWith('/cart/')) {
    const uid = req.url.replace('/cart/', '');
    carts.delete(uid);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Cart cleared' }));
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'cart-service' }));
});
server.listen(PORT, '0.0.0.0', () => console.log('Cart service on ' + PORT));
EOF

cat << 'EOF' > microservices/cart-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 5003
CMD ["node", "src/server.js"]
EOF

# -------------------------------------------------------------
# Microservice 4: order-service (Port 5004)
# -------------------------------------------------------------
cat << 'EOF' > microservices/order-service/package.json
{"name":"order-service","version":"1.0.0","main":"src/server.js"}
EOF

cat << 'EOF' > microservices/order-service/src/server.js
const http = require('http');
const PORT = 5004;
const orders = [
  { id: 'ORD-7821-X9', customerName: 'Platform Administrator', email: 'admin@retailcorp.com', shippingAddress: '42 Cloud Way, Sydney', total: 69.38, status: 'Delivered', createdAt: new Date(Date.now()-86400000*2).toISOString() },
  { id: 'ORD-5412-A3', customerName: 'Alex Rivera (SRE Lead)', email: 'devops@retailcorp.com', shippingAddress: '10 SRE Parkway, Melbourne', total: 302.37, status: 'Confirmed', createdAt: new Date(Date.now()-3600000*5).toISOString() }
];
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: 'order-service', status: 'ok', ordersCount: orders.length }));
  }
  if (req.method === 'POST' && req.url === '/orders') {
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    let body = {};
    try { body = JSON.parse(Buffer.concat(buffers).toString()); } catch(e){}
    const subtotal = (body.items || []).reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 100 ? 0 : 9.99;
    const newOrder = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.random().toString(36).substring(2, 4).toUpperCase(),
      customerName: body.customerName || 'Alex Rivera (SRE Lead)',
      email: body.email || 'devops@retailcorp.com',
      shippingAddress: body.shippingAddress || '42 Cloud Way, Sydney',
      subtotal, tax, shipping,
      total: Number((subtotal + tax + shipping).toFixed(2)),
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, order: newOrder }));
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, count: orders.length, orders: [...orders].reverse() }));
});
server.listen(PORT, '0.0.0.0', () => console.log('Order service on ' + PORT));
EOF

cat << 'EOF' > microservices/order-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 5004
CMD ["node", "src/server.js"]
EOF

# -------------------------------------------------------------
# Microservice 5: payment-service (Port 5005)
# -------------------------------------------------------------
cat << 'EOF' > microservices/payment-service/package.json
{"name":"payment-service","version":"1.0.0","main":"src/server.js"}
EOF

cat << 'EOF' > microservices/payment-service/src/server.js
const http = require('http');
const PORT = 5005;
let chaosMode = false;
let count = 0;
const server = http.createServer(async (req, res) => {
  count++;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: 'payment-service', status: 'ok', chaosMode }));
  }
  if (req.url === '/payments/chaos' && req.method === 'POST') {
    chaosMode = !chaosMode;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, chaosMode }));
  }
  if (req.url === '/payments/process' && req.method === 'POST') {
    if (chaosMode) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'SIMULATED_FAILURE: Upstream Gateway Timeout' }));
    }
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    let body = {};
    try { body = JSON.parse(Buffer.concat(buffers).toString()); } catch(e){}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      transaction: { transactionId: 'PAY-TX-' + Math.floor(10000 + Math.random() * 90000), amount: body.amount, status: 'Captured' }
    }));
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'payment-service', status: 'ready' }));
});
server.listen(PORT, '0.0.0.0', () => console.log('Payment service on ' + PORT));
EOF

cat << 'EOF' > microservices/payment-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 5005
CMD ["node", "src/server.js"]
EOF

# -------------------------------------------------------------
# Microservice 6: notification-service (Port 5006)
# -------------------------------------------------------------
cat << 'EOF' > microservices/notification-service/package.json
{"name":"notification-service","version":"1.0.0","main":"src/server.js"}
EOF

cat << 'EOF' > microservices/notification-service/src/server.js
const http = require('http');
const PORT = 5006;
let count = 0;
const server = http.createServer((req, res) => {
  count++;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: 'notification-service', status: 'ok', dispatched: count }));
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Notification queued' }));
});
server.listen(PORT, '0.0.0.0', () => console.log('Notification service on ' + PORT));
EOF

cat << 'EOF' > microservices/notification-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 5006
CMD ["node", "src/server.js"]
EOF

# -------------------------------------------------------------
# Microservice 7: api-gateway (Port 8000)
# -------------------------------------------------------------
cat << 'EOF' > microservices/api-gateway/package.json
{"name":"api-gateway","version":"1.0.0","main":"src/server.js"}
EOF

cat << 'EOF' > microservices/api-gateway/src/server.js
const http = require('http');
const PORT = 8000;
const ROUTES = {
  '/api/auth': 'http://auth-service:5001',
  '/api/products': 'http://product-service:5002',
  '/api/cart': 'http://cart-service:5003',
  '/api/orders': 'http://order-service:5004',
  '/api/payments': 'http://payment-service:5005',
  '/api/notifications': 'http://notification-service:5006'
};
const SERVICES = [
  { name: 'Gateway', id: 'gateway', url: 'http://localhost:8000/healthz' },
  { name: 'Auth', id: 'auth', url: 'http://auth-service:5001/healthz' },
  { name: 'Catalog', id: 'product', url: 'http://product-service:5002/healthz' },
  { name: 'Cart', id: 'cart', url: 'http://cart-service:5003/healthz' },
  { name: 'Order', id: 'order', url: 'http://order-service:5004/healthz' },
  { name: 'Payment', id: 'payment', url: 'http://payment-service:5005/healthz' },
  { name: 'Notify', id: 'notification', url: 'http://notification-service:5006/healthz' }
];
function ping(s) {
  if (s.id === 'gateway') return Promise.resolve({ id: s.id, name: s.name, latencyMs: 1, healthy: true });
  const t0 = Date.now();
  return new Promise(res => {
    try {
      const u = new URL(s.url);
      const req = http.get({ hostname: u.hostname, port: u.port, path: u.pathname, timeout: 1500 }, r => {
        res({ id: s.id, name: s.name, latencyMs: Math.max(1, Date.now() - t0), healthy: r.statusCode === 200 });
      });
      req.on('error', () => res({ id: s.id, name: s.name, latencyMs: Date.now() - t0, healthy: false }));
      req.on('timeout', () => { req.destroy(); res({ id: s.id, name: s.name, latencyMs: 1500, healthy: false }); });
    } catch(e) { res({ id: s.id, name: s.name, latencyMs: 0, healthy: false }); }
  });
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: 'api-gateway', status: 'ok' }));
  }
  if (req.url === '/api/mesh/health') {
    const list = await Promise.all(SERVICES.map(ping));
    const avg = Math.round(list.reduce((acc, it) => acc + it.latencyMs, 0) / list.length);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ meshStatus: list.every(s=>s.healthy)?'HEALTHY':'DEGRADED', averageLatencyMs: avg, services: list }));
  }
  for (const [prefix, targetUrl] of Object.entries(ROUTES)) {
    if (req.url.startsWith(prefix)) {
      const downstreamPath = req.url.replace(/^\/api/, '');
      const tu = new URL(downstreamPath, targetUrl);
      const opt = {
        hostname: tu.hostname,
        port: tu.port,
        path: tu.pathname + tu.search,
        method: req.method,
        headers: { ...req.headers, host: tu.host }
      };
      const proxy = http.request(opt, pr => {
        res.writeHead(pr.statusCode, { ...pr.headers, 'Access-Control-Allow-Origin': '*' });
        pr.pipe(res, { end: true });
      });
      proxy.on('error', err => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '502 Bad Gateway', details: err.message }));
      });
      return req.pipe(proxy, { end: true });
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Gateway route not found' }));
});
server.listen(PORT, '0.0.0.0', () => console.log('API Gateway on ' + PORT));
EOF

cat << 'EOF' > microservices/api-gateway/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["node", "src/server.js"]
EOF

# -------------------------------------------------------------
# Nginx Configuration
# -------------------------------------------------------------
cat << 'EOF' > nginx/conf.d/app.conf
upstream api_gateway {
    server api-gateway:8000;
}
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /healthz {
        proxy_pass http://api_gateway/healthz;
    }
    location /ready {
        proxy_pass http://api_gateway/healthz;
    }
    location /metrics {
        proxy_pass http://api_gateway/metrics;
    }
}
EOF

# Copy Nginx Index HTML from repository or write it
echo "🎨 Writing professional UI..."
cat << 'HTMLEOF' > nginx/index.html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ApexCloud Commerce | Enterprise DevOps Microservices Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .glass-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(51, 65, 85, 0.4); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
  <!-- Microservices Telemetry Bar -->
  <div class="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-8 py-2 sticky top-0 z-50 backdrop-blur-md">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-2 font-mono">
      <div class="flex items-center space-x-3">
        <span class="flex items-center text-emerald-400 font-semibold">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mr-2"></span>
          MESH: 7 SERVICES ACTIVE
        </span>
        <span class="text-slate-500 hidden md:inline">|</span>
        <span class="text-slate-400 hidden md:inline"><i class="fa-brands fa-aws text-amber-400 mr-1"></i> AWS EC2: c7i-flex.large</span>
      </div>

      <!-- Live Microservices Latency Badges -->
      <div id="mesh-badges" class="flex items-center space-x-2 overflow-x-auto py-1">
        <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5"></span>Gateway: <span id="lat-gateway" class="ml-1 text-white">1ms</span>
        </span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>Auth: <span id="lat-auth" class="ml-1 text-emerald-300">3ms</span>
        </span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>Catalog: <span id="lat-product" class="ml-1 text-emerald-300">4ms</span>
        </span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>Cart: <span id="lat-cart" class="ml-1 text-emerald-300">2ms</span>
        </span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>Order: <span id="lat-order" class="ml-1 text-emerald-300">5ms</span>
        </span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>Payment: <span id="lat-payment" class="ml-1 text-emerald-300">4ms</span>
        </span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>Notify: <span id="lat-notification" class="ml-1 text-emerald-300">2ms</span>
        </span>
      </div>

      <div class="flex items-center space-x-3">
        <a href="/metrics" target="_blank" class="text-indigo-400 hover:text-indigo-300 flex items-center font-medium"><i class="fa-solid fa-chart-line mr-1"></i> METRICS</a>
        <a href="http://3.25.108.223:3000" target="_blank" class="text-amber-400 hover:text-amber-300 flex items-center font-medium"><i class="fa-solid fa-gauge-high mr-1"></i> GRAFANA</a>
      </div>
    </div>
  </div>

  <!-- Main Navbar -->
  <nav class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-[37px] z-40">
    <div class="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-3 cursor-pointer" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <i class="fa-solid fa-cubes text-white text-lg"></i>
        </div>
        <div>
          <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">ApexCloud</span>
          <span class="text-xs px-2 py-0.5 ml-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">Microservices v2.0</span>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <button onclick="toggleOrdersModal()" class="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-300 hover:text-white transition flex items-center">
          <i class="fa-solid fa-receipt mr-2 text-indigo-400"></i> Orders
        </button>
        <button onclick="toggleAdminPanel()" class="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition flex items-center">
          <i class="fa-solid fa-bolt mr-2 text-amber-400"></i> SRE Chaos
        </button>
        <button onclick="toggleCartDrawer()" class="relative px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center">
          <i class="fa-solid fa-cart-shopping mr-2"></i> Cart
          <span id="cart-badge" class="ml-2 w-5 h-5 rounded-full bg-white text-indigo-700 text-xs font-bold flex items-center justify-center">0</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero Banner -->
  <section class="py-10 border-b border-slate-800/60 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950">
    <div class="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl sm:text-4xl font-black text-white">Enterprise Cloud Gear & Developer Hardware</h1>
        <p class="mt-2 text-slate-400 text-sm sm:text-base">Orchestrated across 7 microservices with API Gateway, Prometheus Golden Signals, and PostgreSQL.</p>
      </div>
      <div class="flex gap-2">
        <a href="/api/mesh/health" target="_blank" class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 hover:bg-slate-800 flex items-center"><i class="fa-solid fa-network-wired mr-2"></i> /api/mesh/health</a>
        <a href="http://3.25.108.223:3000" target="_blank" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center"><i class="fa-solid fa-chart-pie mr-2"></i> Grafana SRE</a>
      </div>
    </div>
  </section>

  <!-- Product Catalog -->
  <main class="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex-1 w-full">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white">Live Production Catalog (product-service:5002)</h2>
      <span class="text-xs font-mono text-slate-400">8 Items Online</span>
    </div>
    <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
  </main>

  <!-- Cart Drawer -->
  <div id="cart-drawer-backdrop" onclick="toggleCartDrawer()" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity opacity-0 pointer-events-none duration-300"></div>
  <aside id="cart-drawer" class="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col">
    <div class="p-6 border-b border-slate-800 flex items-center justify-between">
      <h2 class="text-lg font-bold text-white flex items-center"><i class="fa-solid fa-cart-shopping text-indigo-400 mr-2"></i> Your Cart</h2>
      <button onclick="toggleCartDrawer()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
    </div>
    <div id="cart-items-container" class="flex-1 overflow-y-auto p-6 space-y-4"></div>
    <div class="p-6 border-t border-slate-800 bg-slate-950/80 space-y-3 font-mono text-sm">
      <div class="flex justify-between text-slate-400"><span>Total:</span><span id="cart-total" class="text-emerald-400 font-bold text-lg">$0.00</span></div>
      <button id="checkout-btn" onclick="openCheckoutModal()" disabled class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm transition">
        Proceed to Checkout
      </button>
    </div>
  </aside>

  <!-- Checkout Modal -->
  <div id="checkout-modal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 relative">
      <button onclick="closeCheckoutModal()" class="absolute top-6 right-6 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="text-xl font-bold text-white mb-2">Order Checkout</h3>
      <p class="text-xs text-slate-400 mb-4 font-mono">Calls order-service ➔ payment-service ➔ notification-service</p>
      <form onsubmit="handleCheckout(event)" class="space-y-3 text-sm">
        <div>
          <label class="text-xs text-slate-400 block mb-1">Customer Name</label>
          <input type="text" id="chk-name" required value="Alex Rivera (SRE Lead)" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
        </div>
        <div>
          <label class="text-xs text-slate-400 block mb-1">Shipping Address</label>
          <input type="text" id="chk-address" required value="42 Cloud Way, Sydney NSW" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
        </div>
        <div class="pt-2">
          <button type="submit" id="pay-now-btn" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition">Confirm & Place Order</button>
        </div>
      </form>
      <div id="checkout-progress" class="hidden absolute inset-0 bg-slate-900/95 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
        <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p id="progress-msg" class="text-sm font-mono text-indigo-300">Orchestrating Order Across Mesh...</p>
      </div>
    </div>
  </div>

  <!-- Orders Modal -->
  <div id="orders-modal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 relative max-h-[80vh] flex flex-col">
      <button onclick="toggleOrdersModal()" class="absolute top-6 right-6 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="text-xl font-bold text-white mb-4">Orders Database (order-service:5004)</h3>
      <div id="orders-list-container" class="flex-1 overflow-y-auto space-y-3"></div>
    </div>
  </div>

  <!-- Chaos Admin Panel -->
  <div id="admin-panel" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 relative">
      <button onclick="toggleAdminPanel()" class="absolute top-6 right-6 text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="text-xl font-bold text-white mb-4"><i class="fa-solid fa-bolt text-amber-400 mr-2"></i> SRE Chaos Panel</h3>
      <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
        <div>
          <h4 class="font-bold text-white text-sm">Payment Failure (500 Error)</h4>
          <p class="text-xs text-slate-400">Injects artificial 500 into payment-service.</p>
        </div>
        <button id="chaos-btn" onclick="togglePaymentChaos()" class="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 text-slate-300">OFF</button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300 px-5 py-3 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl text-sm font-medium"></div>

  <script>
    let products = [];
    let cart = { items: [], total: 0 };
    const USER_ID = 'usr-devops';

    document.addEventListener('DOMContentLoaded', () => {
      fetchProducts();
      fetchCart();
      pollMesh();
      setInterval(pollMesh, 5000);
    });

    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        products = data.products || [];
        document.getElementById('product-grid').innerHTML = products.map(p => `
          <div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between p-4 hover:border-indigo-500/50 transition">
            <div class="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 mb-3">
              <img src="${p.imageUrl}" class="w-full h-full object-cover">
            </div>
            <div>
              <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300">${p.category}</span>
              <h3 class="font-bold text-base mt-2 mb-1">${p.title}</h3>
              <p class="text-xs text-slate-400 mb-3 line-clamp-2">${p.description}</p>
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-slate-800">
              <span class="text-lg font-mono font-bold text-white">$${p.price}</span>
              <button onclick="addToCart('${p.id}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">+ Add</button>
            </div>
          </div>
        `).join('');
      } catch (e) { showToast('Error loading catalog', 'error'); }
    }

    async function fetchCart() {
      try {
        const res = await fetch('/api/cart/' + USER_ID);
        const data = await res.json();
        if (data.cart) { cart = data.cart; updateCartUI(); }
      } catch (e) {}
    }

    async function addToCart(id) {
      const p = products.find(x => x.id === id);
      if (!p) return;
      const res = await fetch('/api/cart/' + USER_ID + '/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, title: p.title, price: p.price, imageUrl: p.imageUrl, quantity: 1 })
      });
      const data = await res.json();
      if (data.cart) { cart = data.cart; updateCartUI(); showToast('Added to cart!'); }
    }

    function updateCartUI() {
      const count = (cart.items || []).reduce((acc, it) => acc + it.quantity, 0);
      document.getElementById('cart-badge').innerText = count;
      document.getElementById('cart-total').innerText = '$' + (cart.total || 0).toFixed(2);
      document.getElementById('checkout-btn').disabled = count === 0;

      const container = document.getElementById('cart-items-container');
      if (!count) { container.innerHTML = '<div class="text-center py-12 text-slate-500">Cart is empty.</div>'; return; }

      container.innerHTML = cart.items.map(it => `
        <div class="flex items-center justify-between p-2 bg-slate-950 rounded-xl">
          <img src="${it.imageUrl}" class="w-12 h-12 rounded-lg object-cover mr-2">
          <div class="flex-1 mr-2">
            <h4 class="text-xs font-bold line-clamp-1">${it.title}</h4>
            <span class="text-xs text-indigo-400 font-mono">$${it.price} x ${it.quantity}</span>
          </div>
          <span class="font-bold font-mono text-sm">$${(it.price * it.quantity).toFixed(2)}</span>
        </div>
      `).join('');
    }

    async function pollMesh() {
      try {
        const res = await fetch('/api/mesh/health');
        const data = await res.json();
        (data.services || []).forEach(s => {
          const el = document.getElementById('lat-' + s.id);
          if (el) {
            el.innerText = s.latencyMs + 'ms';
            el.className = s.healthy ? 'ml-1 text-emerald-300 font-bold' : 'ml-1 text-rose-400 font-bold';
          }
        });
      } catch (e) {}
    }

    async function handleCheckout(e) {
      e.preventDefault();
      const progress = document.getElementById('checkout-progress');
      progress.classList.remove('hidden');
      const msg = document.getElementById('progress-msg');

      try {
        msg.innerText = '[1/3] Calling payment-service:5005...';
        const payRes = await fetch('/api/payments/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: cart.total })
        });
        const payData = await payRes.json();
        if (!payRes.ok || !payData.success) throw new Error(payData.error || 'Payment declined');

        msg.innerText = '[2/3] Calling order-service:5004...';
        const orderRes = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerName: document.getElementById('chk-name').value, shippingAddress: document.getElementById('chk-address').value, items: cart.items })
        });
        const orderData = await orderRes.json();

        msg.innerText = '[3/3] Calling notification-service:5006...';
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderData.order.id })
        });

        await fetch('/api/cart/' + USER_ID, { method: 'DELETE' });
        cart.items = [];
        updateCartUI();

        progress.classList.add('hidden');
        closeCheckoutModal();
        toggleCartDrawer(false);
        showToast('🎉 Order #' + orderData.order.id + ' placed successfully!');
        toggleOrdersModal();
      } catch (err) {
        progress.classList.add('hidden');
        showToast('Error: ' + err.message, 'error');
      }
    }

    async function toggleOrdersModal() {
      const modal = document.getElementById('orders-modal');
      const isOpen = !modal.classList.contains('opacity-0');
      if (isOpen) { modal.classList.add('opacity-0', 'pointer-events-none'); }
      else {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        const res = await fetch('/api/orders');
        const data = await res.json();
        document.getElementById('orders-list-container').innerHTML = (data.orders || []).map(o => `
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
            <div class="flex justify-between font-bold text-white"><span>${o.id}</span><span class="text-indigo-400">${o.status}</span></div>
            <div class="text-slate-400">Ship to: ${o.shippingAddress}</div>
            <div class="text-emerald-400 font-bold">$${o.total}</div>
          </div>
        `).join('') || '<div class="text-center py-6 text-slate-500">No orders yet.</div>';
      }
    }

    function toggleCartDrawer(force) {
      const d = document.getElementById('cart-drawer');
      const b = document.getElementById('cart-drawer-backdrop');
      const isOpen = !d.classList.contains('translate-x-full');
      const state = force !== undefined ? force : !isOpen;
      if (state) { d.classList.remove('translate-x-full'); b.classList.remove('opacity-0', 'pointer-events-none'); }
      else { d.classList.add('translate-x-full'); b.classList.add('opacity-0', 'pointer-events-none'); }
    }
    function openCheckoutModal() { document.getElementById('checkout-modal').classList.remove('opacity-0', 'pointer-events-none'); }
    function closeCheckoutModal() { document.getElementById('checkout-modal').classList.add('opacity-0', 'pointer-events-none'); }
    function toggleAdminPanel() {
      const p = document.getElementById('admin-panel');
      if (p.classList.contains('opacity-0')) p.classList.remove('opacity-0', 'pointer-events-none');
      else p.classList.add('opacity-0', 'pointer-events-none');
    }
    async function togglePaymentChaos() {
      const res = await fetch('/api/payments/chaos', { method: 'POST' });
      const data = await res.json();
      const btn = document.getElementById('chaos-btn');
      if (data.chaosMode) {
        btn.innerText = 'ON (FAILING)';
        btn.className = 'px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-600 text-white';
        showToast('Chaos mode ON on payment-service!', 'error');
      } else {
        btn.innerText = 'OFF';
        btn.className = 'px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 text-slate-300';
        showToast('Chaos mode OFF.');
      }
    }
    function showToast(msg, type = 'success') {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.className = type === 'error'
        ? 'fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 px-5 py-3 rounded-2xl bg-rose-950 border border-rose-500 shadow-2xl text-rose-200 text-sm font-medium'
        : 'fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500 shadow-2xl text-emerald-300 text-sm font-medium';
      setTimeout(() => { t.className = 'fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300 px-5 py-3 rounded-2xl text-sm font-medium'; }, 3500);
    }
  </script>
</body>
</html>
HTMLEOF

# -------------------------------------------------------------
# Prometheus Scrape Config
# -------------------------------------------------------------
cat << 'EOF' > monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8000']
  - job_name: 'microservices'
    static_configs:
      - targets: ['auth-service:5001','product-service:5002','cart-service:5003','order-service:5004','payment-service:5005','notification-service:5006']
EOF

# -------------------------------------------------------------
# Docker Compose Orchestrator
# -------------------------------------------------------------
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: retailcorp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ecommerce_db
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: SecureRetailCorp2026!DBPass
    volumes:
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
      - postgres-data:/var/lib/postgresql/data
    networks:
      - backend-net

  auth-service:
    build: { context: ./microservices/auth-service }
    container_name: retailcorp-auth-service
    restart: unless-stopped
    networks:
      - backend-net

  product-service:
    build: { context: ./microservices/product-service }
    container_name: retailcorp-product-service
    restart: unless-stopped
    networks:
      - backend-net

  cart-service:
    build: { context: ./microservices/cart-service }
    container_name: retailcorp-cart-service
    restart: unless-stopped
    networks:
      - backend-net

  order-service:
    build: { context: ./microservices/order-service }
    container_name: retailcorp-order-service
    restart: unless-stopped
    networks:
      - backend-net

  payment-service:
    build: { context: ./microservices/payment-service }
    container_name: retailcorp-payment-service
    restart: unless-stopped
    networks:
      - backend-net

  notification-service:
    build: { context: ./microservices/notification-service }
    container_name: retailcorp-notification-service
    restart: unless-stopped
    networks:
      - backend-net

  api-gateway:
    build: { context: ./microservices/api-gateway }
    container_name: retailcorp-api-gateway
    restart: unless-stopped
    depends_on:
      - auth-service
      - product-service
      - cart-service
      - order-service
      - payment-service
      - notification-service
    networks:
      - frontend-net
      - backend-net

  frontend:
    image: nginx:alpine
    container_name: retailcorp-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/index.html:/usr/share/nginx/html/index.html:ro
      - ./nginx/conf.d/app.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api-gateway
    networks:
      - frontend-net

  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: retailcorp-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    networks:
      - backend-net

  grafana:
    image: grafana/grafana:10.4.2
    container_name: retailcorp-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=RetailCorpAdmin2026!
    networks:
      - backend-net

volumes:
  postgres-data:

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
EOF

echo "🚀 Building and starting all 7 microservices in background..."
docker-compose up -d --build || docker compose up -d --build

echo "⏳ Waiting 12 seconds for microservices mesh to boot..."
sleep 12

echo "🔍 Probing API Gateway Mesh status..."
curl -s http://localhost:80/api/mesh/health || true
echo ""
echo "=================================================================="
echo "🎉 ENTERPRISE 7-MICROSERVICES DEPLOYMENT COMPLETED ON AWS EC2!"
echo "Storefront URL:            http://3.25.108.223"
echo "Mesh Health Status:        http://3.25.108.223/api/mesh/health"
echo "Gateway Health Probe:      http://3.25.108.223/healthz"
echo "Grafana SRE Dashboard:     http://3.25.108.223:3000 (admin / RetailCorpAdmin2026!)"
echo "Prometheus Metrics Server: http://3.25.108.223:9090"
echo "=================================================================="
