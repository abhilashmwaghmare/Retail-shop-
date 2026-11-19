-- =============================================================================
-- Seed Data 01: Initial Users and Product Catalog
-- Passwords hashed using bcrypt (10 rounds):
-- Admin:    AdminSecure123!  -> $2a$10$wK1k6aCj4c3E8bIqL1pG0uK5x2z8b3z1r0s9t8u7v6w5x4y3z2a1b
-- Customer: StudentPass123!  -> $2a$10$xL2m7bDi5d4F9cJrM2qH1vL6y3a9c4a2s1t0u9v8w7x6y5z4a3b2c
-- =============================================================================

INSERT INTO users (id, full_name, email, password_hash, role)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'System Administrator', 'admin@retailcorp.io', '$2a$10$wK1k6aCj4c3E8bIqL1pG0uK5x2z8b3z1r0s9t8u7v6w5x4y3z2a1b', 'ADMIN'),
    ('a0000000-0000-0000-0000-000000000002', 'DevOps Student', 'student@retailcorp.io', '$2a$10$xL2m7bDi5d4F9cJrM2qH1vL6y3a9c4a2s1t0u9v8w7x6y5z4a3b2c', 'CUSTOMER')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (id, name, slug, description, price, stock_quantity, category, image_url)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Cloud Kubernetes Architecture Handbook', 'k8s-architecture-book', 'Comprehensive guide to production Kubernetes, GitOps, and service meshes.', 49.99, 50, 'Books', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'),
    ('b0000000-0000-0000-0000-000000000002', 'Mechanical Coding Keyboard (Tactile Browns)', 'mech-keyboard-brown', 'USB-C mechanical keyboard with programmable QMK firmware and RGB backlighting.', 129.99, 35, 'Hardware', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'),
    ('b0000000-0000-0000-0000-000000000003', 'DevOps Engineer Zipper Hoodie', 'devops-hoodie', 'Heavyweight organic cotton hoodie: "It worked in staging, now it is an incident."', 59.99, 120, 'Apparel', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600'),
    ('b0000000-0000-0000-0000-000000000004', 'Dual-Band Wi-Fi 6 Home Lab Router', 'wifi6-homelab-router', 'Gigabit low-latency router with OpenWrt support for home laboratory testbeds.', 89.99, 20, 'Hardware', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600'),
    ('b0000000-0000-0000-0000-000000000005', 'Terraform & AWS Enterprise Automation', 'terraform-aws-guide', 'Master infrastructure as code, remote state locking, and multi-account AWS topologies.', 39.99, 85, 'Books', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600'),
    ('b0000000-0000-0000-0000-000000000006', 'Ultra-Wide Desk Mat with Linux CLI Shortcuts', 'linux-desk-mat', 'Stitched-edge water-resistant desk pad featuring essential Bash and vi commands.', 24.99, 200, 'Apparel', 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600'),
    ('b0000000-0000-0000-0000-000000000007', '10-in-1 Thunderbolt 4 Docking Station', 'thunderbolt4-dock', 'Triple 4K monitor support, 100W PD charging, 2.5G Ethernet, and SD card reader.', 179.99, 15, 'Hardware', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600'),
    ('b0000000-0000-0000-0000-000000000008', 'Site Reliability Engineering Field Guide', 'sre-field-guide', 'Incident response runbooks, post-mortems, error budgets, and SLA/SLO engineering.', 44.99, 60, 'Books', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600')
ON CONFLICT (slug) DO NOTHING;
