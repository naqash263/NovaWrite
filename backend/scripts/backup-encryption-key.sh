#!/bin/bash

# Backup Encryption Key Script
# This script should be run before any deployment to backup the current encryption key

echo "🔐 Backing up encryption key..."

# Get the current APP_KEY from .env
APP_KEY=$(grep "^APP_KEY=" .env | cut -d '=' -f2)

if [ -z "$APP_KEY" ]; then
    echo "❌ APP_KEY not found in .env file"
    exit 1
fi

echo "📋 Current APP_KEY: $APP_KEY"

# Run the Laravel command to backup the key
php artisan encryption:manage backup --force

if [ $? -eq 0 ]; then
    echo "✅ Encryption key backed up successfully"
else
    echo "❌ Failed to backup encryption key"
    exit 1
fi

echo "🚀 Ready for deployment!"