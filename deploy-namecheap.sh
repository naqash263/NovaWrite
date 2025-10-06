#!/bin/bash

# NovaWrite Deployment Script for Namecheap Stellar Plus
# This script deploys the complete NovaWrite application to your Namecheap hosting

set -e  # Exit on any error

echo "🚀 Starting NovaWrite Deployment to Namecheap..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="naqashthaheem.com"
BACKEND_DIR="api"
FRONTEND_DIR="dist"
SITE_FOLDER="naqashthaheem.com"
MAIN_FOLDER="/naqashthaheem.com"

# Database Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="timesovh_naqashthaheem"
DB_USER="timesovh_naqash_thaheem"
DB_PASS="mg08.Rcrld}N"

# Email Configuration
MAIL_HOST="naqashthaheem.com"
MAIL_PORT="465"
MAIL_USER="contact@naqashthaheem.com"
MAIL_PASS="aeQi*(M99Hf"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Backend Directory: $BACKEND_DIR"
echo "Frontend Directory: $FRONTEND_DIR"
echo "Database: $DB_NAME"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Build Frontend
echo -e "${BLUE}🔨 Step 1: Building Frontend...${NC}"
cd frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

# Build for production
print_status "Building React application..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Frontend build failed! dist directory not found."
    exit 1
fi

print_status "Frontend build completed successfully!"

# Step 2: Prepare Backend
echo -e "${BLUE}🔧 Step 2: Preparing Backend...${NC}"
cd ../backend

# Install dependencies
print_status "Installing backend dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Copy production environment file
print_status "Setting up production environment..."
cp ../production.env .env

# Generate application key
print_status "Generating application key..."
php artisan key:generate --force

# Step 3: Database Setup (Skip for deployment preparation)
echo -e "${BLUE}🗄️  Step 3: Preparing Database Configuration...${NC}"

print_status "Database configuration prepared for Namecheap hosting..."
print_warning "Database migrations and seeding will be done after upload to Namecheap"

# Step 4: Optimize Application
echo -e "${BLUE}⚡ Step 4: Optimizing Application...${NC}"

# Clear caches (skip database-dependent operations)
print_status "Clearing application caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Cache for production (skip database-dependent operations)
print_status "Caching for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 5: Create Deployment Structure
echo -e "${BLUE}📁 Step 5: Creating Deployment Structure...${NC}"

# Create deployment directory
DEPLOY_DIR="../deployment"
mkdir -p $DEPLOY_DIR/$SITE_FOLDER

# Copy backend files
print_status "Copying backend files..."
mkdir -p $DEPLOY_DIR/$SITE_FOLDER/$BACKEND_DIR
cp -r app bootstrap config database routes storage vendor artisan composer.json composer.lock .env $DEPLOY_DIR/$SITE_FOLDER/$BACKEND_DIR/

# Copy frontend build
print_status "Copying frontend build..."
cp -r ../frontend/dist/* $DEPLOY_DIR/$SITE_FOLDER/

# Create .htaccess for backend
print_status "Creating .htaccess for API..."
mkdir -p $DEPLOY_DIR/$SITE_FOLDER/$BACKEND_DIR/public
cat > $DEPLOY_DIR/$SITE_FOLDER/$BACKEND_DIR/public/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
EOF

# Create .htaccess for frontend
print_status "Creating .htaccess for frontend..."
cat > $DEPLOY_DIR/$SITE_FOLDER/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle Angular and React Router
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteRule . /index.html [L]
    
    # API routes
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^api/(.*)$ /api/public/index.php [L,QSA]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
EOF

# Step 6: Create Upload Instructions
echo -e "${BLUE}📤 Step 6: Creating Upload Instructions...${NC}"

cat > $DEPLOY_DIR/UPLOAD_INSTRUCTIONS.md << EOF
# NovaWrite Upload Instructions for Namecheap

## Files to Upload

Upload these files to your Namecheap hosting:

### 1. Main Folder Structure
- Your main folder is \`naqashthaheem.com\` (not public_html)
- Upload everything from the \`naqashthaheem.com/\` folder to your \`naqashthaheem.com/\` directory

### 2. Frontend Files (to naqashthaheem.com/)
- Upload all frontend files to the root of \`naqashthaheem.com/\`
- This includes: index.html, assets/, images/, .htaccess, etc.

### 3. Backend Files (to naqashthaheem.com/api/)
- Upload everything from the \`naqashthaheem.com/api/\` folder to \`naqashthaheem.com/api/\`
- This includes: app/, bootstrap/, config/, database/, routes/, storage/, vendor/, etc.

## Final Structure
\`\`\`
naqashthaheem.com/
├── .htaccess
├── index.html
├── assets/
├── images/
└── api/
    ├── app/
    ├── bootstrap/
    ├── config/
    ├── database/
    ├── routes/
    ├── storage/
    ├── vendor/
    ├── artisan
    ├── composer.json
    ├── composer.lock
    └── .env
\`\`\`

## After Upload
1. Set proper permissions (755 for directories, 644 for files)
2. Make sure storage/ directory is writable (755)
3. Test the application at https://naqashthaheem.com
4. Test API at https://naqashthaheem.com/api

## Troubleshooting
- Check error logs in cPanel
- Verify database connection
- Test email functionality
- Check file permissions
EOF

# Step 7: Create Test Script
print_status "Creating test script..."
cat > $DEPLOY_DIR/$SITE_FOLDER/test-deployment.php << 'EOF'
<?php
// Test script for deployed application
echo "<h1>NovaWrite Deployment Test</h1>";
echo "<p>Domain: " . $_SERVER['HTTP_HOST'] . "</p>";
echo "<p>Time: " . date('Y-m-d H:i:s') . "</p>";

// Test database connection
try {
    $pdo = new PDO("pgsql:host=localhost;port=5432;dbname=timesovh_naqashthaheem", "timesovh_naqash_thaheem", "mg08.Rcrld}N");
    echo "<p style='color: green;'>✅ Database connection successful!</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Database connection failed: " . $e->getMessage() . "</p>";
}

// Test email configuration
$mail_host = 'naqashthaheem.com';
$mail_port = 465;
$connection = @fsockopen($mail_host, $mail_port, $errno, $errstr, 30);
if ($connection) {
    fclose($connection);
    echo "<p style='color: green;'>✅ Email server reachable!</p>";
} else {
    echo "<p style='color: red;'>❌ Email server not reachable: $errstr ($errno)</p>";
}

echo "<p><strong>Delete this file after testing for security!</strong></p>";
?>
EOF

# Step 8: Summary
echo -e "${BLUE}📊 Step 8: Deployment Summary...${NC}"
echo ""
print_status "Deployment preparation completed!"
echo ""
echo -e "${YELLOW}📁 Deployment files created in: $DEPLOY_DIR${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Upload files from $DEPLOY_DIR/$SITE_FOLDER to your Namecheap hosting"
echo "2. Follow the instructions in $DEPLOY_DIR/UPLOAD_INSTRUCTIONS.md"
echo "3. Test your deployment at https://naqashthaheem.com"
echo "4. Test API at https://naqashthaheem.com/api"
echo "5. Run the test script: https://naqashthaheem.com/test-deployment.php"
echo ""
echo -e "${GREEN}🎉 Your NovaWrite application is ready for deployment!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember to delete test files after deployment for security!${NC}"
