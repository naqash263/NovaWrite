#!/bin/bash

# GitHub Setup Script for NovaWrite
# This script helps you set up GitHub repository and push your code

echo "🚀 Setting up GitHub for NovaWrite..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run 'git init' first."
    exit 1
fi

# Check if remote origin exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ Remote origin already exists:"
    git remote get-url origin
    echo ""
    echo "To push your code:"
    echo "  git push -u origin main"
else
    echo "📝 No remote origin found. Please follow these steps:"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository named 'NovaWrite'"
    echo "3. Don't initialize with README (we already have one)"
    echo "4. Copy the repository URL"
    echo ""
    echo "Then run these commands:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/NovaWrite.git"
    echo "  git push -u origin main"
    echo ""
    echo "Or if you want to use SSH:"
    echo "  git remote add origin git@github.com:YOUR_USERNAME/NovaWrite.git"
    echo "  git push -u origin main"
fi

echo ""
echo "📋 Current Git Status:"
git status --short

echo ""
echo "📊 Recent Commits:"
git log --oneline -5

echo ""
echo "🎯 Next Steps:"
echo "1. Set up GitHub repository (if not done)"
echo "2. Add remote origin"
echo "3. Push code: git push -u origin main"
echo "4. Set up GitHub Actions for CI/CD"
echo "5. Configure deployment to Namecheap"
