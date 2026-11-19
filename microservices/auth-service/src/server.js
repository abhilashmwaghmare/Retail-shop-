/**
 * RetailCorp Auth & Identity Microservice (Port 5001)
 */
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 5001;
const SERVICE_NAME = 'auth-service';
const START_TIME = Date.now();
let requestCount = 0;

// In-Memory User Store (Backed by seed users)
const users = new Map([
  ['admin@retailcorp.com', {
    id: 'usr-admin-01',
    email: 'admin@retailcorp.com',
    name: 'Platform Administrator',
    role: 'admin',
    passwordHash: hashPassword('AdminPass2026!'),
    createdAt: new Date().toISOString()
  }],
  ['devops@retailcorp.com', {
    id: 'usr-devops-02',
    email: 'devops@retailcorp.com',
    name: 'Alex Rivera (SRE Lead)',
    role: 'customer',
    passwordHash: hashPassword('DevOpsPass2026!'),
    createdAt: new Date().toISOString()
  }]
]);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'retailcorp-salt').digest('hex');
}

function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', 'super-secret-jwt-key').update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

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
      memory: process.memoryUsage()
    }));
  }

  if (url.pathname === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ service: SERVICE_NAME, status: 'ready', userCount: users.size }));
  }

  if (url.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return res.end([
      `# HELP http_requests_total Total requests to ${SERVICE_NAME}`,
      `# TYPE http_requests_total counter`,
      `http_requests_total{service="${SERVICE_NAME}"} ${requestCount}`,
      `# HELP active_users_total Total registered users`,
      `# TYPE active_users_total gauge`,
      `active_users_total ${users.size}`,
      `# HELP service_uptime_seconds Service uptime in seconds`,
      `# TYPE service_uptime_seconds gauge`,
      `service_uptime_seconds ${Math.floor((Date.now() - START_TIME) / 1000)}`
    ].join('\n') + '\n');
  }

  // Parse Body helper
  let body = {};
  if (req.method === 'POST') {
    try {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const raw = Buffer.concat(buffers).toString();
      if (raw) body = JSON.parse(raw);
    } catch (e) { /* ignore json parse err */ }
  }

  // Auth Endpoints
  if (url.pathname === '/auth/login' && req.method === 'POST') {
    const { email, password } = body;
    const user = users.get(email);
    if (!user || user.passwordHash !== hashPassword(password || '')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Invalid email or password' }));
    }
    const token = generateToken(user);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    }));
  }

  if (url.pathname === '/auth/register' && req.method === 'POST') {
    const { email, password, name } = body;
    if (!email || !password || !name) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Name, email, and password are required' }));
    }
    if (users.has(email)) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'User email already registered' }));
    }
    const newUser = {
      id: 'usr-' + Date.now().toString(36),
      email,
      name,
      role: 'customer',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };
    users.set(email, newUser);
    const token = generateToken(newUser);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }
    }));
  }

  if (url.pathname === '/auth/profile') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      activeUsers: Array.from(users.values()).map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role }))
    }));
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Not Found on ${SERVICE_NAME}: ${req.method} ${url.pathname}` }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
});
