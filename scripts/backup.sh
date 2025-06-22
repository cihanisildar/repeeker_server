#!/bin/bash

# Database backup script for Repeeker
set -e

# Configuration
DB_HOST="postgres"
DB_NAME="${POSTGRES_DB:-repeeker_db}"
DB_USER="${POSTGRES_USER:-repeeker_user}"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/repeeker_backup_${DATE}.sql"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup..."

# Create backup
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --format=custom \
  --file="${BACKUP_FILE}.custom"

# Also create a plain SQL backup
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  > "${BACKUP_FILE}"

# Compress the SQL backup
gzip "${BACKUP_FILE}"

echo "Backup completed: ${BACKUP_FILE}.gz"

# Clean up old backups (keep only last 7 days)
find "${BACKUP_DIR}" -name "repeeker_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "repeeker_backup_*.custom" -mtime +${RETENTION_DAYS} -delete

echo "Old backups cleaned up (retention: ${RETENTION_DAYS} days)"

# List current backups
echo "Current backups:"
ls -la "${BACKUP_DIR}"/repeeker_backup_* 