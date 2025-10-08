#!/bin/bash

# 🧪 Test Deployment Script
# This script tests the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Deployment Process${NC}"
echo "================================"

# Server details
HOST="162.254.39.126"
USERNAME="timesovh"
PORT="21098"

echo -e "${BLUE}📋 Server Details:${NC}"
echo "Host: $HOST"
echo "Username: $USERNAME"
echo "Port: $PORT"
echo ""

# Test 1: SSH Connection
echo -e "${BLUE}🔌 Testing SSH connection...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes -p $PORT $USERNAME@$HOST "echo 'SSH connection successful!'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful!${NC}"
else
    echo -e "${RED}❌ SSH connection failed!${NC}"
    echo -e "${YELLOW}💡 Make sure you have:${NC}"
    echo "  1. SSH key set up correctly"
    echo "  2. Public key in ~/.ssh/authorized_keys on server"
    echo "  3. Correct server details"
    exit 1
fi

# Test 2: Check if app directory exists
echo -e "${BLUE}📁 Checking app directory...${NC}"
if ssh -p $PORT $USERNAME@$HOST "test -d /naqashthaheem.com" 2>/dev/null; then
    echo -e "${GREEN}✅ App directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  App directory /naqashthaheem.com not found${NC}"
    echo -e "${BLUE}🔧 Creating app directory...${NC}"
    ssh -p $PORT $USERNAME@$HOST "sudo mkdir -p /naqashthaheem.com && sudo chown $USERNAME:$USERNAME /naqashthaheem.com"
    echo -e "${GREEN}✅ App directory created${NC}"
fi

# Test 3: Check if Git is available
echo -e "${BLUE}🔧 Checking Git availability...${NC}"
if ssh -p $PORT $USERNAME@$HOST "git --version" 2>/dev/null; then
    echo -e "${GREEN}✅ Git is available${NC}"
else
    echo -e "${YELLOW}⚠️  Git is not available on the server${NC}"
    echo -e "${BLUE}🔧 Installing Git...${NC}"
    ssh -p $PORT $USERNAME@$HOST "sudo apt-get update && sudo apt-get install -y git"
    echo -e "${GREEN}✅ Git installed${NC}"
fi

# Test 4: Check if PHP is available
echo -e "${BLUE}🐘 Checking PHP availability...${NC}"
if ssh -p $PORT $USERNAME@$HOST "php --version" 2>/dev/null; then
    echo -e "${GREEN}✅ PHP is available${NC}"
else
    echo -e "${YELLOW}⚠️  PHP is not available on the server${NC}"
    echo -e "${BLUE}🔧 Installing PHP...${NC}"
    ssh -p $PORT $USERNAME@$HOST "sudo apt-get update && sudo apt-get install -y php8.2 php8.2-cli php8.2-mysql php8.2-pgsql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip"
    echo -e "${GREEN}✅ PHP installed${NC}"
fi

# Test 5: Check if Composer is available
echo -e "${BLUE}📦 Checking Composer availability...${NC}"
if ssh -p $PORT $USERNAME@$HOST "composer --version" 2>/dev/null; then
    echo -e "${GREEN}✅ Composer is available${NC}"
else
    echo -e "${YELLOW}⚠️  Composer is not available on the server${NC}"
    echo -e "${BLUE}🔧 Installing Composer...${NC}"
    ssh -p $PORT $USERNAME@$HOST "curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer && sudo chmod +x /usr/local/bin/composer"
    echo -e "${GREEN}✅ Composer installed${NC}"
fi

# Test 6: Check if Node.js is available
echo -e "${BLUE}📦 Checking Node.js availability...${NC}"
if ssh -p $PORT $USERNAME@$HOST "node --version" 2>/dev/null; then
    echo -e "${GREEN}✅ Node.js is available${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js is not available on the server${NC}"
    echo -e "${BLUE}🔧 Installing Node.js...${NC}"
    ssh -p $PORT $USERNAME@$HOST "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo -e "${GREEN}✅ Node.js installed${NC}"
fi

# Test 7: Test repository clone
echo -e "${BLUE}📥 Testing repository clone...${NC}"
if ssh -p $PORT $USERNAME@$HOST "cd /naqashthaheem.com && git clone https://github.com/naqash263/NovaWrite.git test-clone && rm -rf test-clone" 2>/dev/null; then
    echo -e "${GREEN}✅ Repository clone successful${NC}"
else
    echo -e "${RED}❌ Repository clone failed${NC}"
    echo -e "${YELLOW}💡 Check if the repository is accessible from the server${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment test completed!${NC}"
echo -e "${BLUE}💡 Your server is ready for GitHub Actions deployment!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Make sure your GitHub secrets are set up correctly"
echo "2. Push a change to trigger the deployment"
echo "3. Check the GitHub Actions tab for deployment progress"
