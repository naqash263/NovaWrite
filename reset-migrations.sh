#!/bin/bash

# 🔄 Reset Migrations Script
# This script resets the database and runs migrations from scratch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Resetting Database Migrations${NC}"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "backend/artisan" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

cd backend

echo -e "${BLUE}🗑️  Dropping all tables...${NC}"
php artisan migrate:reset --force || echo -e "${YELLOW}⚠️  Reset failed, trying fresh migration${NC}"

echo -e "${BLUE}🔄 Running fresh migrations...${NC}"
php artisan migrate:fresh --force

echo -e "${BLUE}🌱 Seeding database...${NC}"
php artisan db:seed --force

echo -e "${GREEN}✅ Database reset completed successfully!${NC}"
echo -e "${BLUE}💡 All tables have been recreated and seeded${NC}"
