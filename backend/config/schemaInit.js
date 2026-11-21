/**
 * Automatic Schema Initializer for external MySQL / TiDB Cloud
 */
async function initializeRemoteDatabase(pool) {
  try {
    console.log('[Database] Checking remote schema tables...');

    // 1. Roles Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT
      );
    `);

    // 2. Departments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        department_id INT AUTO_INCREMENT PRIMARY KEY,
        department_name VARCHAR(100) NOT NULL UNIQUE,
        location VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        role_id INT NOT NULL,
        department_id INT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        reset_token VARCHAR(255),
        reset_expires TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 4. Resources Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        resource_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        available_quantity INT DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'units',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id INT,
        quantity INT NOT NULL DEFAULT 1,
        purpose TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'modification_requested') DEFAULT 'pending',
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 6. Approvals Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approvals (
        approval_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        approver_id INT NOT NULL,
        decision ENUM('approved', 'rejected', 'modification_requested') NOT NULL,
        remarks TEXT,
        decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Notifications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        request_id INT,
        type VARCHAR(50) DEFAULT 'system',
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Audit Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45)
      );
    `);

    // 9. System Settings Table (for Mailtrap / SMTP and App Configurations)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Ensure backwards and forwards compatibility columns exist
    try {
      await pool.query(`
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      await pool.query(`
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      await pool.query(`
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      await pool.query(`
        ALTER TABLE approvals ADD COLUMN IF NOT EXISTS decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      await pool.query(`
        ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
    } catch (e) {
      // Column may already exist
    }

    // Seed Roles if empty
    const [roles] = await pool.query('SELECT COUNT(*) AS count FROM roles');
    if (roles[0].count === 0) {
      console.log('[Database] Seeding default roles...');
      await pool.query(`
        INSERT INTO roles (role_id, role_name, description) VALUES
        (1, 'Administrator', 'Full system management and configuration'),
        (2, 'Manager', 'Approvals review and requisition decision-making'),
        (3, 'Staff', 'Resource request submission and tracking');
      `);
    }

    // Seed Departments if empty
    const [depts] = await pool.query('SELECT COUNT(*) AS count FROM departments');
    if (depts[0].count === 0) {
      console.log('[Database] Seeding default departments...');
      await pool.query(`
        INSERT INTO departments (department_id, department_name, location, description) VALUES
        (1, 'Operations', 'Ground Floor', 'General operations and logistics'),
        (2, 'Finance', '1st Floor', 'Budgeting and financial control'),
        (3, 'IT', '2nd Floor', 'Technology and infrastructure support');
      `);
    }

    // Seed Default Users if empty
    const [users] = await pool.query('SELECT COUNT(*) AS count FROM users');
    if (users[0].count === 0) {
      console.log('[Database] Seeding default users (admin, manager, staff)...');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password123', 10);
      await pool.query(`
        INSERT INTO users (username, password_hash, email, full_name, role_id, department_id, status) VALUES
        ('admin', ?, 'admin@miva.edu.ng', 'System Administrator', 1, 3, 'active'),
        ('manager', ?, 'manager@miva.edu.ng', 'Marcus Vance (Manager)', 2, 2, 'active'),
        ('staff', ?, 'staff@miva.edu.ng', 'Sarah Jenkins (Staff)', 3, 1, 'active');
      `, [hash, hash, hash]);
    }

    // Seed Resources if empty
    const [resources] = await pool.query('SELECT COUNT(*) AS count FROM resources');
    if (resources[0].count === 0) {
      console.log('[Database] Seeding default resources...');
      await pool.query(`
        INSERT INTO resources (name, category, description, available_quantity, unit) VALUES
        ('Dell UltraSharp 27" Monitor', 'Hardware', '4K USB-C Hub Monitor for workstations', 18, 'units'),
        ('Ergonomic Mesh Chair', 'Furniture', 'High-back lumbar support office chair', 25, 'units'),
        ('MacBook Pro 14" M3', 'Hardware', '16GB Unified Memory, 512GB SSD', 10, 'units'),
        ('Conference Room Projector', 'AV Equipment', '4000 Lumens Full HD wireless projector', 4, 'units');
      `);
    }

    // Seed Audit Logs if empty
    const [auditCount] = await pool.query('SELECT COUNT(*) AS count FROM audit_logs');
    if (auditCount[0].count === 0) {
      console.log('[Database] Seeding initial audit trail in TiDB Cloud...');
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, details) VALUES
        (1, 'SYSTEM_BOOT', 'System initialized with default seed records'),
        (1, 'DATABASE_CONNECT', 'Connected to online TiDB Cloud relational store'),
        (3, 'SUBMIT_REQUEST', 'Requested 2 x Dell UltraSharp 27 Monitor');
      `);
    }

    console.log('[Database] Remote schema verified and ready.');
    return true;
  } catch (err) {
    console.warn('[Database] Remote schema initialization error:', err.message);
    return false;
  }
}

module.exports = {
  initializeRemoteDatabase
};
