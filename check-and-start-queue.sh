#!/bin/bash

echo "=== Checking Queue Worker Status on Production ==="
echo ""

# This script checks if the queue worker is running and starts it if not
# You can run this via GitHub Actions workflow or manually via SSH

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project directory
cd ~/naqashthaheem.com/backend

echo -e "${BLUE}Checking if queue worker is running...${NC}"
if ps aux | grep "[q]ueue:work" > /dev/null; then
  echo -e "${GREEN}✅ Queue worker is running${NC}"
  ps aux | grep "[q]ueue:work"
else
  echo -e "${RED}❌ Queue worker is NOT running${NC}"
  
  echo -e "${BLUE}Starting queue worker...${NC}"
  nohup php artisan queue:work --sleep=3 --tries=3 --max-time=3600 --timeout=120 > storage/logs/queue-worker.log 2>&1 &
  sleep 3
  
  if ps aux | grep "[q]ueue:work" > /dev/null; then
    echo -e "${GREEN}✅ Queue worker started successfully${NC}"
    ps aux | grep "[q]ueue:work"
  else
    echo -e "${RED}❌ Queue worker failed to start${NC}"
  fi
fi

echo ""
echo -e "${BLUE}Checking email queue status...${NC}"
php artisan tinker --execute="
  \$pending = \App\Models\EmailQueue::where('status', 'pending')->count();
  \$completed = \App\Models\EmailQueue::where('status', 'completed')->count();
  \$failed = \App\Models\EmailQueue::where('status', 'failed')->count();
  echo 'Pending: ' . \$pending . PHP_EOL;
  echo 'Completed: ' . \$completed . PHP_EOL;
  echo 'Failed: ' . \$failed . PHP_EOL;
"

echo ""
echo -e "${BLUE}Checking recent email logs...${NC}"
tail -20 storage/logs/laravel.log 2>/dev/null | grep -i "email\|queue\|n8n" || echo "No recent email activity"

echo ""
echo -e "${GREEN}✅ Check complete!${NC}"

