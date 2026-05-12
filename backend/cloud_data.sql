-- ============================================================
-- Smart Inventory Management System – Sample Seed Data
-- ============================================================


-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (id, name) VALUES
(1, 'SUPER_ADMIN'),
(2, 'BRANCH_ADMIN'),
(3, 'EMPLOYEE'),
(4, 'RETAILER'),
(5, 'SUPPLIER');

-- ============================================================
-- USERS (passwords are BCrypt hashed for "password123")
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- ============================================================
INSERT INTO users (id, username, password, email, full_name, phone, role_id, status) VALUES
-- Super Admin
(1, 'superadmin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'superadmin@wholesale.com', 'Aravind Kumar', '9876543210', 1, 'ACTIVE'),
-- Branch Admins
(2, 'admin_hyd', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin.hyd@wholesale.com', 'Rajesh Sharma', '9876543211', 2, 'ACTIVE'),
(3, 'admin_blr', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin.blr@wholesale.com', 'Priya Patel', '9876543212', 2, 'ACTIVE'),
-- Employees (different departments)
(4, 'emp_orders1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'orders1@wholesale.com', 'Vikram Singh', '9876543213', 3, 'ACTIVE'),
(5, 'emp_warehouse1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'warehouse1@wholesale.com', 'Anita Desai', '9876543214', 3, 'ACTIVE'),
(6, 'emp_logistics1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'logistics1@wholesale.com', 'Suresh Reddy', '9876543215', 3, 'ACTIVE'),
(7, 'emp_procurement1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'procurement1@wholesale.com', 'Deepa Nair', '9876543216', 3, 'ACTIVE'),
(8, 'emp_finance1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'finance1@wholesale.com', 'Karthik Iyer', '9876543217', 3, 'ACTIVE'),
(9, 'emp_support1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'support1@wholesale.com', 'Meera Joshi', '9876543218', 3, 'ACTIVE'),
-- Retailers
(10, 'retailer1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'retailer1@shop.com', 'Ravi Retail', '9876543219', 4, 'ACTIVE'),
(11, 'retailer2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'retailer2@shop.com', 'Sunita Stores', '9876543220', 4, 'ACTIVE'),
-- Suppliers
(12, 'supplier1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'supplier1@supply.com', 'Global Supplies Pvt Ltd', '9876543221', 5, 'ACTIVE'),
(13, 'supplier2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'supplier2@supply.com', 'MegaTrade Corp', '9876543222', 5, 'ACTIVE');

-- ============================================================
-- BRANCHES
-- ============================================================
INSERT INTO branches (id, name, location, city, state, pincode, contact_phone, contact_email, admin_id, is_active) VALUES
(1, 'Hyderabad Central Warehouse', 'Plot 45, HITEC City', 'Hyderabad', 'Telangana', '500081', '04012345678', 'hyd@wholesale.com', 2, TRUE),
(2, 'Bangalore South Hub', '12th Cross, JP Nagar', 'Bangalore', 'Karnataka', '560078', '08012345678', 'blr@wholesale.com', 3, TRUE),
(3, 'Chennai East Depot', 'OMR Road, Sholinganallur', 'Chennai', 'Tamil Nadu', '600119', '04412345678', 'chn@wholesale.com', NULL, TRUE);

-- ============================================================
-- EMPLOYEES
-- ============================================================
INSERT INTO employees (id, user_id, branch_id, department, designation, salary, status, joining_date) VALUES
(1, 4, 1, 'ORDER_MANAGEMENT', 'Order Executive', 35000.00, 'ACTIVE', '2024-01-15'),
(2, 5, 1, 'WAREHOUSE', 'Warehouse Supervisor', 30000.00, 'ACTIVE', '2024-02-01'),
(3, 6, 1, 'LOGISTICS', 'Delivery Coordinator', 28000.00, 'ACTIVE', '2024-03-10'),
(4, 7, 1, 'PROCUREMENT', 'Procurement Officer', 32000.00, 'ACTIVE', '2024-01-20'),
(5, 8, 1, 'FINANCE', 'Accounts Executive', 33000.00, 'ACTIVE', '2024-04-01'),
(6, 9, 1, 'HELP_SUPPORT', 'Support Agent', 25000.00, 'ACTIVE', '2024-05-15');

-- ============================================================
-- RETAILERS
-- ============================================================
INSERT INTO retailers (id, user_id, business_name, gst_number, address, city, state, pincode, approval_status, approved_by) VALUES
(1, 10, 'Ravi General Store', '36AABCU9603R1ZM', 'Shop 12, Market Road', 'Hyderabad', 'Telangana', '500001', 'APPROVED', 2),
(2, 11, 'Sunita Supermart', '29AABCU9603R1ZN', '45 MG Road', 'Bangalore', 'Karnataka', '560001', 'APPROVED', 3);

-- ============================================================
-- SUPPLIERS
-- ============================================================
INSERT INTO suppliers (id, user_id, company_name, contact_person, phone, email, address, city, state, status) VALUES
(1, 12, 'Global Supplies Pvt Ltd', 'Amit Verma', '9876543221', 'amit@globalsupplies.com', 'Industrial Area Phase 2', 'Mumbai', 'Maharashtra', 'ACTIVE'),
(2, 13, 'MegaTrade Corporation', 'Sanjay Gupta', '9876543222', 'sanjay@megatrade.com', 'Sector 62 Industrial Hub', 'Noida', 'Uttar Pradesh', 'ACTIVE');

-- ============================================================
-- PRODUCTS
-- ============================================================
INSERT INTO products (id, name, sku, category, description, price, cost_price, unit, threshold_level, lead_time, safety_stock) VALUES
(1, 'Basmati Rice 25kg', 'RICE-BAS-25', 'Grains & Rice', 'Premium aged Basmati rice 25kg bag', 1800.00, 1400.00, 'BAG', 50, 5, 20),
(2, 'Toor Dal 50kg', 'DAL-TOOR-50', 'Pulses & Lentils', 'Yellow Toor Dal 50kg sack', 5500.00, 4800.00, 'SACK', 30, 7, 15),
(3, 'Sunflower Oil 15L', 'OIL-SUN-15', 'Cooking Oil', 'Refined sunflower oil 15 litre tin', 2200.00, 1900.00, 'TIN', 40, 4, 15),
(4, 'Sugar 50kg', 'SUG-WHT-50', 'Sugar & Sweeteners', 'White refined sugar 50kg bag', 2400.00, 2100.00, 'BAG', 60, 3, 25),
(5, 'Wheat Flour 50kg', 'FLR-WHT-50', 'Flour & Atta', 'Whole wheat flour 50kg sack', 1600.00, 1300.00, 'SACK', 45, 5, 20),
(6, 'Tea Premium 5kg', 'TEA-PRM-5', 'Beverages', 'Premium CTC tea 5kg box', 1200.00, 950.00, 'BOX', 35, 6, 10),
(7, 'Salt Iodized 25kg', 'SLT-IOD-25', 'Spices & Condiments', 'Iodized salt 25kg bag', 350.00, 250.00, 'BAG', 80, 3, 30),
(8, 'Chickpeas 50kg', 'CHK-PEA-50', 'Pulses & Lentils', 'Kabuli chickpeas 50kg sack', 4800.00, 4200.00, 'SACK', 25, 7, 10),
(9, 'Mustard Oil 15L', 'OIL-MUS-15', 'Cooking Oil', 'Cold pressed mustard oil 15L tin', 2600.00, 2200.00, 'TIN', 30, 5, 12),
(10, 'Jaggery 25kg', 'JAG-ORG-25', 'Sugar & Sweeteners', 'Organic jaggery 25kg block', 1400.00, 1100.00, 'BLOCK', 20, 6, 8);

-- ============================================================
-- INVENTORY (Branch-specific stock)
-- ============================================================
INSERT INTO inventory (branch_id, product_id, quantity) VALUES
-- Hyderabad Branch
(1, 1, 120), (1, 2, 80), (1, 3, 95), (1, 4, 150), (1, 5, 110),
(1, 6, 45), (1, 7, 200), (1, 8, 60), (1, 9, 75), (1, 10, 40),
-- Bangalore Branch
(2, 1, 90), (2, 2, 55), (2, 3, 70), (2, 4, 130), (2, 5, 85),
(2, 6, 30), (2, 7, 160), (2, 8, 45), (2, 9, 50), (2, 10, 25),
-- Chennai Branch
(3, 1, 60), (3, 2, 35), (3, 3, 50), (3, 4, 90), (3, 5, 65),
(3, 6, 20), (3, 7, 120), (3, 8, 30), (3, 9, 40), (3, 10, 18);

-- ============================================================
-- SAMPLE ORDERS
-- ============================================================
INSERT INTO orders (id, order_number, retailer_id, branch_id, total_amount, status, created_at) VALUES
(1, 'ORD-2026-0001', 1, 1, 27600.00, 'DELIVERED', '2026-01-15 10:30:00'),
(2, 'ORD-2026-0002', 1, 1, 13200.00, 'SHIPPED', '2026-02-01 14:00:00'),
(3, 'ORD-2026-0003', 2, 2, 18400.00, 'PACKED', '2026-02-10 09:15:00'),
(4, 'ORD-2026-0004', 2, 2, 9600.00, 'APPROVED', '2026-02-20 11:45:00'),
(5, 'ORD-2026-0005', 1, 1, 7200.00, 'PENDING', '2026-02-25 16:30:00');

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 10, 1800.00, 18000.00), (1, 3, 4, 2200.00, 8800.00), (1, 7, 2, 350.00, 700.00),
(2, 4, 5, 2400.00, 12000.00), (2, 6, 1, 1200.00, 1200.00),
(3, 2, 2, 5500.00, 11000.00), (3, 5, 3, 1600.00, 4800.00), (3, 8, 1, 4800.00, 4800.00),
(4, 9, 2, 2600.00, 5200.00), (4, 10, 2, 1400.00, 2800.00),
(5, 1, 4, 1800.00, 7200.00);

-- ============================================================
-- ORDER STATUS LOGS
-- ============================================================
INSERT INTO order_status_logs (order_id, status, changed_by, remarks, updated_at) VALUES
(1, 'PENDING', 10, 'Order placed', '2026-01-15 10:30:00'),
(1, 'APPROVED', 4, 'Stock verified', '2026-01-15 12:00:00'),
(1, 'PACKED', 5, 'Items packed', '2026-01-16 09:00:00'),
(1, 'SHIPPED', 6, 'Dispatched via truck', '2026-01-16 14:00:00'),
(1, 'DELIVERED', 6, 'Delivered successfully', '2026-01-17 11:00:00'),
(2, 'PENDING', 10, 'Order placed', '2026-02-01 14:00:00'),
(2, 'APPROVED', 4, 'Approved', '2026-02-01 16:00:00'),
(2, 'PACKED', 5, 'Packed', '2026-02-02 10:00:00'),
(2, 'SHIPPED', 6, 'Shipped', '2026-02-02 15:00:00'),
(3, 'PENDING', 11, 'Order placed', '2026-02-10 09:15:00'),
(3, 'APPROVED', 4, 'Approved', '2026-02-10 11:00:00'),
(3, 'PACKED', 5, 'Packed', '2026-02-11 08:00:00'),
(4, 'PENDING', 11, 'Order placed', '2026-02-20 11:45:00'),
(4, 'APPROVED', 4, 'Approved', '2026-02-20 14:00:00'),
(5, 'PENDING', 10, 'Order placed', '2026-02-25 16:30:00');

-- ============================================================
-- PAYMENTS
-- ============================================================
INSERT INTO payments (order_id, amount, payment_status, payment_method, transaction_id, payment_date) VALUES
(1, 27600.00, 'PAID', 'BANK_TRANSFER', 'TXN-20260115-001', '2026-01-18 10:00:00'),
(2, 13200.00, 'PAID', 'UPI', 'TXN-20260203-002', '2026-02-03 12:00:00'),
(3, 18400.00, 'PENDING', NULL, NULL, NULL),
(4, 9600.00, 'PENDING', NULL, NULL, NULL),
(5, 7200.00, 'PENDING', NULL, NULL, NULL);

-- ============================================================
-- SALES
-- ============================================================
INSERT INTO sales (order_id, revenue, cost, profit) VALUES
(1, 27600.00, 22400.00, 5200.00),
(2, 13200.00, 11200.00, 2000.00);

-- ============================================================
-- SAMPLE PROCUREMENT ORDERS
-- ============================================================
INSERT INTO procurement_orders (branch_id, supplier_id, product_id, quantity, expected_date, status, created_by) VALUES
(1, 1, 6, 50, '2026-03-10', 'REQUESTED', 7),
(2, 2, 10, 30, '2026-03-15', 'CONFIRMED', 7);

-- ============================================================
-- SAMPLE SUPPORT TICKETS
-- ============================================================
INSERT INTO support_tickets (ticket_number, retailer_id, branch_id, assigned_employee, subject, description, status, priority) VALUES
('TKT-2026-0001', 1, 1, 6, 'Delivery Delayed', 'My order ORD-2026-0002 shipping is delayed by 2 days.', 'IN_PROGRESS', 'HIGH'),
('TKT-2026-0002', 2, 2, 6, 'Wrong Item Received', 'Received Toor dal instead of Chickpeas.', 'OPEN', 'MEDIUM');

-- ============================================================
-- SAMPLE MESSAGES
-- ============================================================
INSERT INTO messages (sender_id, receiver_id, content, is_read) VALUES
(10, 9, 'Hi, can you check on my order ORD-2026-0002 status?', TRUE),
(9, 10, 'Sure, let me check with the logistics team.', TRUE),
(9, 6, 'Please update delivery status for ORD-2026-0002', FALSE),
(2, 1, 'Monthly sales report for Hyderabad branch is ready for review.', FALSE);

-- ============================================================
-- SAMPLE STOCK MOVEMENT LOGS
-- ============================================================
INSERT INTO stock_movement_logs (branch_id, product_id, change_type, quantity_changed, quantity_before, quantity_after, reference_type, reference_id, changed_by) VALUES
(1, 1, 'ORDER_PACKED', -10, 130, 120, 'ORDER', 1, 5),
(1, 3, 'ORDER_PACKED', -4, 99, 95, 'ORDER', 1, 5),
(1, 4, 'ORDER_PACKED', -5, 155, 150, 'ORDER', 2, 5);
