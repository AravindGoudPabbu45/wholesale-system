-- ============================================================
-- QA TEST DATA SEED SCRIPT
-- Password hash = BCrypt of 'password123'
-- ============================================================

-- Branch: Hyderabad Central Warehouse (id=2)
INSERT IGNORE INTO users (id, username, password, email, full_name, phone, role_id, status) VALUES
(10, 'admin_hyd', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'admin_hyd@wholesale.com', 'Hyderabad Admin', '9876540001', 3, 'ACTIVE');

INSERT IGNORE INTO branches (id, name, location, city, state, pincode, admin_id, is_active, created_at, updated_at) VALUES
(2, 'Hyderabad Central Warehouse', 'HITEC City, Madhapur', 'Hyderabad', 'Telangana', '500081', 10, true, NOW(), NOW());

-- Branch: Bangalore South Hub (id=3)
INSERT IGNORE INTO users (id, username, password, email, full_name, phone, role_id, status) VALUES
(11, 'admin_blr', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'admin_blr@wholesale.com', 'Bangalore Admin', '9876540002', 3, 'ACTIVE');

INSERT IGNORE INTO branches (id, name, location, city, state, pincode, admin_id, is_active, created_at, updated_at) VALUES
(3, 'Bangalore South Hub', 'Koramangala, HSR Layout', 'Bangalore', 'Karnataka', '560034', 11, true, NOW(), NOW());

-- ============================================================
-- EMPLOYEES (all linked to Hyderabad branch_id=2)
-- ============================================================
INSERT IGNORE INTO users (id, username, password, email, full_name, phone, role_id, status) VALUES
(20, 'emp_orders1', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'emp_orders1@wholesale.com', 'Rahul Orders', '9876540010', 2, 'ACTIVE'),
(21, 'emp_warehouse1', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'emp_warehouse1@wholesale.com', 'Suresh Warehouse', '9876540011', 2, 'ACTIVE'),
(22, 'emp_logistics1', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'emp_logistics1@wholesale.com', 'Kumar Logistics', '9876540012', 2, 'ACTIVE'),
(23, 'emp_procurement1', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'emp_procurement1@wholesale.com', 'Anil Procurement', '9876540013', 2, 'ACTIVE'),
(24, 'emp_finance1', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'emp_finance1@wholesale.com', 'Pooja Finance', '9876540014', 2, 'ACTIVE'),
(25, 'emp_support1', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'emp_support1@wholesale.com', 'Divya Support', '9876540015', 2, 'ACTIVE');

INSERT IGNORE INTO employees (id, user_id, branch_id, department, designation, salary, status, joining_date, created_at, updated_at) VALUES
(1, 20, 2, 'ORDER_MANAGEMENT', 'Order Manager', 40000.00, 'ACTIVE', '2025-06-01', NOW(), NOW()),
(2, 21, 2, 'WAREHOUSE', 'Warehouse Supervisor', 38000.00, 'ACTIVE', '2025-06-01', NOW(), NOW()),
(3, 22, 2, 'LOGISTICS', 'Logistics Coordinator', 36000.00, 'ACTIVE', '2025-07-01', NOW(), NOW()),
(4, 23, 2, 'PROCUREMENT', 'Procurement Officer', 42000.00, 'ACTIVE', '2025-05-15', NOW(), NOW()),
(5, 24, 2, 'FINANCE', 'Finance Analyst', 45000.00, 'ACTIVE', '2025-04-01', NOW(), NOW()),
(6, 25, 2, 'HELP_SUPPORT', 'Support Executive', 32000.00, 'ACTIVE', '2025-08-01', NOW(), NOW());

-- ============================================================
-- RETAILERS (retailer1, retailer2)
-- ============================================================
INSERT IGNORE INTO users (id, username, password, email, full_name, phone, role_id, status) VALUES
(30, 'retailer1', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'retailer1@shop.com', 'Ravi Kumar', '9876541001', 4, 'ACTIVE'),
(31, 'retailer2', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'retailer2@shop.com', 'Sunita Devi', '9876541002', 4, 'ACTIVE');

INSERT IGNORE INTO retailers (id, user_id, business_name, gst_number, address, city, state, pincode, approval_status, approved_by, approved_at, created_at, updated_at) VALUES
(10, 30, 'Ravi General Store', '36AABCU9603R1ZM', 'Shop 12, Begumpet Road', 'Hyderabad', 'Telangana', '500016', 'APPROVED', 1, NOW(), NOW(), NOW()),
(11, 31, 'Sunita Supermart', '29AADCS2230H1ZV', 'Plot 45, MG Road', 'Bangalore', 'Karnataka', '560001', 'APPROVED', 1, NOW(), NOW(), NOW());

-- ============================================================
-- SUPPLIERS (supplier2)
-- ============================================================
INSERT IGNORE INTO users (id, username, password, email, full_name, phone, role_id, status) VALUES
(41, 'supplier2', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'supplier2@megatrade.com', 'Vikram Megatrade', '9876542002', 5, 'ACTIVE');

INSERT IGNORE INTO suppliers (id, user_id, company_name, contact_person, phone, email, address, city, state, pincode, gst_number, status, created_at, updated_at) VALUES
(2, 41, 'MegaTrade Corporation', 'Vikram Mehta', '9876542002', 'supplier2@megatrade.com', '88 Industrial Zone', 'Mumbai', 'Maharashtra', '400001', '27AADCM3456F1ZP', 'ACTIVE', NOW(), NOW());

-- ============================================================
-- PRODUCTS (5 products)
-- ============================================================
INSERT IGNORE INTO products (id, name, sku, category, description, price, cost_price, unit, threshold_level, lead_time, safety_stock, is_active, created_at, updated_at) VALUES
(2, 'Toor Dal Premium', 'DAL-TOOR-001', 'Pulses', 'Premium Toor Dal 1kg', 120.00, 90.00, 'KG', 15, 5, 8, true, NOW(), NOW()),
(3, 'Sunflower Oil 5L', 'OIL-SUN-005', 'Oils', 'Refined Sunflower Oil 5 Litre', 550.00, 420.00, 'PCS', 10, 7, 5, true, NOW(), NOW()),
(4, 'Sugar Crystal 1kg', 'SUG-CRY-001', 'Sweeteners', 'Crystal Sugar 1kg Pack', 45.00, 35.00, 'KG', 20, 3, 10, true, NOW(), NOW()),
(5, 'Wheat Flour 10kg', 'FLR-WHT-010', 'Flour', 'Premium Wheat Flour 10kg Bag', 380.00, 300.00, 'PCS', 12, 5, 6, true, NOW(), NOW());

-- ============================================================
-- INVENTORY (stock at Hyderabad branch for all products)
-- ============================================================
INSERT IGNORE INTO inventory (id, branch_id, product_id, quantity, last_updated) VALUES
(2, 2, 1, 200, NOW()),
(3, 2, 2, 150, NOW()),
(4, 2, 3, 80, NOW()),
(5, 2, 4, 300, NOW()),
(6, 2, 5, 100, NOW()),
(7, 3, 1, 120, NOW()),
(8, 3, 2, 90, NOW()),
(9, 3, 3, 60, NOW()),
(10, 3, 4, 180, NOW()),
(11, 3, 5, 75, NOW());
