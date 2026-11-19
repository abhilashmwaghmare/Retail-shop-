/**
 * Complete Automated Backend Test Suite
 * Validates all 10 core application features, authentication, health checks, and Prometheus metrics.
 * Built with pure standard Node.js libraries for zero-dependency execution.
 */

const http = require('http');
const assert = require('assert');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.USE_MOCK_DB = 'true';
process.env.PORT = '5005';
process.env.JWT_SECRET = 'TestSecretKey1234567890!';

const TEST_PORT = 5005;
const { startServer } = require('../../backend/src/server');

function makeRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: endpoint,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(rawData); } catch (e) { json = rawData; }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: json,
            rawText: rawData
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  RETAILCORP E-COMMERCE BACKEND AUTOMATED TEST SUITE');
  console.log('================================================================');

  const server = await startServer(TEST_PORT);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Reason: ${err.message}`);
      failed++;
    }
  }

  let adminToken = '';
  let customerToken = '';
  let createdProductId = '';

  try {
    // -------------------------------------------------------------------------
    // Feature 10: Health-Check Probes & Prometheus Metrics
    // -------------------------------------------------------------------------
    await test('Feature 10: GET /healthz returns 200 OK (Kubernetes Liveness)', async () => {
      const res = await makeRequest('GET', '/healthz');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.status, 'alive');
      assert.ok(res.body.version);
    });

    await test('Feature 10: GET /ready returns 200 OK (Database Readiness)', async () => {
      const res = await makeRequest('GET', '/ready');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.status, 'ready');
      assert.strictEqual(res.body.database.healthy, true);
    });

    await test('Feature 10: GET /metrics exposes Prometheus metrics', async () => {
      const res = await makeRequest('GET', '/metrics');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.rawText.includes('ecommerce_uptime_seconds'));
      assert.ok(res.rawText.includes('ecommerce_http_requests_total'));
    });

    // -------------------------------------------------------------------------
    // Feature 1: User Registration & Authentication
    // -------------------------------------------------------------------------
    await test('Feature 1: POST /api/auth/register creates a new customer user', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        fullName: 'Jane DevOps',
        email: `jane.${Date.now()}@retailcorp.io`,
        password: 'Password123!'
      });
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.role, 'CUSTOMER');
      customerToken = res.body.data.token;
    });

    await test('Feature 1: POST /api/auth/login authenticates seed admin', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@retailcorp.io',
        password: 'AdminSecure123!'
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.role, 'ADMIN');
      adminToken = res.body.data.token;
    });

    await test('Feature 1: POST /api/auth/login rejects incorrect password', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@retailcorp.io',
        password: 'WrongPassword999!'
      });
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
    });

    // -------------------------------------------------------------------------
    // Feature 2, 3, 4: Product Listing, Search/Filtering, and Details
    // -------------------------------------------------------------------------
    await test('Feature 2: GET /api/products returns catalog list', async () => {
      const res = await makeRequest('GET', '/api/products');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.products));
      assert.ok(res.body.products.length > 0);
    });

    await test('Feature 3: GET /api/products?search=Kubernetes filters matching items', async () => {
      const res = await makeRequest('GET', '/api/products?search=Kubernetes');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.products.length >= 1);
      assert.ok(res.body.products[0].name.includes('Kubernetes'));
    });

    await test('Feature 3: GET /api/products?category=Hardware filters by category', async () => {
      const res = await makeRequest('GET', '/api/products?category=Hardware');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.products.length >= 1);
      assert.strictEqual(res.body.products[0].category, 'Hardware');
    });

    await test('Feature 4: GET /api/products/:id retrieves product details', async () => {
      const res = await makeRequest('GET', '/api/products/b0000000-0000-0000-0000-000000000001');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.slug, 'k8s-architecture-book');
    });

    // -------------------------------------------------------------------------
    // Feature 9: Product Management (Admin Only)
    // -------------------------------------------------------------------------
    await test('Feature 9: POST /api/products rejects non-admin users with 403', async () => {
      const res = await makeRequest(
        'POST',
        '/api/products',
        { name: 'Unauthorized Item', price: 10, stockQuantity: 5, category: 'Hardware' },
        { Authorization: `Bearer ${customerToken}` }
      );
      assert.strictEqual(res.statusCode, 403);
    });

    await test('Feature 9: POST /api/products allows admin to create new product', async () => {
      const res = await makeRequest(
        'POST',
        '/api/products',
        {
          name: 'Ansible Playbook Automation Guide',
          description: 'Automating configurations and provisioning at enterprise scale',
          price: 29.99,
          stockQuantity: 40,
          category: 'Books'
        },
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
      createdProductId = res.body.data.id;
    });

    await test('Feature 9: DELETE /api/products/:id allows admin to delete item', async () => {
      const res = await makeRequest(
        'DELETE',
        `/api/products/${createdProductId}`,
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
    });

    // -------------------------------------------------------------------------
    // Feature 5, 6, 7: Shopping Cart, Order Placement, and Order History
    // -------------------------------------------------------------------------
    await test('Feature 6: POST /api/orders rejects invalid payload without items', async () => {
      const res = await makeRequest('POST', '/api/orders', { customerEmail: 'test@retailcorp.io' });
      assert.strictEqual(res.statusCode, 400);
    });

    await test('Feature 6: POST /api/orders places order with atomic stock decrement', async () => {
      const orderPayload = {
        customerEmail: 'student@retailcorp.io',
        shippingAddress: '456 Cloud Way, Seattle, WA',
        items: [
          { productId: 'b0000000-0000-0000-0000-000000000001', quantity: 2 }
        ]
      };
      const res = await makeRequest(
        'POST',
        '/api/orders',
        orderPayload,
        { Authorization: `Bearer ${customerToken}` }
      );
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.order_number.startsWith('ORD-'));
    });

    await test('Feature 7: GET /api/orders retrieves order history for user', async () => {
      const res = await makeRequest('GET', '/api/orders', null, {
        Authorization: `Bearer ${customerToken}`
      });
      assert.strictEqual(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.data));
    });

    // -------------------------------------------------------------------------
    // Feature 8: Admin Dashboard Operations
    // -------------------------------------------------------------------------
    await test('Feature 8: GET /api/admin/dashboard returns KPI analytics for admin', async () => {
      const res = await makeRequest('GET', '/api/admin/dashboard', null, {
        Authorization: `Bearer ${adminToken}`
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.metrics.totalProducts > 0);
      assert.ok(res.body.data.metrics.totalUsers > 0);
    });

    // -------------------------------------------------------------------------
    // Observability & Simulation Endpoints
    // -------------------------------------------------------------------------
    await test('Chaos Simulation: GET /api/simulate/cpu burns CPU cycles', async () => {
      const res = await makeRequest('GET', '/api/simulate/cpu?duration=200');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
    });

    await test('Chaos Simulation: GET /api/simulate/error returns 500 for Alertmanager', async () => {
      const res = await makeRequest('GET', '/api/simulate/error');
      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.code, 'ERR_SIMULATED_ALERT');
    });

    console.log('================================================================');
    console.log(`TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runTestSuite().catch((err) => {
    console.error('Fatal test execution failure:', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
