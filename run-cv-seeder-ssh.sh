#!/bin/bash

# This script connects to the production server via SSH and runs the CV template seeder

# SSH credentials
SSH_HOST="162.254.39.126"
SSH_PORT="21098"
SSH_USER="timesovh"

# Check if password is provided
if [ -z "$1" ]; then
  echo "Error: SSH password is required"
  echo "Usage: $0 <ssh_password>"
  exit 1
fi

SSH_PASS="$1"

# Command to run on the server
REMOTE_CMD="cd ~/naqashthaheem.com/backend && php artisan db:seed --class=CvTemplateSeeder --force"

# Use sshpass to provide password non-interactively
# Note: You need to have sshpass installed (brew install hudochenkov/sshpass/sshpass)
echo "Connecting to production server and running CV template seeder..."
sshpass -p "$SSH_PASS" ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "$REMOTE_CMD"

echo "CV template seeder has been executed on production server."
