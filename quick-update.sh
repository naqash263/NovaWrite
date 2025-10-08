#!/bin/bash

# 🔄 Quick Update Script for NovaWrite
# This script helps you quickly update your live site with changes from Cursor

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 NovaWrite Quick Update${NC}"
echo "================================"

# Check if we're in the right directory
if [ ! -f "backend/composer.json" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Step 1: Check for uncommitted changes
echo -e "${BLUE}📋 Checking for changes...${NC}"
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes. Please commit them first:${NC}"
    echo "   git add ."
    echo "   git commit -m 'Your commit message'"
    exit 1
fi

# Step 2: Get commit message
echo -e "${BLUE}📝 What changes did you make?${NC}"
read -p "Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    echo -e "${RED}❌ Commit message cannot be empty${NC}"
    exit 1
fi

# Step 3: Add and commit changes
echo -e "${BLUE}📦 Committing changes...${NC}"
git add .
git commit -m "$commit_message"

# Step 4: Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main

# Step 5: Display next steps
echo -e "${GREEN}✅ Changes pushed to GitHub successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps for production update:${NC}"
echo ""
echo -e "${BLUE}🚀 Option 1: Automated Deployment (Recommended)${NC}"
echo "If you've set up GitHub Actions with SSH secrets:"
echo "   ✅ Your site will update automatically!"
echo "   GitHub Actions will:"
echo "   - Clone/update your repository on the server"
echo "   - Install dependencies and build frontend"
echo "   - Deploy everything to your live site"
echo "   Check the 'Actions' tab in GitHub to see the deployment progress"
echo ""
echo -e "${BLUE}🔧 Option 2: Manual Deployment${NC}"
echo "If you prefer manual control:"
echo "1. SSH into your Namecheap server:"
echo "   ssh -p 21098 timesovh@162.254.39.126"
echo ""
echo "2. Navigate to your app directory:"
echo "   cd /naqashthaheem.com"
echo ""
echo "3. Pull the latest changes:"
echo "   git pull origin main"
echo ""
echo "4. Run the deployment script:"
echo "   ./cpanel-deploy.sh"
echo ""

echo -e "${GREEN}🎉 Update process completed!${NC}"
echo -e "${BLUE}💡 Tip: Set up GitHub Actions for automatic deployment!${NC}"
echo -e "${BLUE}📖 See GITHUB_SECRETS_SETUP.md for instructions${NC}"
