#!/bin/bash

# 🚀 Start Local Development Servers
# This script starts both backend and frontend servers for local testing

echo "🚀 Starting NovaWrite Local Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Check if backend port 8001 is already in use
if check_port 8001; then
    echo -e "${YELLOW}⚠️  Port 8001 is already in use (backend may already be running)${NC}"
    echo "   Kill it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        lsof -ti:8001 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Killed process on port 8001${NC}"
        sleep 1
    fi
fi

# Check if frontend port 3000 is already in use
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use (frontend may already be running)${NC}"
    echo "   Kill it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Killed process on port 3000${NC}"
        sleep 1
    fi
fi

echo ""
echo -e "${BLUE}📦 Installing dependencies (if needed)...${NC}"

# Check and install backend dependencies
if [ ! -d "$SCRIPT_DIR/backend/vendor" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd "$SCRIPT_DIR/backend"
    composer install --quiet
fi

# Check and install frontend dependencies
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$SCRIPT_DIR/frontend"
    npm install
fi

echo ""
echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""
echo -e "${BLUE}🔧 Starting servers...${NC}"
echo ""

# Start backend in background
echo -e "${GREEN}🚀 Starting Backend (Laravel)...${NC}"
cd "$SCRIPT_DIR/backend"
php artisan serve > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 2

# Check if backend started successfully
if check_port 8001; then
    echo -e "${GREEN}✅ Backend running at http://localhost:8001${NC}"
else
    echo -e "${YELLOW}❌ Backend failed to start${NC}"
    echo "   Check logs: tail -f backend/storage/logs/laravel.log"
fi

echo ""

# Start frontend in background
echo -e "${GREEN}🚀 Starting Frontend (React + Vite)...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 3

# Check if frontend started successfully
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend running at http://localhost:3000${NC}"
else
    echo -e "${YELLOW}❌ Frontend failed to start${NC}"
    echo "   Try manually: cd frontend && npm run dev"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 Local Development Environment Ready!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📝 Access Points:${NC}"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8001"
echo "   API:       http://localhost:8001/api"
echo ""
echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo "   View Laravel logs:  tail -f backend/storage/logs/laravel.log"
echo "   Test API:           curl http://localhost:8001/api/courses"
echo "   Stop servers:       ./stop-local.sh (or kill processes)"
echo ""
echo -e "${YELLOW}📚 Testing Guide:${NC}"
echo "   See: FRONTEND_TEST_GUIDE.md"
echo ""
echo -e "${BLUE}🔍 Process IDs:${NC}"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop (or run: kill $BACKEND_PID $FRONTEND_PID)${NC}"
echo ""

# Save PIDs to file for easy stopping
echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"

# Open browser after a short delay
sleep 2
echo -e "${GREEN}🌐 Opening browser...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3000
fi

echo ""
echo -e "${GREEN}✨ Happy Testing!${NC}"
echo ""

# Keep script running and show logs
tail -f "$SCRIPT_DIR/backend/storage/logs/laravel.log" &
LOG_PID=$!

# Wait for interrupt
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID $LOG_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo 'Servers stopped.'; exit" INT TERM

# Keep script alive
wait

