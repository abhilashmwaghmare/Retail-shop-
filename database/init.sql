-- ==============================================================================
-- RetailCorp Enterprise Database Initialization (PostgreSQL 15)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Catalog Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    category VARCHAR(50) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    rating DECIMAL(2, 1) DEFAULT 4.8,
    reviews_count INT DEFAULT 100,
    badge VARCHAR(50),
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    shipping_address TEXT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    shipping DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Confirmed',
    payment_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Audit Table
CREATE TABLE IF NOT EXISTS payments (
    transaction_id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    card_last4 VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Audit Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Users
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@retailcorp.com', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Platform Administrator', 'admin'),
('devops@retailcorp.com', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Alex Rivera (SRE Lead)', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Seed Initial Products Catalog
INSERT INTO products (id, title, description, price, original_price, category, stock, rating, reviews_count, badge, image_url) VALUES
('prod-001', 'Cloud Architecture & Kubernetes Handbook', 'Comprehensive 800-page production guide for multi-region Kubernetes, GitOps, and service mesh patterns.', 54.99, 69.99, 'Books', 120, 4.9, 312, 'Bestseller', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'),
('prod-002', 'Apex Mechanical Keyboard RGB (Hot-Swap)', 'Custom gasket-mounted mechanical keyboard with Lubed Gateron Oil Kings and sound dampening foam.', 149.99, 179.99, 'Hardware', 45, 4.8, 184, 'Popular', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80'),
('prod-003', 'UltraWide 38" Curved IPS Observability Monitor', '3840x1600 WQHD+ 144Hz curved display with Thunderbolt 4 power delivery. Tailored for Grafana dashboards.', 799.99, 949.99, 'Hardware', 18, 5.0, 89, 'Top Rated', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'),
('prod-004', 'Noise Cancelling Studio Headphones Pro', 'Hybrid Active Noise Cancellation with 45-hour battery life and memory foam cups for incident triage.', 249.99, 299.99, 'Audio', 62, 4.7, 245, 'Staff Pick', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'),
('prod-005', 'DevOps Zero-Downtime Premium Hoodie', '400 GSM heavyweight brushed organic cotton hoodie featuring embroidered terminal syntax.', 64.99, 79.99, 'Apparel', 150, 4.9, 420, 'Limited Edition', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'),
('prod-006', 'Ergonomic Task Chair with Mesh Lumbar', 'Bi-directional adjustable armrests, dynamic lumbar support, and breathable Korean mesh for 14-hour uptime shifts.', 429.99, 499.99, 'Furniture', 14, 4.8, 97, 'Best Comfort', 'https://images.unsplash.com/photo-1580481077190-7361456dd06f?w=600&auto=format&fit=crop&q=80'),
('prod-007', 'Dual Wireless Charging Station 3-in-1', 'Fast 15W MagSafe wireless charging stand with integrated Apple Watch and AirPods docks.', 79.99, 99.99, 'Hardware', 85, 4.6, 158, 'Trending', 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=600&auto=format&fit=crop&q=80'),
('prod-008', 'Titanium Thermal Travel Mug (24oz)', 'Double-walled vacuum insulated mug that keeps coffee piping hot for 12 hours during release deployments.', 38.99, 48.99, 'Accessories', 210, 4.9, 520, 'Essential', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Orders
INSERT INTO orders (id, user_id, customer_name, email, shipping_address, subtotal, tax, shipping, total_amount, status, payment_id) VALUES
('ORD-7821-X9', 'usr-admin-01', 'Platform Administrator', 'admin@retailcorp.com', '42 Cloud Way, Suite 100, Sydney NSW 2000', 54.99, 4.40, 9.99, 69.38, 'Delivered', 'PAY-TX-98412'),
('ORD-5412-A3', 'usr-devops-02', 'Alex Rivera (SRE Lead)', 'devops@retailcorp.com', '10 SRE Parkway, Melbourne VIC 3000', 279.97, 22.40, 0.00, 302.37, 'Confirmed', 'PAY-TX-98413')
ON CONFLICT (id) DO NOTHING;
