#!/bin/bash

# 🚀 NovaWrite Deployment Script
# This script helps deploy your application to Namecheap hosting

set -e  # Exit on any error

echo "🚀 Starting NovaWrite Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_URL="https://naqashthaheem.com"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BUILD_DIR="frontend/dist"

# Check if we're in the right directory
if [ ! -f "composer.json" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment checks...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ PHP is not installed. Please install PHP first.${NC}"
    exit 1
fi

# Check if Composer is installed
if ! command -v composer &> /dev/null; then
    echo -e "${RED}❌ Composer is not installed. Please install Composer first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies found${NC}"

# Step 1: Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd $BACKEND_DIR
composer install --no-dev --optimize-autoloader
cd ..

# Step 2: Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd $FRONTEND_DIR
npm ci
cd ..

# Step 3: Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
cd $FRONTEND_DIR
npm run build
cd ..

# Step 4: Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Frontend build failed. Build directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 5: Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
DEPLOY_DIR="deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p $DEPLOY_DIR

# Copy backend files
cp -r $BACKEND_DIR/* $DEPLOY_DIR/
rm -rf $DEPLOY_DIR/node_modules
rm -rf $DEPLOY_DIR/storage/logs/*
rm -rf $DEPLOY_DIR/bootstrap/cache/*

# Copy frontend build
mkdir -p $DEPLOY_DIR/public
cp -r $BUILD_DIR/* $DEPLOY_DIR/public/

echo -e "${GREEN}✅ Deployment package created: $DEPLOY_DIR${NC}"

# Step 6: Display deployment instructions
echo -e "${YELLOW}📋 Manual Deployment Instructions:${NC}"
echo ""
echo "1. Upload the contents of '$DEPLOY_DIR' to your Namecheap hosting"
echo "2. Set up your production database"
echo "3. Create a .env file with production settings:"
echo ""
echo "   APP_NAME=\"Naqash Thaheem\""
echo "   APP_ENV=production"
echo "   APP_DEBUG=false"
echo "   APP_URL=$PRODUCTION_URL"
echo "   DB_CONNECTION=pgsql"
echo "   DB_HOST=localhost"
echo "   DB_DATABASE=naqashthaheem_production"
echo "   DB_USERNAME=your_db_username"
echo "   DB_PASSWORD=your_db_password"
echo "   MAIL_FROM_ADDRESS=\"noreply@naqashthaheem.com\""
echo "   MAIL_FROM_NAME=\"Naqash Thaheem\""
echo ""
echo "4. Run these commands on your server:"
echo "   php artisan migrate --force"
echo "   php artisan config:cache"
echo "   php artisan route:cache"
echo "   php artisan view:cache"
echo ""
echo "5. Set proper file permissions:"
echo "   chmod -R 755 storage bootstrap/cache"
echo "   chown -R www-data:www-data storage bootstrap/cache"
echo ""

# Step 7: Optional - Create .env.production template
echo -e "${BLUE}📝 Creating .env.production template...${NC}"
cat > $DEPLOY_DIR/.env.production.template << EOF
APP_NAME="Naqash Thaheem"
APP_ENV=production
APP_DEBUG=false
APP_URL=$PRODUCTION_URL

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=naqashthaheem_production
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=mail.naqashthaheem.com
MAIL_PORT=587
MAIL_USERNAME=noreply@naqashthaheem.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS="noreply@naqashthaheem.com"
MAIL_FROM_NAME="Naqash Thaheem"

# Security
SESSION_ENCRYPT=true
SESSION_DOMAIN=naqashthaheem.com
LOG_LEVEL=error

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_ALGO=HS256
EOF

echo -e "${GREEN}✅ .env.production template created${NC}"

# Step 8: Create deployment checklist
echo -e "${BLUE}📋 Creating deployment checklist...${NC}"
cat > $DEPLOY_DIR/DEPLOYMENT_CHECKLIST.md << EOF
# 🚀 Deployment Checklist

## Pre-Deployment
- [ ] Test all functionality locally
- [ ] Update environment variables
- [ ] Backup production database
- [ ] Check SSL certificate

## Deployment
- [ ] Upload files to server
- [ ] Set up .env file
- [ ] Run database migrations
- [ ] Clear and cache configurations
- [ ] Set file permissions
- [ ] Test all functionality

## Post-Deployment
- [ ] Verify email sending works
- [ ] Test user registration/login
- [ ] Check admin panel access
- [ ] Monitor error logs
- [ ] Set up automated backups

## Rollback Plan
- [ ] Keep previous version backup
- [ ] Document rollback procedure
- [ ] Test rollback process
EOF

echo -e "${GREEN}✅ Deployment checklist created${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment package ready!${NC}"
echo -e "${YELLOW}📁 Location: $DEPLOY_DIR${NC}"
echo -e "${YELLOW}📋 Next: Follow the instructions above to deploy to Namecheap${NC}"
echo ""

# Optional: Ask if user wants to clean up
read -p "Do you want to clean up the deployment directory after you're done? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧹 To clean up later, run: rm -rf $DEPLOY_DIR${NC}"
fi

echo -e "${GREEN}✨ Deployment script completed!${NC}"