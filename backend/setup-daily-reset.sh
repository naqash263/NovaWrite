#!/bin/bash

# Setup daily reset for AI credits
echo "Setting up daily AI credits reset..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESET_SCRIPT="$SCRIPT_DIR/reset-ai-credits.php"

# Create a cron job to run daily at midnight
(crontab -l 2>/dev/null; echo "0 0 * * * cd $SCRIPT_DIR && php $RESET_SCRIPT >> /tmp/ai-credits-reset.log 2>&1") | crontab -

echo "✅ Daily reset scheduled!"
echo "The AI credits will be reset daily at midnight UTC"
echo "Logs will be written to /tmp/ai-credits-reset.log"

# Test the reset script
echo ""
echo "Testing reset script..."
php "$RESET_SCRIPT"


