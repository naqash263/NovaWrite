#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Production Deployment${NC}"
echo "=================================="

# Create main directory structure
mkdir -p ~/naqashthaheem.com
cd ~/naqashthaheem.com

# Clone or update repository
if [ ! -d ".git" ]; then
  echo -e "${GREEN}📥 Cloning repository...${NC}"
  git clone https://github.com/naqash263/NovaWrite.git .
else
  echo -e "${GREEN}🔄 Updating repository...${NC}"
  git fetch --all
  git reset --hard origin/main
fi

# Install Node.js using NVM (no sudo required)
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Node.js via NVM...${NC}"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
else
  # Ensure NVM is loaded if Node.js exists
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  export PATH="$NVM_DIR/versions/node/$(nvm current)/bin:$PATH"
fi

# Fix npm configuration issues
echo -e "${BLUE}🔧 Fixing npm configuration...${NC}"
if [ -f "$HOME/.npmrc" ]; then
  echo -e "${YELLOW}⚠️ Removing conflicting .npmrc file${NC}"
  rm -f "$HOME/.npmrc"
fi

# Clean npm cache
npm cache clean --force

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend

# Verify Node.js is working
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found after installation${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm --version)${NC}"

# Clean install
echo -e "${BLUE}🧹 Cleaning previous installation...${NC}"
rm -rf node_modules package-lock.json

# Clean any generated config files that might conflict
echo -e "${BLUE}🧹 Cleaning generated config files...${NC}"
rm -f vite.config.js
rm -f tsconfig.tsbuildinfo
rm -rf node_modules/.tmp

# Clean any generated JavaScript files from TypeScript compilation
echo -e "${BLUE}🧹 Cleaning generated JavaScript files...${NC}"
find src -name "*.js" -type f -delete
find . -name "*.js.map" -type f -delete

npm install

# Create production environment file
echo -e "${BLUE}📝 Creating production environment file...${NC}"
echo "VITE_API_URL=https://naqashthaheem.com/api" > .env
echo "VITE_APP_URL=https://naqashthaheem.com" >> .env
echo "VITE_APP_NAME=Naqash Thaheem" >> .env
echo "VITE_APP_ENV=production" >> .env
if [ ! -z "$VITE_VAPID_PUBLIC_KEY" ]; then
  echo "VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY" >> .env
fi

# Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
export VITE_API_URL=https://naqashthaheem.com/api
export VITE_APP_NAME="Naqash Thaheem"
export VITE_APP_ENV=production
if [ ! -z "$VITE_VAPID_PUBLIC_KEY" ]; then
  export VITE_VAPID_PUBLIC_KEY="$VITE_VAPID_PUBLIC_KEY"
fi

# Debug: Check VAPID key is set
if [ ! -z "$VITE_VAPID_PUBLIC_KEY" ]; then
  echo -e "${BLUE}🔑 VAPID Public Key: ${VITE_VAPID_PUBLIC_KEY:0:20}...${NC}"
fi

# Try to build with detailed output
echo -e "${BLUE}🔨 Running TypeScript type checking...${NC}"
if npx tsc --noEmit; then
  echo -e "${GREEN}✅ TypeScript type checking completed${NC}"
else
  echo -e "${RED}❌ TypeScript type checking failed${NC}"
  exit 1
fi

# Clean up any files that might have been generated during type checking
echo -e "${BLUE}🧹 Cleaning up after type checking...${NC}"
find src -name "*.js" -type f -delete
find . -name "*.js.map" -type f -delete
rm -f tsconfig.tsbuildinfo

echo -e "${BLUE}🔨 Running Vite build...${NC}"
if npx vite build; then
  echo -e "${GREEN}✅ Vite build completed${NC}"
else
  echo -e "${RED}❌ Vite build failed${NC}"
  echo -e "${BLUE}📁 Checking if dist directory exists...${NC}"
  ls -la dist/ 2>/dev/null || echo "dist directory does not exist"
  exit 1
fi

# Verify build was successful
if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Frontend build failed - dist directory not found${NC}"
  echo -e "${BLUE}📁 Current directory contents after build:${NC}"
  ls -la
  exit 1
fi

echo -e "${GREEN}✅ Frontend build completed successfully${NC}"

# Backend setup
echo -e "${BLUE}📦 Setting up backend...${NC}"
cd ../backend

# Install PHP dependencies
if [ ! -f "composer.phar" ]; then
  echo -e "${BLUE}📥 Installing Composer...${NC}"
  php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
  php composer-setup.php --quiet
  rm composer-setup.php
fi

echo -e "${BLUE}📦 Installing Composer dependencies...${NC}"
php composer.phar install --no-dev --optimize-autoloader --quiet

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
  echo -e "${BLUE}📝 Creating .env file...${NC}"
  cp .env.example .env 2>/dev/null || touch .env
fi

# Update .env with production settings
if ! grep -q "^APP_URL=https://naqashthaheem.com" .env; then
  if grep -q "^APP_URL=" .env; then
    sed -i 's|^APP_URL=.*|APP_URL=https://naqashthaheem.com|' .env
  else
    echo "APP_URL=https://naqashthaheem.com" >> .env
  fi
  echo -e "${GREEN}✅ APP_URL updated to https://naqashthaheem.com${NC}"
fi

# Use stable APP_KEY from environment if provided
if [ ! -z "$STABLE_APP_KEY" ]; then
  echo -e "${BLUE}🔑 Setting stable APP_KEY...${NC}"
  if grep -q "^APP_KEY=" .env; then
    sed -i "s|^APP_KEY=.*|APP_KEY=$STABLE_APP_KEY|" .env
  else
    echo "APP_KEY=$STABLE_APP_KEY" >> .env
  fi
  echo -e "${GREEN}✅ APP_KEY restored from environment${NC}"
else
  echo -e "${YELLOW}⚠️ STABLE_APP_KEY not provided, generating new key${NC}"
  php artisan key:generate --force
  NEW_KEY=$(grep '^APP_KEY=' .env | cut -d'=' -f2)
  echo -e "${YELLOW}⚠️ Please add this key as STABLE_APP_KEY secret: $NEW_KEY${NC}"
fi

# Generate JWT secret if not set
if ! grep -q "^JWT_SECRET=" .env; then
  echo -e "${BLUE}🔑 Generating JWT secret...${NC}"
  JWT_SECRET=$(openssl rand -base64 32)
  echo "JWT_SECRET=$JWT_SECRET" >> .env
fi

# Add VAPID keys if provided
if [ ! -z "$VAPID_PUBLIC_KEY" ]; then
  if grep -q "^VAPID_PUBLIC_KEY=" .env; then
    sed -i "s|^VAPID_PUBLIC_KEY=.*|VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY|" .env
  else
    echo "VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY" >> .env
  fi
fi

if [ ! -z "$VAPID_PRIVATE_KEY" ]; then
  if grep -q "^VAPID_PRIVATE_KEY=" .env; then
    sed -i "s|^VAPID_PRIVATE_KEY=.*|VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY|" .env
  else
    echo "VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY" >> .env
  fi
fi

if [ ! -z "$VAPID_SUBJECT" ]; then
  if grep -q "^VAPID_SUBJECT=" .env; then
    sed -i "s|^VAPID_SUBJECT=.*|VAPID_SUBJECT=$VAPID_SUBJECT|" .env
  else
    echo "VAPID_SUBJECT=$VAPID_SUBJECT" >> .env
  fi
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

# Grant database permissions and run migrations
echo -e "${BLUE}🗄️ Setting up database permissions and running migrations...${NC}"

# Grant necessary permissions to database user
PGPASSWORD='mg08.Rcrld}N' psql -h localhost -U timesovh_naqash_thaheem -d timesovh_naqashthaheem <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO timesovh_naqash_thaheem;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO timesovh_naqash_thaheem;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO timesovh_naqash_thaheem;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO timesovh_naqash_thaheem;
EOF

# Run migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
php artisan migrate --force

# Clear and rebuild caches
echo -e "${BLUE}🧹 Clearing caches...${NC}"
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Rebuild caches
echo -e "${BLUE}🔄 Rebuilding caches...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage symlinks
echo -e "${BLUE}🔗 Creating storage symlinks...${NC}"
cd ~/naqashthaheem.com/public_html/api/public
if [ ! -L "storage" ]; then
  ln -sf ../../../backend/storage/app/public storage
  echo -e "${GREEN}✅ Storage symlink created in api/public${NC}"
fi

cd ~/naqashthaheem.com/public_html
if [ ! -L "storage" ]; then
  ln -sf ../backend/storage/app/public storage
  echo -e "${GREEN}✅ Storage symlink created in public_html${NC}"
fi

# Back to backend directory
cd ~/naqashthaheem.com/backend

# Set permissions
echo -e "${BLUE}🔐 Setting permissions...${NC}"
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/

# Deploy frontend to public_html
echo -e "${BLUE}📁 Deploying frontend to public_html...${NC}"
mkdir -p ~/naqashthaheem.com/public_html
cp -r ../frontend/dist/* ~/naqashthaheem.com/public_html/

# Deploy backend to api directory
echo -e "${BLUE}📁 Deploying backend to api directory...${NC}"
mkdir -p ~/naqashthaheem.com/public_html/api
cp -r . ~/naqashthaheem.com/public_html/api/

# Set up .htaccess for API
echo -e "${BLUE}⚙️ Setting up API routing...${NC}"
cat > ~/naqashthaheem.com/public_html/api/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
EOF

# Set up main .htaccess
cat > ~/naqashthaheem.com/public_html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle sitemap requests - route to backend API
    RewriteCond %{REQUEST_URI} ^/sitemap-ntw2024\.xml$ [NC]
    RewriteRule ^sitemap-ntw2024\.xml$ /api/sitemap-ntw2024.xml [L]
    
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

