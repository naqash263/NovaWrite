#!/bin/bash

# Fix Database Port Issue on Namecheap
# This script fixes the ${PGPORT} environment variable issue

echo "🔧 Fixing Database Port Issue on Namecheap..."
echo "============================================="

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

echo -e "${BLUE}📋 Step 1: Check current .env file...${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    echo "Please make sure you're in the correct directory (naqashthaheem.com/api)"
    exit 1
fi

# Show current database configuration
echo "Current database configuration:"
grep -E "^DB_" .env

echo -e "${BLUE}📋 Step 2: Fix database port issue...${NC}"

# Create backup
print_status "Creating backup of .env file..."
cp .env .env.backup

# Fix the port issue by ensuring it's a number, not a variable
print_status "Fixing database port configuration..."
sed -i 's/DB_PORT=.*/DB_PORT=5432/' .env

# Verify the fix
echo "Updated database configuration:"
grep -E "^DB_" .env

echo -e "${BLUE}📋 Step 3: Clear Laravel caches...${NC}"

# Clear all caches
print_status "Clearing application caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo -e "${BLUE}📋 Step 4: Test database connection...${NC}"

# Test database connection
print_status "Testing database connection..."
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connection successful!';"

if [ $? -eq 0 ]; then
    print_status "Database connection test passed!"
else
    print_error "Database connection test failed!"
    echo "Please check your database credentials in the .env file"
    exit 1
fi

echo -e "${BLUE}📋 Step 5: Run migrations...${NC}"

# Run migrations
print_status "Running database migrations..."
php artisan migrate --force

echo -e "${BLUE}📋 Step 6: Seed database...${NC}"

# Seed database
print_status "Seeding database with initial data..."
php artisan db:seed --force

echo -e "${BLUE}📋 Step 7: Optimize for production...${NC}"

# Cache for production
print_status "Caching for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

print_status "Database port fix completed successfully!"
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
