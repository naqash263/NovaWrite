#!/bin/bash

# 🚀 Quick Deploy Script for NovaWrite
# This script pushes changes and triggers deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 NovaWrite Quick Deploy${NC}"
echo "=========================="

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

# Step 5: Display deployment status
echo -e "${GREEN}✅ Changes pushed to GitHub successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Deployment Status:${NC}"
echo "GitHub Actions is now running the deployment workflow..."
echo "This will:"
echo "  ✅ Install Node.js and dependencies"
echo "  ✅ Build the frontend"
echo "  ✅ Install PHP/Composer dependencies"
echo "  ✅ Deploy to production server"
echo "  ✅ Set up proper directory structure"
echo ""
echo -e "${BLUE}🔍 Monitor deployment:${NC}"
echo "  • GitHub Actions: https://github.com/naqash263/NovaWrite/actions"
echo "  • Production site: https://naqashthaheem.com"
echo "  • Admin panel: https://naqashthaheem.com/admin"
echo ""
echo -e "${GREEN}🎉 Deployment initiated! Check GitHub Actions for progress.${NC}"
