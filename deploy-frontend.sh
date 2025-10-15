#!/bin/bash

# Deploy Frontend to Production
echo "🚀 Deploying Frontend to Production..."

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Copy files to production server
echo "📤 Uploading files to production server..."

# Create a temporary directory for upload
TEMP_DIR="/tmp/naqashthaheem-frontend-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy dist contents to temp directory
cp -r frontend/dist/* "$TEMP_DIR/"

# Upload to production server
echo "Uploading files..."
rsync -avz --delete "$TEMP_DIR/" timesovh@naqashthaheem.com:~/naqashthaheem.com/public_html/

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo "✅ Frontend deployment completed!"
echo "🌐 Visit: https://naqashthaheem.com/admin/monitoring"
