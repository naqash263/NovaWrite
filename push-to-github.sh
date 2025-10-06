#!/bin/bash

# Push to GitHub Script
# This script will help you push your code to GitHub

echo "🚀 Pushing NovaWrite to GitHub..."

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the NovaWrite root directory"
    exit 1
fi

# Check git status
echo "📋 Current Git Status:"
git status --short

echo ""
echo "🔑 Authentication Methods:"
echo "1. Personal Access Token (Recommended)"
echo "2. SSH Key"
echo "3. GitHub CLI"

echo ""
echo "📝 To push manually, try these commands:"

echo ""
echo "Method 1: Using Personal Access Token"
echo "git remote set-url origin https://naqash263:YOUR_TOKEN@github.com/naqash263/NovaWrite.git"
echo "git push -u origin main"

echo ""
echo "Method 2: Using SSH (if you have SSH keys set up)"
echo "git remote set-url origin git@github.com:naqash263/NovaWrite.git"
echo "git push -u origin main"

echo ""
echo "Method 3: Using GitHub CLI"
echo "gh auth login"
echo "git push -u origin main"

echo ""
echo "🔧 If you're still having issues:"
echo "1. Check your token permissions at https://github.com/settings/tokens"
echo "2. Make sure the token has 'repo' scope"
echo "3. Try creating a new token if the current one doesn't work"

echo ""
echo "📊 Your current commits:"
git log --oneline -5

echo ""
echo "🎯 Ready to push! Choose one of the methods above."
