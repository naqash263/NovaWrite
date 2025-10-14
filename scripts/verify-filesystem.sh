#!/bin/bash

# Filesystem Verification Script
# Run this on production to verify storage setup

echo "════════════════════════════════════════════"
echo "  FILESYSTEM VERIFICATION SCRIPT"
echo "════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/artisan" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

echo "1. Checking storage directories..."
echo ""

# Check storage/app/public exists
if [ -d "backend/storage/app/public" ]; then
    echo -e "${GREEN}✅ backend/storage/app/public exists${NC}"
else
    echo -e "${RED}❌ backend/storage/app/public NOT FOUND${NC}"
    echo "Creating directory..."
    mkdir -p backend/storage/app/public
fi

# Check subdirectories
for dir in home-images uploads images; do
    if [ -d "backend/storage/app/public/$dir" ]; then
        echo -e "${GREEN}✅ backend/storage/app/public/$dir exists${NC}"
    else
        echo -e "${YELLOW}⚠️  backend/storage/app/public/$dir NOT FOUND${NC}"
        echo "   Creating directory..."
        mkdir -p "backend/storage/app/public/$dir"
    fi
done

echo ""
echo "2. Checking storage symlink..."
echo ""

# Check if symlink exists
if [ -L "backend/public/storage" ]; then
    TARGET=$(readlink "backend/public/storage")
    echo -e "${GREEN}✅ Symlink exists${NC}"
    echo "   Points to: $TARGET"
    
    # Verify symlink is correct
    if [ -d "backend/public/storage" ]; then
        echo -e "${GREEN}✅ Symlink is valid${NC}"
    else
        echo -e "${RED}❌ Symlink is broken${NC}"
        echo "   Recreating symlink..."
        rm backend/public/storage
        cd backend && php artisan storage:link
    fi
else
    echo -e "${RED}❌ Storage symlink NOT FOUND${NC}"
    echo "   Creating symlink..."
    cd backend && php artisan storage:link
fi

echo ""
echo "3. Checking permissions..."
echo ""

# Check if storage is writable
if [ -w "backend/storage/app/public" ]; then
    echo -e "${GREEN}✅ backend/storage/app/public is writable${NC}"
else
    echo -e "${RED}❌ backend/storage/app/public is NOT writable${NC}"
    echo "   Fix with: chmod -R 775 backend/storage"
fi

# Check bootstrap/cache
if [ -w "backend/bootstrap/cache" ]; then
    echo -e "${GREEN}✅ backend/bootstrap/cache is writable${NC}"
else
    echo -e "${RED}❌ backend/bootstrap/cache is NOT writable${NC}"
    echo "   Fix with: chmod -R 775 backend/bootstrap/cache"
fi

echo ""
echo "4. Checking Laravel configuration..."
echo ""

cd backend

# Check APP_URL
APP_URL=$(php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); echo config('app.url');")
echo "APP_URL: $APP_URL"

if [[ $APP_URL == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠️  APP_URL contains 'localhost' - This is OK for development${NC}"
    echo -e "${YELLOW}⚠️  For production, set: APP_URL=https://naqashthaheem.com${NC}"
else
    echo -e "${GREEN}✅ APP_URL is set for production${NC}"
fi

# Check filesystem disk
DEFAULT_DISK=$(php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); echo config('filesystems.default');")
echo "Default filesystem: $DEFAULT_DISK"

if [ "$DEFAULT_DISK" = "local" ]; then
    echo -e "${YELLOW}⚠️  Using 'local' disk - For production with public files, consider using 'public' disk${NC}"
fi

# Check public disk URL
PUBLIC_URL=$(php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); echo config('filesystems.disks.public.url');")
echo "Public disk URL base: $PUBLIC_URL"

# Test URL generation
TEST_URL=$(php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); use Illuminate\Support\Facades\Storage; echo Storage::disk('public')->url('test.jpg');")
echo "Test storage URL: $TEST_URL"

if [[ $TEST_URL == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠️  Storage URLs will use localhost${NC}"
else
    echo -e "${GREEN}✅ Storage URLs configured for production${NC}"
fi

echo ""
echo "5. Checking upload directories..."
echo ""

# Count files in each directory
for dir in home-images uploads images; do
    if [ -d "storage/app/public/$dir" ]; then
        COUNT=$(ls "storage/app/public/$dir" 2>/dev/null | wc -l | xargs)
        echo "   $dir: $COUNT files"
    fi
done

echo ""
echo "════════════════════════════════════════════"
echo "  VERIFICATION COMPLETE"
echo "════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  • Storage directories: Check above"
echo "  • Symlink: Check above"
echo "  • Permissions: Check above"
echo "  • Configuration: Check above"
echo ""
echo "If any issues were found, follow the suggestions above."
echo ""

