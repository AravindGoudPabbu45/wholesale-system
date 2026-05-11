-- ============================================================
-- Smart Inventory Management System – Core Setup Data
-- ============================================================

-- ============================================================
-- ROLES
-- ============================================================
INSERT IGNORE INTO roles (id, name) VALUES
(1, 'SUPER_ADMIN'),
(2, 'BRANCH_ADMIN'),
(3, 'EMPLOYEE'),
(4, 'RETAILER'),
(5, 'SUPPLIER');

-- ============================================================
-- USERS (passwords are BCrypt hashed for "password123")
-- ============================================================
INSERT IGNORE INTO users (id, username, password, email, full_name, phone, role_id, status) VALUES
-- Super Admin (Keep this so you can log in to test manually)
(1, 'superadmin', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'superadmin@wholesale.com', 'Aravind Kumar', '9876543210', 1, 'ACTIVE'),
-- Sample Retailer
(2, 'retailer1', '$2a$10$CvEdyW4HnGVFVA/Sd54SfOa066u5FhD5tbqWfMWNsfbLPGTgUXPxi', 'retailer1@shop.com', 'Ravi Retail', '9876543219', 4, 'ACTIVE');

-- ============================================================
-- RETAILERS
-- ============================================================
INSERT IGNORE INTO retailers (id, user_id, business_name, gst_number, address, city, state, pincode, approval_status, approved_by) VALUES
(1, 2, 'Ravi General Store', '36AABCU9603R1ZM', 'Shop 12, Market Road', 'Hyderabad', 'Telangana', '500001', 'APPROVED', 1);
