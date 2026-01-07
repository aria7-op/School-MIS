#!/bin/bash

# EXPORT ALL DATA FROM SERVER
# Server: root@31.97.70.79 - Container: sms

echo "=== EXPORTING ALL DATA ==="
echo "Timestamp: $(date)"

SERVER="root@31.97.70.79"
CONTAINER="sms"
DB_USER="root"
DB_NAME="schools"

echo "Connecting to server and exporting all data..."

# Create timestamp for backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

ssh $SERVER "lxc exec $CONTAINER -- mysqldump -u $DB_USER -p --single-transaction --routines --triggers --all-databases > /root/complete_backup_$TIMESTAMP.sql"

echo "Backup created: complete_backup_$TIMESTAMP.sql"

# Also export just the schools database
ssh $SERVER "lxc exec $CONTAINER -- mysqldump -u $DB_USER -p --single-transaction --routines --triggers $DB_NAME > /root/schools_backup_$TIMESTAMP.sql"

echo "Schools backup created: schools_backup_$TIMESTAMP.sql"

# List the backups
echo "Available backups on server:"
ssh $SERVER "ls -la /root/*backup*$TIMESTAMP.sql"

echo ""
echo "=== EXPORT COMPLETED ==="
echo "Files are on your server at:"
echo "- /root/complete_backup_$TIMESTAMP.sql"
echo "- /root/schools_backup_$TIMESTAMP.sql"
echo ""
echo "To download them:"
echo "scp root@31.97.70.79:/root/complete_backup_$TIMESTAMP.sql ."
echo "scp root@31.97.70.79:/root/schools_backup_$TIMESTAMP.sql ."
