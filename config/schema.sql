-- ============================================
-- QueueLess — Database Schema
-- Queue Management System
-- ============================================

CREATE DATABASE IF NOT EXISTS queueless;
USE queueless;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'staff', 'admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Services Table
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    prefix VARCHAR(5) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tokens (Queue Entries) Table
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    served_by INT DEFAULT NULL,
    status ENUM('waiting', 'called', 'serving', 'served', 'skipped') DEFAULT 'waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    called_at DATETIME DEFAULT NULL,
    served_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (served_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_service_id ON tokens(service_id);
CREATE INDEX idx_tokens_created_at ON tokens(created_at);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);

-- ============================================
-- Seed Data: Default Admin Account
-- Password: admin123 (bcrypt hashed)
-- ============================================
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@queueless.com', '$2a$10$6zL9o2mGZ.7zjl8Da395a.vXs.O8eqwlkDgkPHFnZ6UoI2XYmiaum', 'admin');

-- ============================================
-- Seed Data: Sample Services
-- ============================================
INSERT INTO services (name, prefix, description, is_active) VALUES
('General Consultation', 'GC', 'General medical consultation and check-up services', TRUE),
('Account Opening', 'AO', 'Open new bank accounts — savings, current, or fixed deposit', TRUE),
('Billing & Payments', 'BP', 'Bill payments, fee submissions, and financial transactions', TRUE),
('Customer Support', 'CS', 'General enquiries, complaints, and support requests', TRUE),
('Document Verification', 'DV', 'Verification of documents, certificates, and ID proofs', TRUE);
