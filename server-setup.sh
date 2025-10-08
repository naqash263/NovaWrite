#!/bin/bash

# 🛠️ Server Setup Script for Namecheap
# This script sets up the server environment for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛠️  Setting up Namecheap server for deployment${NC}"
echo "=============================================="

# Check if we're running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Running as root. Some commands may need adjustment.${NC}"
fi

# Step 1: Update system packages
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt-get update -y

# Step 2: Install Git
echo -e "${BLUE}🔧 Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
    echo -e "${GREEN}✅ Git installed${NC}"
else
    echo -e "${GREEN}✅ Git already installed${NC}"
fi

# Step 3: Install PHP and extensions
echo -e "${BLUE}🐘 Installing PHP and extensions...${NC}"
sudo apt-get install -y php8.2 php8.2-cli php8.2-fpm php8.2-mysql php8.2-pgsql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd php8.2-intl

# Step 4: Install Composer
echo -e "${BLUE}📦 Installing Composer...${NC}"
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
    sudo chmod +x /usr/local/bin/composer
    echo -e "${GREEN}✅ Composer installed${NC}"
else
    echo -e "${GREEN}✅ Composer already installed${NC}"
fi

# Step 5: Install Node.js and npm
echo -e "${BLUE}📦 Installing Node.js and npm...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js and npm installed${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi

# Step 6: Install PostgreSQL client (if needed)
echo -e "${BLUE}🐘 Installing PostgreSQL client...${NC}"
sudo apt-get install -y postgresql-client

# Step 7: Create app directory
echo -e "${BLUE}📁 Creating app directory...${NC}"
sudo mkdir -p /naqashthaheem.com
sudo chown $USER:$USER /naqashthaheem.com
echo -e "${GREEN}✅ App directory created${NC}"

# Step 8: Set up web root
echo -e "${BLUE}🌐 Setting up web root...${NC}"
sudo mkdir -p /naqashthaheem.com/public_html
sudo chown -R $USER:$USER /naqashthaheem.com/public_html
echo -e "${GREEN}✅ Web root created${NC}"

# Step 9: Install PM2 for process management (optional)
echo -e "${BLUE}⚡ Installing PM2 for process management...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Step 10: Set up firewall (if needed)
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"

# Step 11: Create production environment file
echo -e "${BLUE}⚙️  Creating production environment file...${NC}"
cat > /naqashthaheem.com/production.env.example << 'EOF'
# Production Environment Configuration
APP_NAME="Naqash Thaheem"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://naqashthaheem.com
APP_KEY=base64:YOUR_APP_KEY_HERE

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_DATABASE=naqashthaheem_production
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=5432

# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=mail.naqashthaheem.com
MAIL_PORT=587
MAIL_USERNAME=contact@naqashthaheem.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="contact@naqashthaheem.com"
MAIL_FROM_NAME="Naqash Thaheem"
EOF

echo -e "${GREEN}✅ Production environment template created${NC}"

# Step 12: Set up log rotation
echo -e "${BLUE}📝 Setting up log rotation...${NC}"
sudo mkdir -p /var/log/novawrite
sudo chown $USER:$USER /var/log/novawrite

# Step 13: Final permissions
echo -e "${BLUE}🔐 Setting final permissions...${NC}"
sudo chown -R $USER:$USER /naqashthaheem.com
sudo chmod -R 755 /naqashthaheem.com

echo -e "${GREEN}🎉 Server setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Copy production.env.example to backend/.env.production"
echo "2. Update the environment variables with your actual values"
echo "3. Test the deployment with GitHub Actions"
echo ""
echo -e "${BLUE}💡 Your server is now ready for deployment!${NC}"
