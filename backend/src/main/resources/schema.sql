-- ============================================================
-- Smart Inventory Management System
-- Multi-Branch B2B Wholesale Automation Platform
-- Complete Database Schema
-- ============================================================

-- ============================================================
-- 1. ROLES TABLE
-- Stores system roles: SUPER_ADMIN, BRANCH_ADMIN, EMPLOYEE, RETAILER, SUPPLIER
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ============================================================
-- 2. USERS TABLE
-- Central authentication table for all system users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================
-- 3. BRANCHES TABLE
-- Each warehouse/branch location in the enterprise
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(150),
    admin_id BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_branches_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 4. EMPLOYEES TABLE
-- Branch-level employees with department and salary info
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(100),
    salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joining_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_employees_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);

-- ============================================================
-- 5. RETAILERS TABLE
-- B2B retailer accounts requiring admin approval
-- ============================================================
CREATE TABLE IF NOT EXISTS retailers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    gst_number VARCHAR(20),
    business_license VARCHAR(255),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by BIGINT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_retailers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_retailers_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_retailers_approval ON retailers(approval_status);

-- ============================================================
-- 6. SUPPLIERS TABLE
-- External suppliers for procurement
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_suppliers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7. PRODUCTS TABLE
-- Master product catalog with pricing and reorder settings
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2) NOT NULL,
    unit VARCHAR(30) DEFAULT 'PCS',
    threshold_level INT NOT NULL DEFAULT 10,
    lead_time INT NOT NULL DEFAULT 7,
    safety_stock INT NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================================
-- 8. INVENTORY TABLE
-- Branch-specific stock levels for each product
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_inventory_branch_product UNIQUE (branch_id, product_id)
) ENGINE=InnoDB;

CREATE INDEX idx_inventory_branch ON inventory(branch_id);

-- ============================================================
-- 9. ORDERS TABLE
-- Retailer bulk orders linked to a specific branch
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    retailer_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_retailer FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_orders_retailer ON orders(retailer_id);
CREATE INDEX idx_orders_branch ON orders(branch_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================================
-- 10. ORDER ITEMS TABLE
-- Individual line items within an order
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- 11. ORDER STATUS LOGS TABLE
-- Audit trail for every order status change
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    changed_by BIGINT,
    remarks VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_osl_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_osl_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_osl_order ON order_status_logs(order_id);

-- ============================================================
-- 12. PROCUREMENT ORDERS TABLE
-- Purchase orders sent to suppliers for restocking
-- ============================================================
CREATE TABLE IF NOT EXISTS procurement_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    expected_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    created_by BIGINT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_po_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_po_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_po_branch ON procurement_orders(branch_id);
CREATE INDEX idx_po_status ON procurement_orders(status);

-- ============================================================
-- 13. PAYMENTS TABLE
-- Payment records linked to orders
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- ============================================================
-- 14. SALES TABLE
-- Revenue, cost, and profit calculation per order
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    revenue DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    profit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 15. MESSAGES TABLE
-- Internal messaging system between all user types
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted_sender BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted_receiver BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

-- ============================================================
-- 16. SUPPORT TICKETS TABLE
-- Help desk tickets raised by retailers
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    retailer_id BIGINT NOT NULL,
    branch_id BIGINT,
    assigned_employee BIGINT,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_retailer FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_employee FOREIGN KEY (assigned_employee) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_retailer ON support_tickets(retailer_id);

-- ============================================================
-- 17. STOCK MOVEMENT LOGS TABLE
-- Audit trail for all inventory changes
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movement_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    change_type VARCHAR(30) NOT NULL,
    quantity_changed INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    changed_by BIGINT,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sml_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_sml_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_sml_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_sml_branch_product ON stock_movement_logs(branch_id, product_id);

-- ============================================================
-- 18. ANOMALY LOGS TABLE
-- Flagged anomalies detected by AI simulation
-- ============================================================
CREATE TABLE IF NOT EXISTS anomaly_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    anomaly_type VARCHAR(50) NOT NULL,
    description TEXT,
    daily_average DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_anomaly_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_anomaly_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_anomaly_branch ON anomaly_logs(branch_id);
