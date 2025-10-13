#!/bin/bash

# Production Database Migration Script
# This script runs the necessary migrations on production

echo "🚀 Starting Production Database Migration"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: Please run this script from the Laravel application root directory"
    echo "   (where artisan file is located)"
    exit 1
fi

echo "✅ Found Laravel application"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Please ensure your production .env file is configured"
    exit 1
fi

echo "✅ Found .env file"

# Run migrations
echo "🔄 Running database migrations..."
php artisan migrate --force

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

# Clear and cache configurations
echo "🔄 Clearing and caching configurations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

if [ $? -eq 0 ]; then
    echo "✅ Configuration caching completed"
else
    echo "⚠️  Configuration caching had issues, but migrations were successful"
fi

# Test database connection
echo "🔄 Testing database connection..."
php artisan tinker --execute="echo 'Database test: '; try { \App\Models\User::count(); echo 'SUCCESS - Database is working'; } catch (Exception \$e) { echo 'ERROR: ' . \$e->getMessage(); }"

echo ""
echo "🎉 Migration process completed!"
echo ""
echo "Next steps:"
echo "1. Test the API endpoints"
echo "2. Check the admin panel"
echo "3. Verify all functionality"
echo ""
echo "Test URLs:"
echo "- Health: https://naqashthaheem.com/api/health"
echo "- Database Status: https://naqashthaheem.com/api/debug/database"
echo "- Gemini API Keys: https://naqashthaheem.com/api/admin/gemini-api-keys"
