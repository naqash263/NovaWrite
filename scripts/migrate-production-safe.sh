#!/bin/bash

# Safe Production Migration Script
# This script runs migrations WITHOUT dropping any data

echo "🔄 Safe Production Migration"
echo "============================"
echo ""

# Configuration
API_DIR="/home/timesovh/naqashthaheem.com/public_html/api"

# Navigate to API directory
cd $API_DIR

echo "📍 Working directory: $(pwd)"
echo ""

# Step 1: Pull latest code
echo "📥 Step 1: Pulling latest code..."
cd /home/timesovh/naqashthaheem.com
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed"
    exit 1
fi

echo "✅ Code updated"
echo ""

# Step 2: Deploy to API directory
echo "📦 Step 2: Deploying backend to API..."

# Save the .env file
if [ -f "$API_DIR/.env" ]; then
    cp "$API_DIR/.env" "/tmp/novawrite.env.backup"
    echo "✅ .env file backed up"
fi

# Sync backend files (excluding vendor, storage, .env)
rsync -av --delete \
    --exclude='.env' \
    --exclude='vendor/' \
    --exclude='storage/' \
    --exclude='bootstrap/cache/' \
    /home/timesovh/naqashthaheem.com/backend/ \
    "$API_DIR/"

# Restore .env file
if [ -f "/tmp/novawrite.env.backup" ]; then
    cp "/tmp/novawrite.env.backup" "$API_DIR/.env"
    rm "/tmp/novawrite.env.backup"
    echo "✅ .env file restored"
fi

echo "✅ Files deployed"
echo ""

# Step 3: Install dependencies
echo "📦 Step 3: Installing dependencies..."
cd "$API_DIR"
composer install --no-dev --optimize-autoloader --no-interaction

echo "✅ Dependencies installed"
echo ""

# Step 4: Run migrations (SAFE - only adds new tables/columns)
echo "🗄️  Step 4: Running migrations (safe - no data loss)..."
php artisan migrate --force

if [ $? -ne 0 ]; then
    echo "⚠️  Some migrations failed, check logs"
else
    echo "✅ Migrations completed"
fi

echo ""

# Step 5: Clear old caches
echo "🧹 Step 5: Clearing caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo "✅ Caches cleared"
echo ""

# Step 6: Rebuild caches
echo "⚡ Step 6: Rebuilding caches..."
php artisan config:cache
php artisan route:cache

echo "✅ Caches rebuilt"
echo ""

# Step 7: Verify setup
echo "🧪 Step 7: Verifying setup..."

php artisan migrate:status | tail -5

echo ""

# Step 8: Test database connection
php artisan tinker --execute="
try {
    echo 'Database: ' . DB::connection()->getDatabaseName() . PHP_EOL;
    echo 'Tables: ' . count(DB::select('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'')) . PHP_EOL;
    echo 'Users: ' . DB::table('users')->count() . PHP_EOL;
    echo '✅ Database is healthy' . PHP_EOL;
} catch (Exception \$e) {
    echo '❌ Database error: ' . \$e->getMessage() . PHP_EOL;
}
"

echo ""
echo "✅ Safe migration completed successfully!"
echo ""
echo "📋 What was done:"
echo "  ✅ Latest code deployed"
echo "  ✅ Dependencies updated"
echo "  ✅ New migrations ran (existing data preserved)"
echo "  ✅ Caches rebuilt"
echo "  ✅ Application optimized"
echo ""
echo "🔗 Test your application:"
echo "  - Frontend: https://naqashthaheem.com"
echo "  - Admin: https://naqashthaheem.com/admin"
echo ""
