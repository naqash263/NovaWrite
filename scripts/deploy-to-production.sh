#!/bin/bash

# Complete Production Deployment Script
# This script does a clean deployment to production

echo "🚀 NovaWrite Production Deployment - Complete Setup"
echo "==================================================="
echo ""

# Configuration
DEPLOY_DIR="/home/timesovh/naqashthaheem.com"
API_DIR="$DEPLOY_DIR/public_html/api"
BACKEND_DIR="$DEPLOY_DIR/backend"

# Step 1: Pull latest code
echo "📥 Pulling latest code..."
cd $DEPLOY_DIR
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed"
    exit 1
fi

echo "✅ Code updated"

# Step 2: Backup current API directory
echo "💾 Creating backup..."
if [ -d "$API_DIR" ]; then
    BACKUP_DIR="$DEPLOY_DIR/backups/api-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$DEPLOY_DIR/backups"
    cp -r "$API_DIR" "$BACKUP_DIR"
    echo "✅ Backup created: $BACKUP_DIR"
fi

# Step 3: Deploy backend to API directory
echo "📦 Deploying backend files..."

# Save the .env file
if [ -f "$API_DIR/.env" ]; then
    cp "$API_DIR/.env" "/tmp/novawrite.env.backup"
    echo "✅ .env file backed up"
fi

# Remove old API directory (except .env)
rm -rf "$API_DIR"/*

# Copy all backend files
cp -r "$BACKEND_DIR"/* "$API_DIR/"

# Restore .env file
if [ -f "/tmp/novawrite.env.backup" ]; then
    cp "/tmp/novawrite.env.backup" "$API_DIR/.env"
    rm "/tmp/novawrite.env.backup"
    echo "✅ .env file restored"
fi

echo "✅ Files deployed"

# Step 4: Install dependencies
echo "📦 Installing PHP dependencies..."
cd "$API_DIR"
composer install --no-dev --optimize-autoloader

# Step 5: Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

if [ $? -ne 0 ]; then
    echo "⚠️  Migration failed, continuing..."
fi

# Step 6: Clear and cache everything
echo "🔄 Optimizing application..."
php artisan optimize:clear
php artisan optimize

# Step 7: Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test the application: https://naqashthaheem.com"
echo "2. Login to admin panel: https://naqashthaheem.com/admin"
echo "3. Verify all functionality"
echo ""
echo "💾 Backup location: $BACKUP_DIR"
echo ""
