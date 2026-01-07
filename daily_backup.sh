#!/bin/bash

# DAILY AUTOMATED DATABASE BACKUP SCRIPT
# Runs inside the LXC container: sms
# Database: school
# Retention: 30 days

set -euo pipefail

# Configuration
DB_USER="school"
DB_PASSWORD="YourName123!"
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="school"
BACKUP_DIR="/root/db_backups"
LOG_FILE="/root/backup.log"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start backup
log "=== Starting daily backup ==="
log "Database: $DB_NAME"
log "Backup directory: $BACKUP_DIR"

# Create daily backup filename
BACKUP_FILE="$BACKUP_DIR/school_backup_${DATE_ONLY}.sql"
COMPRESSED_BACKUP="$BACKUP_FILE.gz"

# Check if today's backup already exists (in case script runs twice)
if [ -f "$COMPRESSED_BACKUP" ]; then
    log "Today's backup already exists: $COMPRESSED_BACKUP"
    log "Skipping backup (already done today)"
    exit 0
fi

# Create full database backup
log "Creating database backup..."
# Suppress warnings about password on command line and config file issues
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --quick \
    --lock-tables=false \
    --no-tablespaces \
    "$DB_NAME" > "$BACKUP_FILE" 2>>"$LOG_FILE"

# Check if backup was successful
if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
    
    # Compress the backup
    log "Compressing backup..."
    gzip -f "$BACKUP_FILE"
    
    if [ -f "$COMPRESSED_BACKUP" ]; then
        COMPRESSED_SIZE=$(du -h "$COMPRESSED_BACKUP" | cut -f1)
        log "Backup compressed: $COMPRESSED_BACKUP ($COMPRESSED_SIZE)"
    else
        log "WARNING: Compression failed, keeping uncompressed backup"
    fi
    
    # Clean up old backups (keep only last RETENTION_DAYS days)
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "school_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "school_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
    if [ "$DELETED_COUNT" -gt 0 ]; then
        log "Deleted $DELETED_COUNT old backup(s)"
    fi
    
    # Show current backup status
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "school_backup_*.sql.gz" -type f | wc -l)
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    log "Current backups: $BACKUP_COUNT files, total size: $TOTAL_SIZE"
    
    log "=== Backup completed successfully ==="
    exit 0
else
    log "ERROR: Backup failed!"
    log "Check MySQL connection and permissions"
    
    # Clean up failed backup file
    [ -f "$BACKUP_FILE" ] && rm -f "$BACKUP_FILE"
    
    log "=== Backup failed ==="
    exit 1
fi


