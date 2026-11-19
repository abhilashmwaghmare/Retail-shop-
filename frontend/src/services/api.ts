/**
 * API Service Client
 * Handles REST calls with JWT headers, error unwrapping, and health checks.
 */

import { Product, Order, DashboardMetrics, User } from '../types';

const API_BASE = (window as any).API_BASE_URL || '';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('retailcorp_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

// -----------------------------------------------------------------------------
// Products API
// -----------------------------------------------------------------------------
export async function fetchProducts(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return request<{ success: boolean; products: Product[]; total: number; totalPages: number }>(
    `/api/products${query ? `?${query}` : ''}`
  );
}

export async function fetchProduct(id: string) {
  return request<{ success: boolean; data: Product }>(`/api/products/${id}`);
}

export async function createProduct(payload: Partial<Product>) {
  return request<{ success: boolean; data: Product }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  return request<{ success: boolean; data: Product }>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string) {
  return request<{ success: boolean; message: string }>(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

// -----------------------------------------------------------------------------
// Auth API
// -----------------------------------------------------------------------------
export async function loginUser(email: string, password: string) {
  return request<{ success: boolean; data: { token: string; user: User } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(fullName: string, email: string, password: string) {
  return request<{ success: boolean; data: { token: string; user: User } }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  });
}

export async function fetchCurrentUser() {
  return request<{ success: boolean; data: User }>('/api/auth/me');
}

// -----------------------------------------------------------------------------
// Orders API
// -----------------------------------------------------------------------------
export async function placeOrder(orderData: {
  customerEmail: string;
  shippingAddress: string;
  items: { productId: string; quantity: number }[];
}) {
  return request<{ success: boolean; data: Order }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

export async function fetchMyOrders() {
  return request<{ success: boolean; data: Order[] }>('/api/orders');
}

// -----------------------------------------------------------------------------
// Admin API
// -----------------------------------------------------------------------------
export async function fetchAdminDashboard() {
  return request<{
    success: boolean;
    data: {
      metrics: DashboardMetrics;
      lowStockProducts: Product[];
      recentOrders: Order[];
    };
  }>('/api/admin/dashboard');
}

// -----------------------------------------------------------------------------
// Health & Observability API
// -----------------------------------------------------------------------------
export async function checkLiveness() {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/healthz`);
  const latency = Math.round(performance.now() - start);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, latency, data };
}

export async function checkReadiness() {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/ready`);
  const latency = Math.round(performance.now() - start);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, latency, data };
}

export async function triggerCpuLoad(durationMs = 1000) {
  return request<{ success: boolean; message: string }>(`/api/simulate/cpu?duration=${durationMs}`);
}

export async function triggerSimulatedError() {
  return request<{ success: boolean; error: string }>('/api/simulate/error');
}
