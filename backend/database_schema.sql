-- =============================================
-- EBONY & IVORY STUDIO - DATABASE SCHEMA
-- Generated for MySQL Migration
-- (Note: Run this inside your pre-created DB)
-- =============================================

-- 👤 1. CLIENTS TABLE
-- Stores basic contact and branding details for customers
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 👥 2. TEAM MEMBERS TABLE
-- Profiles for photographers, editors, and album artists
CREATE TABLE team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- Photographer, Cinematographer, Editor, etc.
    phone VARCHAR(20),
    email VARCHAR(255),
    image_url TEXT,
    daily_rate DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📁 3. PROJECTS TABLE
-- Tracks logistics, pipeline stages, and financial data for each event
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    event_date DATE,
    status ENUM('Upcoming', 'Shooting', 'Editing', 'Delivered') DEFAULT 'Upcoming',
    days_of_program INT DEFAULT 1,
    team_price DECIMAL(10, 2) DEFAULT 0.00,
    data_from_team ENUM('Pending', 'Received') DEFAULT 'Pending',
    
    -- Editing Workflow
    editor_id INT, 
    editor_price DECIMAL(10, 2) DEFAULT 0.00,
    data_to_editor ENUM('Pending', 'Sent') DEFAULT 'Pending',
    
    -- Album Workflow
    album_artist_id INT,
    album_price DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Progress & Logistics
    work_completion INT DEFAULT 0, -- 0-100 percentage
    venue VARCHAR(255),
    start_time TIME DEFAULT '09:30:00',
    budget DECIMAL(12, 2) DEFAULT 0.00,
    deadline DATE,
    shoot_custom_dates VARCHAR(255), -- For multi-day tracking text
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (editor_id) REFERENCES team_members(id) ON DELETE SET NULL,
    FOREIGN KEY (album_artist_id) REFERENCES team_members(id) ON DELETE SET NULL
);

-- 🛠️ 4. PROJECT SERVICES (Deliverables)
-- Multi-select mapping for Cinematic/Traditional/Reel services
CREATE TABLE project_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    service_name VARCHAR(100) NOT NULL, -- e.g., 'Cinematic Photo', 'Reel'
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 🔗 5. PROJECT ASSIGNMENTS
-- Links crew members to specific project events
CREATE TABLE project_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    member_id INT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE
);

-- 🧾 6. INVOICES TABLE
-- Core financial records linked to clients
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    invoice_date DATE,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) DEFAULT 0.00,
    status ENUM('Paid', 'Partial', 'Unpaid') DEFAULT 'Unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 📦 7. INVOICE ITEMS
-- Detailed line items for each invoice
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    description TEXT NOT NULL,
    rate DECIMAL(12, 2) NOT NULL,
    qty INT DEFAULT 1,
    amount DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 📝 8. STUDIO NOTES
-- For internal administrative notes and reminders
CREATE TABLE studio_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100), -- Wedding, Client Info, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📑 9. USERS TABLE
-- Administrative accounts for dashboard access
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Manager', 'Editor') DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
