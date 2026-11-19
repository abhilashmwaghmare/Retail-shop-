/**
 * Shared TypeScript Domain Types
 */

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  image_url: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_email: string;
  shipping_address: string;
  total_amount: string | number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  created_at: string;
  items?: OrderItem[];
}

export interface DashboardMetrics {
  totalRevenue: string;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  lowStockCount: number;
}

export interface HealthStatus {
  liveness: 'OK' | 'FAIL' | 'CHECKING';
  readiness: 'CONNECTED' | 'DISCONNECTED' | 'CHECKING';
  latencyMs: number;
  version: string;
  rawHealthz?: any;
  rawReady?: any;
}
