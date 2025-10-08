#!/bin/bash

# 🔍 Check Migrations Script
# This script checks the current migration status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking Migration Status${NC}"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "backend/artisan" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

cd backend

echo -e "${BLUE}📋 Current migration status:${NC}"
php artisan migrate:status

echo -e "${BLUE}📋 Database tables:${NC}"
php artisan tinker --execute="echo 'Tables: '; print_r(array_keys(DB::select('SELECT name FROM sqlite_master WHERE type=\"table\"')));"

echo -e "${BLUE}📋 Checking specific tables:${NC}"
php artisan tinker --execute="
try {
    echo 'workflow_categories table exists: ' . (Schema::hasTable('workflow_categories') ? 'YES' : 'NO') . PHP_EOL;
    echo 'workflows table exists: ' . (Schema::hasTable('workflows') ? 'YES' : 'NO') . PHP_EOL;
    echo 'posts table exists: ' . (Schema::hasTable('posts') ? 'YES' : 'NO') . PHP_EOL;
} catch (Exception \$e) {
    echo 'Error checking tables: ' . \$e->getMessage() . PHP_EOL;
}
"

echo -e "${GREEN}✅ Migration check completed!${NC}"
