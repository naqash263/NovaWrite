#!/bin/bash

# 📦 Install Node.js Script
# This script installs Node.js on various Linux systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing Node.js${NC}"
echo "======================"

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js is already installed: $(node --version)${NC}"
    exit 0
fi

# Detect the system type
if command -v apt-get &> /dev/null; then
    echo -e "${BLUE}🐧 Detected Debian/Ubuntu system${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
elif command -v yum &> /dev/null; then
    echo -e "${BLUE}🔴 Detected CentOS/RHEL system${NC}"
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
    sudo yum install -y nodejs
elif command -v dnf &> /dev/null; then
    echo -e "${BLUE}🔵 Detected Fedora system${NC}"
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
    sudo dnf install -y nodejs
elif command -v pacman &> /dev/null; then
    echo -e "${BLUE}🟣 Detected Arch Linux system${NC}"
    sudo pacman -S nodejs npm
else
    echo -e "${YELLOW}⚠️  Unsupported system. Trying manual installation...${NC}"
    
    # Try to install using Node Version Manager (nvm)
    echo -e "${BLUE}📥 Installing Node.js via NVM...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Source nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install and use Node.js 18
    nvm install 18
    nvm use 18
    nvm alias default 18
fi

# Verify installation
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js installed successfully: $(node --version)${NC}"
    echo -e "${GREEN}✅ npm installed successfully: $(npm --version)${NC}"
else
    echo -e "${RED}❌ Node.js installation failed${NC}"
    echo -e "${YELLOW}💡 Please install Node.js manually on your server${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Node.js installation completed!${NC}"
