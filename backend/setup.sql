-- Full System MySQL Schema for Wattipid

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'tenant',
    room_id VARCHAR(50) DEFAULT NULL,
    tenant_code VARCHAR(100) DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(50) UNIQUE NOT NULL,
    tenant_code VARCHAR(100) DEFAULT NULL,
    tenant_name VARCHAR(255) DEFAULT NULL,
    tenant_start_date DATE DEFAULT NULL,
    move_out_date DATE DEFAULT NULL,
    status ENUM('vacant', 'on_process', 'occupied') DEFAULT 'vacant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consumption_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    voltage DECIMAL(10, 2) DEFAULT 0,
    current_val DECIMAL(10, 3) DEFAULT 0,
    power DECIMAL(10, 2) DEFAULT 0,
    energy DECIMAL(10, 4) DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    monthly_budget DECIMAL(10, 2) NOT NULL,
    daily_allowance DECIMAL(10, 2) DEFAULT 0,
    weekly_allowance DECIMAL(10, 2) DEFAULT 0,
    month INT NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY room_month_year (room_id, month, year)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(50) DEFAULT NULL,
    user_id INT DEFAULT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    room_id VARCHAR(50) NOT NULL,
    tenant_code VARCHAR(100) NOT NULL,
    used TINYINT(1) DEFAULT 0,
    status ENUM('active', 'expired', 'used') DEFAULT 'active',
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    tenant_name VARCHAR(255) DEFAULT NULL,
    tenant_email VARCHAR(255) DEFAULT NULL,
    tenant_start_date DATE DEFAULT NULL,
    move_out_date DATE DEFAULT NULL,
    status ENUM('active', 'moved_out', 'transferred') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('rate_per_kwh', '12.50');

-- Demo Rooms
INSERT IGNORE INTO rooms (room_id, tenant_code, status, tenant_name) VALUES 
('Room 1', 'TC-1001', 'occupied', 'Demo Tenant'),
('Room 2', 'TC-1002', 'vacant', NULL),
('Room 3', 'TC-1003', 'vacant', NULL),
('Room 4', 'TC-1004', 'vacant', NULL),
('Room 5', 'TC-1005', 'vacant', NULL),
('Room 6', 'TC-1006', 'vacant', NULL),
('Room 7', 'TC-1007', 'vacant', NULL),
('Room 8', 'TC-1008', 'vacant', NULL);
