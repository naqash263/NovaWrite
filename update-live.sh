#!/bin/bash

# 🔄 Live Site Update Script
# This script helps you update your live production site with changes from Cursor

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting Live Site Update...${NC}"

# Configuration
PRODUCTION_URL="https://naqashthaheem.com"
SSH_HOST="your-server-ip"
SSH_USER="your-username"
APP_PATH="/path/to/your/app"

# Check if we're in the right directory
if [ ! -f "composer.json" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will update your LIVE production site!${NC}"
read -p "Are you sure you want to continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Update cancelled${NC}"
    exit 1
fi

# Step 1: Commit changes to Git
echo -e "${BLUE}📝 Committing changes to Git...${NC}"
git add .
read -p "Enter commit message: " commit_message
git commit -m "$commit_message"

# Step 2: Push to repository
echo -e "${BLUE}📤 Pushing to repository...${NC}"
git push origin main

# Step 3: Update production server
echo -e "${BLUE}🚀 Updating production server...${NC}"
echo "You can now SSH into your server and run:"
echo ""
echo -e "${YELLOW}ssh $SSH_USER@$SSH_HOST${NC}"
echo -e "${YELLOW}cd $APP_PATH${NC}"
echo -e "${YELLOW}git pull origin main${NC}"
echo -e "${YELLOW}composer install --no-dev --optimize-autoloader${NC}"
echo -e "${YELLOW}cd frontend && npm ci && npm run build${NC}"
echo -e "${YELLOW}cd .. && php artisan migrate --force${NC}"
echo -e "${YELLOW}php artisan config:cache${NC}"
echo -e "${YELLOW}php artisan route:cache${NC}"
echo -e "${YELLOW}php artisan view:cache${NC}"
echo ""

# Alternative: Automated SSH deployment (uncomment if you have SSH keys set up)
# echo -e "${BLUE}🔧 Deploying via SSH...${NC}"
# ssh $SSH_USER@$SSH_HOST << EOF
# cd $APP_PATH
# git pull origin main
# composer install --no-dev --optimize-autoloader
# cd frontend
# npm ci
# npm run build
# cd ..
# php artisan migrate --force
# php artisan config:cache
# php artisan route:cache
# php artisan view:cache
# EOF

echo -e "${GREEN}✅ Update process initiated!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. SSH into your production server"
echo "2. Run the commands shown above"
echo "3. Test your live site"
echo "4. Monitor for any issues"

echo ""
echo -e "${GREEN}🎉 Live site update completed!${NC}"

