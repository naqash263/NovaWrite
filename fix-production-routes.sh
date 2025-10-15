#!/bin/bash

# Fix Production Route Cache Issues
# This script clears Laravel caches and rebuilds them on the production server

echo "🔧 Fixing Production Route Cache Issues..."

# SSH into production server and run Laravel commands
ssh timesovh@naqashthaheem.com << 'EOF'
cd ~/naqashthaheem.com/backend

echo "📋 Current route cache status:"
ls -la bootstrap/cache/route* 2>/dev/null || echo "No route cache found"

echo "🧹 Clearing Laravel caches..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

echo "🔄 Rebuilding configuration cache..."
php artisan config:cache

echo "📋 Verifying health routes are available:"
php artisan route:list --path=api/health

echo "✅ Cache clearing completed!"
EOF

echo "🎉 Production route cache has been cleared and rebuilt!"
