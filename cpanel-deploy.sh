#!/bin/bash

# 🚀 cPanel Deployment Script for NovaWrite
# This script runs on your cPanel server after Git pull

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting cPanel deployment...${NC}"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "composer.json" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Step 1: Install/Update Backend Dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
composer install --no-dev --optimize-autoloader --no-interaction

# Step 2: Set up Laravel Environment
echo -e "${BLUE}⚙️  Configuring Laravel...${NC}"
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo -e "${GREEN}✅ Using production environment file${NC}"
else
    echo -e "${YELLOW}⚠️  No .env.production found, using existing .env${NC}"
fi

# Step 3: Run Laravel Commands
echo -e "${BLUE}🔧 Running Laravel commands...${NC}"
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart

# Step 4: Build Frontend
echo -e "${BLUE}🎨 Building frontend...${NC}"
cd ../frontend
npm ci --production
npm run build

# Step 5: Copy Files to Web Root
echo -e "${BLUE}📁 Copying files to web root...${NC}"

# Create public_html directory if it doesn't exist
mkdir -p ../public_html

# Copy frontend build files
cp -r dist/* ../public_html/

# Copy Laravel public files (if any)
if [ -d "../backend/public" ]; then
    cp -r ../backend/public/* ../public_html/
fi

# Step 6: Set Permissions
echo -e "${BLUE}🔐 Setting file permissions...${NC}"
chmod -R 755 ../public_html/
chmod -R 755 ../backend/storage/
chmod -R 755 ../backend/bootstrap/cache/

# Step 7: Clean up
echo -e "${BLUE}🧹 Cleaning up...${NC}"
cd ..
rm -rf frontend/node_modules/
rm -rf frontend/dist/

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Your site should now be updated at: https://naqashthaheem.com${NC}"

# Optional: Test the deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
if curl -s -o /dev/null -w "%{http_code}" https://naqashthaheem.com | grep -q "200"; then
    echo -e "${GREEN}✅ Site is responding correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Site might not be responding yet (this is normal for new deployments)${NC}"
fi

echo -e "${GREEN}🎉 Deployment process completed!${NC}"
