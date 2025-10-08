#!/bin/bash

# 🚀 Production Deployment Script for NovaWrite
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 NovaWrite Production Deployment${NC}"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "backend/composer.json" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Step 1: Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# Step 2: Install Composer if not present
if ! command -v composer &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Composer...${NC}"
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
else
    echo -e "${GREEN}✅ Composer already installed: $(composer --version)${NC}"
fi

# Step 3: Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend
npm ci --production=false

# Step 4: Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
export VITE_API_URL=https://naqashthaheem.com/api
export VITE_APP_NAME="Naqash Thaheem"
export VITE_APP_ENV=production

if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ Using production environment file${NC}"
    cp .env.production .env
fi

npm run build

# Step 5: Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd ../backend
composer install --no-dev --optimize-autoloader

# Step 6: Set up Laravel
echo -e "${BLUE}⚙️ Setting up Laravel...${NC}"
if [ -f ".env.production" ]; then
    cp .env.production .env
fi

php artisan key:generate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 7: Run migrations
echo -e "${BLUE}🗄️ Running database migrations...${NC}"
php artisan migrate --force

# Step 8: Set permissions
echo -e "${BLUE}🔐 Setting permissions...${NC}"
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/

# Step 9: Deploy frontend to public_html
echo -e "${BLUE}📁 Deploying frontend to public_html...${NC}"
mkdir -p ~/public_html
cp -r ../frontend/dist/* ~/public_html/

# Step 10: Deploy backend to api directory
echo -e "${BLUE}📁 Deploying backend to api directory...${NC}"
mkdir -p ~/public_html/api
cp -r . ~/public_html/api/

# Step 11: Set up .htaccess for API
echo -e "${BLUE}⚙️ Setting up API routing...${NC}"
cat > ~/public_html/api/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
EOF

# Step 12: Set up main .htaccess
cat > ~/public_html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle API requests
    RewriteCond %{REQUEST_URI} ^/api/(.*)$
    RewriteRule ^api/(.*)$ api/public/$1 [L]
    
    # Handle frontend routes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
EOF

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Your site is now live at: https://naqashthaheem.com${NC}"
echo -e "${BLUE}🔧 API is available at: https://naqashthaheem.com/api${NC}"
echo -e "${BLUE}📊 Admin panel: https://naqashthaheem.com/admin${NC}"
