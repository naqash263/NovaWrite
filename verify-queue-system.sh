#!/bin/bash

echo "=== Verifying Queue System ==="
echo ""

# Check if processes are running
echo "1. Checking if queue worker and scheduler are running..."
cd ~/naqashthaheem.com/backend

if ps aux | grep "[q]ueue:work" > /dev/null; then
  echo "✅ Queue worker is running"
  ps aux | grep "[q]ueue:work"
else
  echo "❌ Queue worker is NOT running"
fi

echo ""

if ps aux | grep "[s]chedule:work" > /dev/null; then
  echo "✅ Scheduler is running"
  ps aux | grep "[s]chedule:work"
else
  echo "❌ Scheduler is NOT running"
fi

echo ""

# Check email queue status
echo "2. Checking email queue status..."
php artisan tinker --execute="
\$pending = \DB::table('email_queue')->where('status', 'pending')->count();
\$processing = \DB::table('email_queue')->where('status', 'processing')->count();
\$completed = \DB::table('email_queue')->where('status', 'completed')->count();
\$failed = \DB::table('email_queue')->where('status', 'failed')->count();
echo 'Pending: ' . \$pending . PHP_EOL;
echo 'Processing: ' . \$processing . PHP_EOL;
echo 'Completed: ' . \$completed . PHP_EOL;
echo 'Failed: ' . \$failed . PHP_EOL;
"

echo ""
echo "3. Recent password reset emails:"
php artisan tinker --execute="
\$recent = \DB::table('email_queue')->where('action', 'password_reset')->orderBy('created_at', 'desc')->limit(5)->get(['action', 'recipient_email', 'status', 'created_at']);
foreach (\$recent as \$email) {
    echo \$email->action . ' | ' . \$email->recipient_email . ' | ' . \$email->status . ' | ' . \$email->created_at . PHP_EOL;
}
"

