#!/bin/bash

# Fix Namecheap Deployment Script
# This script fixes common deployment issues on Namecheap hosting

echo "🔧 Fixing NovaWrite Deployment on Namecheap..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BLUE}📋 Step 1: Fix Storage Permissions...${NC}"

# Create storage directories if they don't exist
print_status "Creating storage directories..."
mkdir -p storage/logs
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/app/public

# Set proper permissions
print_status "Setting storage permissions..."
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/

echo -e "${BLUE}📋 Step 2: Clear Laravel Caches...${NC}"

# Clear all caches
print_status "Clearing application caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo -e "${BLUE}📋 Step 3: Generate Application Key...${NC}"

# Generate application key
print_status "Generating application key..."
php artisan key:generate --force

echo -e "${BLUE}📋 Step 4: Run Database Migrations...${NC}"

# Run migrations
print_status "Running database migrations..."
php artisan migrate --force

echo -e "${BLUE}📋 Step 5: Seed Database...${NC}"

# Seed database
print_status "Seeding database with initial data..."
php artisan db:seed --force

echo -e "${BLUE}📋 Step 6: Optimize for Production...${NC}"

# Cache for production
print_status "Caching for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo -e "${BLUE}📋 Step 7: Create Symbolic Link for Storage...${NC}"

# Create symbolic link for storage
print_status "Creating storage symbolic link..."
php artisan storage:link

echo -e "${BLUE}📋 Step 8: Final Permissions Check...${NC}"

# Set final permissions
print_status "Setting final permissions..."
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
chmod 644 .env

print_status "Deployment fix completed successfully!"
echo ""
echo -e "${GREEN}🎉 Your NovaWrite application should now be working!${NC}"
echo ""
echo -e "${BLUE}📋 Test your application:${NC}"
echo "1. Frontend: https://naqashthaheem.com"
echo "2. API: https://naqashthaheem.com/api"
echo "3. Test script: https://naqashthaheem.com/test-deployment.php"
echo ""
echo -e "${YELLOW}⚠️  If you still have issues, check the error logs:${NC}"
echo "tail -f storage/logs/laravel.log"
