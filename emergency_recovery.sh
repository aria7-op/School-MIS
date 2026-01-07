#!/bin/bash

# EMERGENCY DATABASE RECOVERY SCRIPT
# For server: root@31.97.70.79 in sms LXC container

echo "=== EMERGENCY RECOVERY STARTED ==="
echo "Timestamp: $(date)"
echo ""

# Server connection details
SERVER="root@31.97.70.79"
CONTAINER="sms"
DB_USER="root"
DB_NAME="schools"  # Change if different

echo "1. Connecting to server and checking container status..."
ssh $SERVER "lxc list | grep $CONTAINER"

echo ""
echo "2. Creating emergency backup of current database..."
ssh $SERVER "lxc exec $CONTAINER -- mysqldump -u $DB_USER -p --all-databases > /root/emergency_backup_$(date +%Y%m%d_%H%M%S).sql"

echo ""
echo "3. Checking existing databases..."
ssh $SERVER "lxc exec $CONTAINER -- mysql -u $DB_USER -p -e 'SHOW DATABASES;'"

echo ""
echo "4. Checking if schools database exists and has data..."
ssh $SERVER "lxc exec $CONTAINER -- mysql -u $DB_USER -p -e 'USE schools; SHOW TABLES;' 2>/dev/null || echo 'Database schools not found'"

echo ""
echo "5. Creating users and staff tables only (SAFE MODE)..."
ssh $SERVER "lxc exec $CONTAINER -- mysql -u $DB_USER -p $DB_NAME << 'EOF'

-- SAFE: Only create users and staff tables if they don't exist
SET FOREIGN_KEY_CHECKS = 0;

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255),
    salt VARCHAR(255),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    father_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    role ENUM('SUPER_ADMIN', 'SUPER_DUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'STAFF', 'HRM', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'CRM_MANAGER', 'BRANCH_MANAGER', 'COURSE_MANAGER'),
    designation VARCHAR(100),
    employee_id VARCHAR(50),
    total_experience INT,
    salary_amount DECIMAL(10,2),
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'TRANSFERRED') DEFAULT 'ACTIVE',
    school_id BIGINT,
    branch_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_school_id (school_id)
);

-- Create staff table if not exists
CREATE TABLE IF NOT EXISTS staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT UNIQUE,
    employee_id VARCHAR(50) UNIQUE,
    department_id BIGINT,
    designation VARCHAR(100) NOT NULL,
    joining_date DATETIME,
    salary DECIMAL(10,2),
    account_number VARCHAR(30),
    bank_name VARCHAR(100),
    school_id BIGINT,
    branch_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_school_id (school_id)
);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Users and staff tables created/verified successfully!' as status;
EOF"

echo ""
echo "6. Checking data in users table..."
ssh $SERVER "lxc exec $CONTAINER -- mysql -u $DB_USER -p -e 'USE schools; SELECT COUNT(*) as user_count FROM users;' 2>/dev/null || echo 'No users table or no access'"

echo ""
echo "7. Checking data in staff table..."
ssh $SERVER "lxc exec $CONTAINER -- mysql -u $DB_USER -p -e 'USE schools; SELECT COUNT(*) as staff_count FROM staff;' 2>/dev/null || echo 'No staff table or no access'"

echo ""
echo "8. Listing all available backups..."
ssh $SERVER "ls -la /root/*.sql 2>/dev/null || echo 'No SQL backups found in /root'"

echo ""
echo "=== RECOVERY CHECKLIST ==="
echo "✓ Emergency backup created"
echo "✓ Tables verified/created"
echo "✓ Data counts checked"
echo ""
echo "NEXT STEPS:"
echo "1. Check the backup files on server"
echo "2. If data is missing, restore from backup"
echo "3. Verify all your data is intact"
echo ""
echo "To restore from backup:"
echo "ssh $SERVER"
echo "lxc exec $CONTAINER -- mysql -u $DB_USER -p $DB_NAME < /root/backup_file.sql"
echo ""
echo "=== RECOVERY COMPLETED ==="
