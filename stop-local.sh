#!/bin/bash

# 🛑 Stop Local Development Servers

echo "🛑 Stopping NovaWrite Local Development Servers..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to kill process on port
kill_port() {
    PORT=$1
    NAME=$2
    
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}Stopping $NAME on port $PORT...${NC}"
        lsof -ti:$PORT | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ $NAME stopped${NC}"
    else
        echo -e "${RED}❌ No process found on port $PORT${NC}"
    fi
}

# Try to kill using saved PIDs first
if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid")
    echo "Killing backend PID: $BACKEND_PID"
    kill -9 $BACKEND_PID 2>/dev/null
    rm -f "$SCRIPT_DIR/.backend.pid"
fi

if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid")
    echo "Killing frontend PID: $FRONTEND_PID"
    kill -9 $FRONTEND_PID 2>/dev/null
    rm -f "$SCRIPT_DIR/.frontend.pid"
fi

# Also kill by port (in case PIDs didn't work)
kill_port 8001 "Backend"
kill_port 3000 "Frontend"

echo ""
echo -e "${GREEN}✅ All servers stopped${NC}"

