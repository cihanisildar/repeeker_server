#!/bin/bash

# Database restore script for Repeeker
set -e

# Configuration
DB_HOST="postgres"
DB_NAME="${POSTGRES_DB:-repeeker_db}"
DB_USER="${POSTGRES_USER:-repeeker_user}"
BACKUP_DIR="/backups"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la "${BACKUP_DIR}"/repeeker_backup_*
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' not found"
    exit 1
fi

echo "Starting database restore from: ${BACKUP_FILE}"

# Determine backup type and restore accordingly
if [[ "${BACKUP_FILE}" == *.custom ]]; then
    echo "Restoring from custom format backup..."
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
        -h "${DB_HOST}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --verbose \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        "${BACKUP_FILE}"
elif [[ "${BACKUP_FILE}" == *.sql.gz ]]; then
    echo "Restoring from compressed SQL backup..."
    gunzip -c "${BACKUP_FILE}" | \
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${DB_HOST}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --verbose
elif [[ "${BACKUP_FILE}" == *.sql ]]; then
    echo "Restoring from SQL backup..."
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${DB_HOST}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --verbose \
        -f "${BACKUP_FILE}"
else
    echo "Error: Unsupported backup file format"
    exit 1
fi

echo "Database restore completed successfully!" 