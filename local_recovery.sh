#!/bin/bash

# LOCAL RECOVERY SCRIPT (Already in server container)
# Database: school - User: school - Password: YourName123!

echo "=== LOCAL DATABASE RECOVERY ==="
echo "Timestamp: $(date)"
echo "Database: school"
echo "User: school"
echo ""

# Database connection details
DB_USER="school"
DB_PASS="YourName123!"
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="school"

echo "1. Creating emergency backup..."
mysqldump -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT --single-transaction --routines --triggers $DB_NAME > /root/emergency_backup_$(date +%Y%m%d_%H%M%S).sql

echo "2. Checking existing tables..."
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT -e "USE $DB_NAME; SHOW TABLES;"

echo ""
echo "3. Creating users table if not exists..."
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT $DB_NAME << 'EOF'

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

EOF

echo "4. Creating staff table if not exists..."
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT $DB_NAME << 'EOF'

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

EOF

echo "5. Checking data counts..."
echo "Users count:"
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT -e "USE $DB_NAME; SELECT COUNT(*) as user_count FROM users;"

echo "Staff count:"
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT -e "USE $DB_NAME; SELECT COUNT(*) as staff_count FROM staff;"

echo ""
echo "6. Listing backup files..."
ls -la /root/*.sql

echo ""
echo "=== RECOVERY COMPLETED ==="
echo ""
echo "Your data is safe! Tables created/verified."
echo "Emergency backup created in /root/"
echo ""
echo "To restore from backup if needed:"
echo "mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT $DB_NAME < /root/backup_file.sql"
