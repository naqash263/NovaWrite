#!/bin/bash

echo "=== Testing Queue System ==="
echo ""

# Check if services are running
echo "1. Checking if services are running..."
ps aux | grep "queue:work" | grep -v grep || echo "❌ Queue worker NOT running"
ps aux | grep "schedule:work" | grep -v grep || echo "❌ Scheduler NOT running"
echo ""

# Check email queue
echo "2. Checking email queue status..."
cd ~/naqashthaheem.com/backend
php artisan tinker --execute='echo "Pending: " . App\Models\EmailQueue::where("status", "pending")->count() . "\n"; echo "Processing: " . App\Models\EmailQueue::where("status", "processing")->count() . "\n"; echo "Completed: " . App\Models\EmailQueue::where("status", "completed")->count() . "\n"; echo "Failed: " . App\Models\EmailQueue::where("status", "failed")->count() . "\n";'
echo ""

# Check jobs table
echo "3. Checking Laravel jobs queue..."
php artisan tinker --execute='echo "Pending jobs: " . \DB::table("jobs")->count() . "\n"; echo "Failed jobs: " . \DB::table("failed_jobs")->count() . "\n";'
echo ""

# Check recent logs
echo "3. Checking recent logs..."
tail -20 storage/logs/laravel.log | grep -i "email\|queue\|n8n" || echo "No recent activity in logs"
echo ""

# Check for any errors
echo "4. Checking for errors..."
tail -50 storage/logs/laravel.log | grep -i "error\|warning" || echo "No errors found"
echo ""

echo "✅ Test complete!"
