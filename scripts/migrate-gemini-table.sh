#!/bin/bash

# Gemini API Keys Table Migration Script
# This script creates the gemini_api_keys table on production

echo "🔧 Gemini API Keys Table Migration Script"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: Please run this script from the Laravel application root directory"
    echo "   (where artisan file is located)"
    exit 1
fi

echo "✅ Found Laravel application"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Please ensure your production .env file is configured"
    exit 1
fi

echo "✅ Found .env file"

# Check if gemini_api_keys table already exists
echo "🔍 Checking if gemini_api_keys table exists..."
TABLE_EXISTS=$(php artisan tinker --execute="echo DB::select(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gemini_api_keys')\")[0]->exists ? 'true' : 'false';")

if [ "$TABLE_EXISTS" = "true" ]; then
    echo "✅ gemini_api_keys table already exists"
    
    # Get table count
    COUNT=$(php artisan tinker --execute="echo DB::table('gemini_api_keys')->count();")
    echo "📊 Records in table: $COUNT"
    
    if [ "$COUNT" -gt 0 ]; then
        echo "📝 Existing API keys:"
        php artisan tinker --execute="
            \$keys = DB::table('gemini_api_keys')->select('id', 'name', 'is_active', 'used_requests', 'total_requests')->get();
            foreach(\$keys as \$key) {
                echo '  - ID: ' . \$key->id . ', Name: ' . \$key->name . ', Active: ' . (\$key->is_active ? 'Yes' : 'No') . ', Usage: ' . \$key->used_requests . '/' . \$key->total_requests . PHP_EOL;
            }
        "
    fi
else
    echo "❌ gemini_api_keys table does not exist"
    echo "🔧 Creating gemini_api_keys table..."
    
    # Run the specific migration
    php artisan migrate --path=database/migrations/2025_10_09_234758_create_gemini_api_keys_table.php --force
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration completed successfully"
        
        # Insert a sample API key
        echo "🔧 Inserting sample API key..."
        php artisan tinker --execute="
            \$sampleKey = 'AIzaSyDummyKeyReplaceWithYourActualKey123456789';
            DB::table('gemini_api_keys')->insert([
                'name' => 'admin',
                'api_key' => encrypt(\$sampleKey),
                'max_requests' => 100,
                'total_requests' => 100,
                'used_requests' => 0,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            echo 'Sample API key inserted successfully';
        "
        
        if [ $? -eq 0 ]; then
            echo "✅ Sample API key inserted"
        else
            echo "⚠️  Sample API key insertion failed, but table was created"
        fi
    else
        echo "❌ Migration failed"
        exit 1
    fi
fi

# Clear and cache configurations
echo "🔄 Clearing and caching configurations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

if [ $? -eq 0 ]; then
    echo "✅ Configuration caching completed"
else
    echo "⚠️  Configuration caching had issues, but migration was successful"
fi

# Test database connection
echo "🔄 Testing database connection..."
php artisan tinker --execute="
    try {
        \$count = DB::table('gemini_api_keys')->count();
        echo 'Database test: SUCCESS - gemini_api_keys table has ' . \$count . ' records';
    } catch (Exception \$e) {
        echo 'Database test: ERROR - ' . \$e->getMessage();
    }
"

echo ""
echo "🎉 Migration process completed!"
echo ""
echo "Next steps:"
echo "1. Test the API endpoint: https://naqashthaheem.com/api/admin/gemini-api-keys"
echo "2. Check the admin panel functionality"
echo "3. Replace the sample API key with your actual Gemini API key"
echo "4. Test all Gemini API functionality"
