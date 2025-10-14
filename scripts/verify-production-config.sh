#!/bin/bash

# Production Configuration Verification Script
# Run this ON THE PRODUCTION SERVER to verify deployment

echo "════════════════════════════════════════════════════"
echo "  PRODUCTION CONFIGURATION VERIFICATION"
echo "════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/artisan" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Usage: ./scripts/verify-production-config.sh"
    exit 1
fi

cd backend

echo "1️⃣  Checking .env file..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check APP_URL in .env file
if grep -q "^APP_URL=" .env; then
    APP_URL_ENV=$(grep "^APP_URL=" .env | cut -d'=' -f2)
    echo "APP_URL in .env: $APP_URL_ENV"
    
    if [[ $APP_URL_ENV == *"localhost"* ]]; then
        echo "❌ PROBLEM: APP_URL still contains 'localhost'"
        echo "   Current: $APP_URL_ENV"
        echo "   Should be: https://naqashthaheem.com"
        echo ""
        echo "   FIX: Update backend/.env file:"
        echo "   APP_URL=https://naqashthaheem.com"
    else
        echo "✅ APP_URL is set correctly for production"
    fi
else
    echo "❌ APP_URL not found in .env file!"
fi

echo ""
echo "2️⃣  Checking cached configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if config is cached
if [ -f "bootstrap/cache/config.php" ]; then
    echo "⚠️  Configuration is CACHED"
    echo "   This means Laravel is using cached config, not .env!"
    echo ""
    
    # Check what URL is in the cache
    CACHED_URL=$(php -r "require 'bootstrap/cache/config.php'; echo \$config['app']['url'] ?? 'NOT_FOUND';")
    echo "   Cached APP_URL: $CACHED_URL"
    
    if [[ $CACHED_URL == *"localhost"* ]]; then
        echo "   ❌ CACHED config still has localhost!"
        echo ""
        echo "   FIX REQUIRED:"
        echo "   1. Update .env: APP_URL=https://naqashthaheem.com"
        echo "   2. Clear cache: php artisan config:clear"
        echo "   3. Rebuild cache: php artisan config:cache"
    else
        echo "   ✅ Cached config is correct"
    fi
else
    echo "✅ Configuration is NOT cached (reading from .env directly)"
fi

echo ""
echo "3️⃣  Checking runtime configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check actual runtime config
RUNTIME_URL=$(php artisan tinker --execute="echo config('app.url');" 2>/dev/null)
echo "Runtime APP_URL: $RUNTIME_URL"

if [[ $RUNTIME_URL == *"localhost"* ]]; then
    echo "❌ PROBLEM: Runtime config uses localhost"
    echo ""
    echo "   IMMEDIATE FIX:"
    echo "   php artisan config:clear"
    echo "   php artisan config:cache"
else
    echo "✅ Runtime config is correct"
fi

echo ""
echo "4️⃣  Testing storage URL generation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test URL generation
TEST_URL=$(php artisan tinker --execute="use Illuminate\Support\Facades\Storage; echo Storage::disk('public')->url('test.jpg');" 2>/dev/null)
echo "Storage URL test: $TEST_URL"

if [[ $TEST_URL == *"localhost"* ]]; then
    echo "❌ PROBLEM: Storage URLs will use localhost"
    echo ""
    echo "   This is why images show localhost:8001 URLs!"
else
    echo "✅ Storage URLs will use production domain"
fi

echo ""
echo "5️⃣  Checking storage symlink..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -L "public/storage" ]; then
    SYMLINK_TARGET=$(readlink public/storage)
    echo "✅ Symlink exists: public/storage"
    echo "   Target: $SYMLINK_TARGET"
    
    if [ -d "public/storage" ]; then
        echo "✅ Symlink is valid"
    else
        echo "❌ Symlink is broken!"
        echo "   FIX: php artisan storage:link"
    fi
else
    echo "❌ Symlink does NOT exist"
    echo "   FIX: php artisan storage:link"
fi

echo ""
echo "6️⃣  Checking frontend build..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if frontend .env exists
if [ -f "../frontend/.env" ]; then
    if grep -q "^VITE_API_URL=" ../frontend/.env; then
        VITE_URL=$(grep "^VITE_API_URL=" ../frontend/.env | cut -d'=' -f2)
        echo "Frontend VITE_API_URL: $VITE_URL"
        
        if [[ $VITE_URL == *"localhost"* ]]; then
            echo "⚠️  Frontend .env still has localhost"
            echo "   Update frontend/.env:"
            echo "   VITE_API_URL=https://naqashthaheem.com/api"
            echo ""
            echo "   Then rebuild: npm run build"
        else
            echo "✅ Frontend environment configured for production"
        fi
    fi
else
    echo "⚠️  Frontend .env not found"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "  VERIFICATION SUMMARY"
echo "════════════════════════════════════════════════════"
echo ""

# Summary
echo "Quick Fix Commands (if issues found):"
echo ""
echo "1. Update backend/.env:"
echo "   sed -i 's|APP_URL=.*|APP_URL=https://naqashthaheem.com|' backend/.env"
echo ""
echo "2. Clear Laravel caches:"
echo "   cd backend"
echo "   php artisan config:clear"
echo "   php artisan cache:clear"
echo "   php artisan route:clear"
echo "   php artisan view:clear"
echo ""
echo "3. Rebuild config cache:"
echo "   php artisan config:cache"
echo ""
echo "4. Update frontend/.env and rebuild:"
echo "   cd frontend"
echo "   echo 'VITE_API_URL=https://naqashthaheem.com/api' > .env"
echo "   npm run build"
echo ""
echo "5. Restart services:"
echo "   sudo systemctl restart php8.2-fpm"
echo "   sudo systemctl restart nginx"
echo ""
echo "════════════════════════════════════════════════════"

