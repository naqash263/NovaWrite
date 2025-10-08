#!/bin/bash

# 🧪 SSH Connection Test Script
# This script tests your SSH connection to the Namecheap server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing SSH Connection to Namecheap Server${NC}"
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

# Test 1: Basic SSH connection
echo -e "${BLUE}🔌 Testing basic SSH connection...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes -p $PORT $USERNAME@$HOST "echo 'SSH connection successful!'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful!${NC}"
else
    echo -e "${RED}❌ SSH connection failed!${NC}"
    echo -e "${YELLOW}💡 Make sure you have:${NC}"
    echo "  1. SSH key set up correctly"
    echo "  2. Public key in ~/.ssh/authorized_keys on server"
    echo "  3. Correct server details"
    echo "  4. SSH service running on port $PORT"
    exit 1
fi

# Test 2: Check if app directory exists
echo -e "${BLUE}📁 Checking app directory...${NC}"
if ssh -p $PORT $USERNAME@$HOST "test -d /naqashthaheem.com" 2>/dev/null; then
    echo -e "${GREEN}✅ App directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  App directory /naqashthaheem.com not found${NC}"
    echo -e "${YELLOW}💡 You may need to create it or check the path${NC}"
fi

# Test 3: Check if Git is available
echo -e "${BLUE}🔧 Checking Git availability...${NC}"
if ssh -p $PORT $USERNAME@$HOST "git --version" 2>/dev/null; then
    echo -e "${GREEN}✅ Git is available${NC}"
else
    echo -e "${RED}❌ Git is not available on the server${NC}"
    echo -e "${YELLOW}💡 You may need to install Git or use a different deployment method${NC}"
fi

# Test 4: Check if PHP is available
echo -e "${BLUE}🐘 Checking PHP availability...${NC}"
if ssh -p $PORT $USERNAME@$HOST "php --version" 2>/dev/null; then
    echo -e "${GREEN}✅ PHP is available${NC}"
else
    echo -e "${RED}❌ PHP is not available on the server${NC}"
    echo -e "${YELLOW}💡 You may need to install PHP or use a different deployment method${NC}"
fi

# Test 5: Check if Node.js is available
echo -e "${BLUE}📦 Checking Node.js availability...${NC}"
if ssh -p $PORT $USERNAME@$HOST "node --version" 2>/dev/null; then
    echo -e "${GREEN}✅ Node.js is available${NC}"
else
    echo -e "${RED}❌ Node.js is not available on the server${NC}"
    echo -e "${YELLOW}💡 You may need to install Node.js or use a different deployment method${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SSH connection test completed!${NC}"
echo -e "${BLUE}💡 If all tests passed, you're ready to set up GitHub Actions!${NC}"

