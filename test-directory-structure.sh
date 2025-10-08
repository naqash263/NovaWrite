#!/bin/bash

# 🧪 Test Directory Structure Script
# This script tests the directory structure on the server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Directory Structure on Server${NC}"
echo "=============================================="

# Server details
HOST="162.254.39.126"
USERNAME="timesovh"
PORT="21098"

echo -e "${BLUE}📋 Server Details:${NC}"
echo "Host: $HOST"
echo "Username: $USERNAME"
echo "Port: $PORT"
echo ""

# Test 1: Check if app directory exists
echo -e "${BLUE}📁 Checking app directory...${NC}"
if ssh -p $PORT $USERNAME@$HOST "test -d ~/naqashthaheem.com" 2>/dev/null; then
    echo -e "${GREEN}✅ App directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  App directory ~/naqashthaheem.com not found${NC}"
    echo -e "${BLUE}🔧 Creating app directory...${NC}"
    ssh -p $PORT $USERNAME@$HOST "mkdir -p ~/naqashthaheem.com"
    echo -e "${GREEN}✅ App directory created${NC}"
fi

# Test 2: Check directory contents
echo -e "${BLUE}📋 Checking directory contents...${NC}"
ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && pwd && ls -la"

# Test 3: Check if it's a git repository
echo -e "${BLUE}🔧 Checking if it's a git repository...${NC}"
if ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && test -d .git" 2>/dev/null; then
    echo -e "${GREEN}✅ It's a git repository${NC}"
    
    # Show git status
    echo -e "${BLUE}📋 Git status:${NC}"
    ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && git status"
    
    # Show current branch
    echo -e "${BLUE}📋 Current branch:${NC}"
    ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && git branch"
    
else
    echo -e "${YELLOW}⚠️  Not a git repository${NC}"
    echo -e "${BLUE}🔧 Cloning repository...${NC}"
    ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && git clone https://github.com/naqash263/NovaWrite.git ."
    echo -e "${GREEN}✅ Repository cloned${NC}"
fi

# Test 4: Check project structure
echo -e "${BLUE}📁 Checking project structure...${NC}"
ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && ls -la"

# Test 5: Check for required files
echo -e "${BLUE}🔍 Checking for required files...${NC}"
if ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && test -f backend/composer.json" 2>/dev/null; then
    echo -e "${GREEN}✅ backend/composer.json exists${NC}"
else
    echo -e "${RED}❌ backend/composer.json not found${NC}"
fi

if ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && test -f frontend/package.json" 2>/dev/null; then
    echo -e "${GREEN}✅ frontend/package.json exists${NC}"
else
    echo -e "${RED}❌ frontend/package.json not found${NC}"
fi

if ssh -p $PORT $USERNAME@$HOST "cd ~/naqashthaheem.com && test -f cpanel-deploy.sh" 2>/dev/null; then
    echo -e "${GREEN}✅ cpanel-deploy.sh exists${NC}"
else
    echo -e "${RED}❌ cpanel-deploy.sh not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Directory structure test completed!${NC}"
echo -e "${BLUE}💡 This will help us understand what's happening on the server${NC}"

