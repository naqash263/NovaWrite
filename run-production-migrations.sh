#!/bin/bash

# Run Production Migrations
echo "🚀 Running Production Migrations..."

# SSH into production server and run migrations
ssh timesovh@naqashthaheem.com << 'EOF'
cd ~/naqashthaheem.com/backend

echo "📋 Current migration status:"
php artisan migrate:status

echo "🔄 Running pending migrations..."
php artisan migrate --force

echo "🧹 Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

echo "🔄 Rebuilding configuration cache..."
php artisan config:cache

echo "📋 Verifying health routes are available:"
php artisan route:list --path=api/health

echo "✅ Production migrations and cache clearing completed!"
EOF

echo "🎉 Production migrations completed successfully!"