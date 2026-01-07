#!/bin/bash

# URGENT DATA RECOVERY - You lost data after running SQL
# Database: school - User: school - Password: YourName123!

echo "!!! URGENT DATA RECOVERY !!!"
echo "Checking for any possible backups..."
echo "Timestamp: $(date)"

DB_USER="school"
DB_PASS="YourName123!"
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="school"

echo "1. Checking for any existing backup files..."
echo "Looking in /root/:"
ls -la /root/*.sql 2>/dev/null || echo "No .sql files in /root/"

echo ""
echo "Looking in /var/lib/mysql/:"
ls -la /var/lib/mysql/*.sql 2>/dev/null || echo "No .sql files in /var/lib/mysql/"

echo ""
echo "Looking in /tmp/:"
ls -la /tmp/*.sql 2>/dev/null || echo "No .sql files in /tmp/"

echo ""
echo "2. Checking MySQL binary logs (might contain recent changes)..."
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT -e "SHOW BINARY LOGS;" 2>/dev/null || echo "No binary logs found"

echo ""
echo "3. Checking if there's any data left in tables..."
echo "Checking users table:"
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT -e "USE $DB_NAME; SELECT COUNT(*) as count FROM users;" 2>/dev/null || echo "Table users empty or doesn't exist"

echo "Checking staff table:"
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT -e "USE $DB_NAME; SELECT COUNT(*) as count FROM staff;" 2>/dev/null || echo "Table staff empty or doesn't exist"

echo ""
echo "4. Checking all tables in database:"
mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null || echo "Cannot access database"

echo ""
echo "5. Looking for any .sql files anywhere on system..."
find / -name "*.sql" -type f 2>/dev/null | head -20

echo ""
echo "=== RECOVERY OPTIONS ==="
echo ""
echo "IF YOU HAVE BACKUPS:"
echo "1. Look for files like: students.sql (I saw this in earlier output)"
echo "2. Check any backup files with today's date"
echo ""
echo "TO RESTORE FROM BACKUP:"
echo "mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT $DB_NAME < /path/to/backup.sql"
echo ""
echo "IF NO BACKUPS FOUND:"
echo "1. Check if your hosting provider has backups"
echo "2. Check if MySQL binary logs can be used for point-in-time recovery"
echo "3. Contact your database administrator immediately"
echo ""
echo "!!! ACT FAST - The longer you wait, the harder recovery becomes !!!"
