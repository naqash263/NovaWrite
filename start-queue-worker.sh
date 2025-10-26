#!/bin/bash
# Start Laravel Queue Worker Script
# This script starts the queue worker in the background

cd ~/naqashthaheem.com/backend || exit 1

echo "Stopping any existing queue workers..."
pkill -f "artisan queue:work" || true

echo "Starting queue worker in background..."
nohup php artisan queue:work \
    --sleep=3 \
    --tries=3 \
    --max-time=3600 \
    --timeout=120 \
    > storage/logs/queue-worker.log 2>&1 &

sleep 2

echo "Queue worker started!"
ps aux | grep "queue:work" | grep -v grep

echo ""
echo "To check logs: tail -f storage/logs/queue-worker.log"
echo "To stop: pkill -f 'artisan queue:work'"

