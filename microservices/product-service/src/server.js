/**
 * RetailCorp Product Catalog Microservice (Port 5002)
 */
const http = require('http');

const PORT = process.env.PORT || 5002;
const SERVICE_NAME = 'product-service';
const START_TIME = Date.now();
let requestCount = 0;

// Enterprise Product Catalog with Real High-Res Unsplash Images
const products = [
  {
    id: 'prod-001',
    title: 'Cloud Architecture & Kubernetes Handbook',
    description: 'Comprehensive 800-page production guide for multi-region Kubernetes, GitOps, and service mesh patterns.',
    category: 'Books',
    price: 54.99,
    originalPrice: 69.99,
    stock: 120,
    rating: 4.9,
    reviewsCount: 312,
    badge: 'Bestseller',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-002',
    title: 'Apex Mechanical Keyboard RGB (Hot-Swap)',
    description: 'Custom gasket-mounted mechanical keyboard with Lubed Gateron Oil Kings, sound dampening foam, and per-key RGB.',
    category: 'Hardware',
    price: 149.99,
    originalPrice: 179.99,
    stock: 45,
    rating: 4.8,
    reviewsCount: 184,
    badge: 'Popular',
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-003',
    title: 'UltraWide 38" Curved IPS Observability Monitor',
    description: '3840x1600 WQHD+ 144Hz curved display with Thunderbolt 4 power delivery. Tailored for Grafana dashboards and terminal splits.',
    category: 'Hardware',
    price: 799.99,
    originalPrice: 949.99,
    stock: 18,
    rating: 5.0,
    reviewsCount: 89,
    badge: 'Top Rated',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-004',
    title: 'Noise Cancelling Studio Headphones Pro',
    description: 'Hybrid Active Noise Cancellation with 45-hour battery life and memory foam cups for incident triage marathons.',
    category: 'Audio',
    price: 249.99,
    originalPrice: 299.99,
    stock: 62,
    rating: 4.7,
    reviewsCount: 245,
    badge: 'Staff Pick',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-005',
    title: 'DevOps Zero-Downtime Premium Hoodie',
    description: '400 GSM heavyweight brushed organic cotton hoodie featuring embroidered terminal syntax on the chest.',
    category: 'Apparel',
    price: 64.99,
    originalPrice: 79.99,
    stock: 150,
    rating: 4.9,
    reviewsCount: 420,
    badge: 'Limited Edition',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-006',
    title: 'Ergonomic Task Chair with Mesh Lumbar',
    description: 'Bi-directional adjustable armrests, dynamic lumbar support, and breathable Korean mesh for 14-hour uptime shifts.',
    category: 'Furniture',
    price: 429.99,
    originalPrice: 499.99,
    stock: 14,
    rating: 4.8,
    reviewsCount: 97,
    badge: 'Best Comfort',
    imageUrl: 'https://images.unsplash.com/photo-1580481077190-7361456dd06f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-007',
    title: 'Dual Wireless Charging Station 3-in-1',
    description: 'Fast 15W MagSafe wireless charging stand with integrated Apple Watch and AirPods docks. Clean cable management.',
    category: 'Hardware',
    price: 79.99,
    originalPrice: 99.99,
    stock: 85,
    rating: 4.6,
    reviewsCount: 158,
    badge: 'Trending',
    imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod-008',
    title: 'Titanium Thermal Travel Mug (24oz)',
    description: 'Double-walled vacuum insulated mug that keeps coffee piping hot for 12 hours during overnight release deployments.',
    category: 'Accessories',
    price: 38.99,
    originalPrice: 48.99,
    stock: 210,
    rating: 4.9,
    reviewsCount: 520,
    badge: 'Essential',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
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
      itemCount: products.length
    }));
  }

  if (url.pathname === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: SERVICE_NAME, status: 'ready', totalCatalogValue: products.reduce((acc, p) => acc + (p.price * p.stock), 0) }));
  }

  if (url.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return res.end([
      `# HELP http_requests_total Total requests to ${SERVICE_NAME}`,
      `# TYPE http_requests_total counter`,
      `http_requests_total{service="${SERVICE_NAME}"} ${requestCount}`,
      `# HELP catalog_products_total Total items in catalog`,
      `# TYPE catalog_products_total gauge`,
      `catalog_products_total ${products.length}`
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

  // Catalog Endpoints
  if (url.pathname === '/products' && req.method === 'GET') {
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    let results = [...products];

    if (category && category !== 'All') {
      results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      service: SERVICE_NAME,
      total: results.length,
      categories: ['All', 'Books', 'Hardware', 'Audio', 'Apparel', 'Furniture', 'Accessories'],
      products: results
    }));
  }

  // Single Product
  if (url.pathname.startsWith('/products/') && req.method === 'GET') {
    const id = url.pathname.replace('/products/', '');
    const product = products.find(p => p.id === id);
    if (!product) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Product not found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, product }));
  }

  // Update Stock (Used by Order Service or Admin)
  if (url.pathname.includes('/stock') && req.method === 'PUT') {
    const id = url.pathname.split('/')[2];
    const product = products.find(p => p.id === id);
    if (!product) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Product not found' }));
    }
    if (typeof body.stock === 'number') {
      product.stock = body.stock;
    } else if (typeof body.decrement === 'number') {
      product.stock = Math.max(0, product.stock - body.decrement);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, product }));
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Endpoint not found on ${SERVICE_NAME}` }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
});
