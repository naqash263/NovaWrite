#!/bin/bash

# PostgreSQL Setup Verification Script
# This script verifies that the application is properly configured for PostgreSQL

echo "🔍 PostgreSQL Setup Verification"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: Please run this script from the Laravel application root directory"
    echo "   (where artisan file is located)"
    exit 1
fi

echo "✅ Found Laravel application"

# Check .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Please ensure your production .env file is configured"
    exit 1
fi

echo "✅ Found .env file"

# Check database configuration
echo "🔍 Checking database configuration..."

DB_CONNECTION=$(grep "^DB_CONNECTION=" .env | cut -d'=' -f2)
DB_HOST=$(grep "^DB_HOST=" .env | cut -d'=' -f2)
DB_PORT=$(grep "^DB_PORT=" .env | cut -d'=' -f2)
DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d'=' -f2)
DB_USERNAME=$(grep "^DB_USERNAME=" .env | cut -d'=' -f2)

echo "  - DB_CONNECTION: $DB_CONNECTION"
echo "  - DB_HOST: $DB_HOST"
echo "  - DB_PORT: $DB_PORT"
echo "  - DB_DATABASE: $DB_DATABASE"
echo "  - DB_USERNAME: $DB_USERNAME"

if [ "$DB_CONNECTION" != "pgsql" ]; then
    echo "❌ Error: Database connection is not set to PostgreSQL"
    echo "   Please set DB_CONNECTION=pgsql in your .env file"
    exit 1
fi

echo "✅ Database connection is set to PostgreSQL"

# Test database connection
echo "🔄 Testing database connection..."
php artisan tinker --execute="
    try {
        \$connection = DB::connection()->getPdo();
        echo 'Database connection: SUCCESS';
        echo 'Driver: ' . DB::connection()->getDriverName();
        echo 'Database: ' . DB::connection()->getDatabaseName();
    } catch (Exception \$e) {
        echo 'Database connection: ERROR - ' . \$e->getMessage();
        exit(1);
    }
"

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check if PostgreSQL extensions are available
echo "🔍 Checking PostgreSQL extensions..."
php artisan tinker --execute="
    try {
        \$extensions = ['pdo_pgsql', 'pgsql'];
        foreach (\$extensions as \$ext) {
            if (!extension_loaded(\$ext)) {
                echo 'Missing extension: ' . \$ext;
                exit(1);
            }
        }
        echo 'All required PostgreSQL extensions are loaded';
    } catch (Exception \$e) {
        echo 'Extension check failed: ' . \$e->getMessage();
        exit(1);
    }
"

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL extensions are available"
else
    echo "❌ PostgreSQL extensions are missing"
    exit 1
fi

# Check migration status
echo "🔍 Checking migration status..."
php artisan migrate:status

echo ""
echo "🎉 PostgreSQL setup verification completed!"
echo ""
echo "Next steps:"
echo "1. Run the fresh database migration"
echo "2. Test all API endpoints"
echo "3. Verify admin panel functionality"
