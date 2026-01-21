#!/bin/bash

# SETUP DAILY AUTOMATED BACKUP FOR MYSQL DATABASE
# This script sets up a cron job to run daily backups

echo "=== Setting up daily MySQL backup ==="

# Server details
SERVER="root@31.97.70.79"
CONTAINER="sms"
BACKUP_SCRIPT="/root/daily_backup.sh"

# Copy backup script to server
echo "1. Copying backup script to server..."
scp daily_backup.sh $SERVER:/var/snap/lxd/common/lxd/containers/$CONTAINER/rootfs/root/daily_backup.sh

# Make script executable and set up cron job
echo "2. Setting up cron job on server..."
ssh $SERVER "lxc exec $CONTAINER -- bash -c '
    chmod +x /root/daily_backup.sh
    
    # Create backup directory
    mkdir -p /root/db_backups
    
    # Add cron job if it doesn't exist (runs daily at 2 AM)
    (crontab -l 2>/dev/null | grep -v daily_backup.sh; echo \"0 2 * * * /root/daily_backup.sh >> /root/backup.log 2>&1\") | crontab -
    
    echo \"Cron job installed successfully\"
    echo \"Backup will run daily at 2:00 AM\"
    echo \"Backups will be stored in: /root/db_backups/\"
    echo \"Logs will be in: /root/backup.log\"
    echo \"\"
    echo \"Current cron jobs:\"
    crontab -l
'"

echo ""
echo "=== Setup completed ==="
echo "Backup will run automatically every day at 2:00 AM"
echo "To view backups: ssh $SERVER \"lxc exec $CONTAINER -- ls -lh /root/db_backups/\""
echo "To view logs: ssh $SERVER \"lxc exec $CONTAINER -- tail -f /root/backup.log\""






