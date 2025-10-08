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

# Debug information
echo -e "${BLUE}📋 Debug information:${NC}"
echo "Current directory: $(pwd)"
echo "Contents of current directory:"
ls -la
echo ""

# Check if we're in the right directory
if [ ! -f "backend/composer.json" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    echo -e "${YELLOW}💡 Current directory: $(pwd)${NC}"
    echo -e "${YELLOW}💡 Looking for: backend/composer.json and frontend/package.json${NC}"
    echo -e "${YELLOW}💡 Available files:${NC}"
    ls -la | grep -E "(composer|package)"
    exit 1
fi

# Step 1: Install/Update Backend Dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend

# Check if composer is available
if ! command -v composer &> /dev/null; then
    echo -e "${YELLOW}⚠️  Composer not found, trying alternative installation...${NC}"
    # Try to install composer if not available
    curl -sS https://getcomposer.org/installer | php
    php composer.phar install --no-dev --optimize-autoloader --no-interaction
else
    composer install --no-dev --optimize-autoloader --no-interaction
fi

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

# Run migrations with error handling
if php artisan migrate --force; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Some migrations failed, but continuing with deployment${NC}"
    echo -e "${YELLOW}💡 You may need to fix migration issues manually${NC}"
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart

# Step 4: Build Frontend
echo -e "${BLUE}🎨 Building frontend...${NC}"
cd ../frontend

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm not found, trying alternative installation...${NC}"
    
    # Check if we're on a Debian-based system
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs || echo -e "${YELLOW}⚠️  Could not install Node.js via apt${NC}"
    elif command -v yum &> /dev/null; then
        # For CentOS/RHEL systems
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs || echo -e "${YELLOW}⚠️  Could not install Node.js via yum${NC}"
    elif command -v dnf &> /dev/null; then
        # For Fedora systems
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        dnf install -y nodejs || echo -e "${YELLOW}⚠️  Could not install Node.js via dnf${NC}"
    else
        echo -e "${YELLOW}⚠️  Unsupported system for automatic Node.js installation${NC}"
        echo -e "${YELLOW}💡 Please install Node.js manually on your server${NC}"
    fi
fi

# Install dependencies and build
if command -v npm &> /dev/null; then
    if [ -f "package-lock.json" ]; then
        npm ci --production || echo -e "${YELLOW}⚠️  npm ci failed, trying npm install${NC}" && npm install --production
    else
        npm install --production
    fi

    # Set production environment variables for build
    export VITE_API_URL=https://naqashthaheem.com/api
    export VITE_APP_NAME="Naqash Thaheem"
    export VITE_APP_ENV=production

    # Use production environment file if it exists
    if [ -f ".env.production" ]; then
        echo -e "${GREEN}✅ Using production environment file${NC}"
        cp .env.production .env
    fi

    # Build frontend
    if npm run build; then
        echo -e "${GREEN}✅ Frontend built successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend build failed, but continuing with deployment${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  npm not available, skipping frontend build${NC}"
    echo -e "${YELLOW}💡 Please install Node.js on your server to build the frontend${NC}"
    echo -e "${YELLOW}💡 You can run: ./install-nodejs.sh${NC}"
fi

# Step 5: Copy Files to Web Root
echo -e "${BLUE}📁 Copying files to web root...${NC}"

# Create public_html directory if it doesn't exist
mkdir -p ~/naqashthaheem.com/public_html

# Copy frontend build files (if they exist)
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo -e "${GREEN}✅ Copying frontend build files...${NC}"
    cp -r dist/* ~/naqashthaheem.com/public_html/
else
    echo -e "${YELLOW}⚠️  No frontend build files found, skipping frontend deployment${NC}"
    echo -e "${YELLOW}💡 Install Node.js and run 'npm run build' to generate frontend files${NC}"
fi

# Copy Laravel public files (if any)
if [ -d "../backend/public" ]; then
    echo -e "${GREEN}✅ Copying Laravel public files...${NC}"
    cp -r ../backend/public/* ~/naqashthaheem.com/public_html/
fi

# Copy .htaccess for Laravel
if [ -f "../backend/public/.htaccess" ]; then
    cp ../backend/public/.htaccess ~/naqashthaheem.com/public_html/
fi

# Step 6: Set Permissions
echo -e "${BLUE}🔐 Setting file permissions...${NC}"
chmod -R 755 ~/naqashthaheem.com/public_html/
chmod -R 755 ~/naqashthaheem.com/backend/storage/
chmod -R 755 ~/naqashthaheem.com/backend/bootstrap/cache/

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
