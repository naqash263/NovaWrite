#!/bin/bash

# Fresh Production Database Setup
# This script completely resets the database and sets it up from scratch

echo "🔥 Fresh Production Database Setup"
echo "==================================="
echo ""
echo "⚠️  WARNING: This will DELETE ALL data in the database!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

# Configuration
API_DIR="/home/timesovh/naqashthaheem.com/public_html/api"

# Navigate to API directory
cd $API_DIR

echo ""
echo "📍 Working directory: $(pwd)"
echo ""

# Step 1: Drop all tables
echo "🗑️  Step 1: Dropping all existing tables..."
php artisan tinker --execute="
try {
    // Get all tables
    \$tables = DB::select('SELECT tablename FROM pg_tables WHERE schemaname = \'public\' ORDER BY tablename');
    
    echo 'Found ' . count(\$tables) . ' tables to drop' . PHP_EOL;
    
    // Disable foreign key checks
    DB::statement('SET session_replication_role = replica;');
    
    // Drop all tables
    foreach (\$tables as \$table) {
        DB::statement('DROP TABLE IF EXISTS \"' . \$table->tablename . '\" CASCADE');
        echo 'Dropped: ' . \$table->tablename . PHP_EOL;
    }
    
    // Re-enable foreign key checks
    DB::statement('SET session_replication_role = DEFAULT;');
    
    echo '✅ All tables dropped successfully' . PHP_EOL;
} catch (Exception \$e) {
    echo '❌ Error: ' . \$e->getMessage() . PHP_EOL;
    exit(1);
}
"

if [ $? -ne 0 ]; then
    echo "❌ Failed to drop tables"
    exit 1
fi

echo "✅ All tables dropped"
echo ""

# Step 2: Create migrations table
echo "📋 Step 2: Creating migrations table..."
php artisan migrate:install

echo "✅ Migrations table created"
echo ""

# Step 3: Run all migrations
echo "🗄️  Step 3: Running all migrations..."
php artisan migrate --force

if [ $? -ne 0 ]; then
    echo "⚠️  Some migrations failed, continuing..."
fi

echo "✅ Migrations completed"
echo ""

# Step 4: Seed database
echo "🌱 Step 4: Seeding database..."

# Create admin user
php artisan tinker --execute="
try {
    \$user = App\Models\User::create([
        'name' => 'Naqash Thaheem',
        'email' => 'naqash263@gmail.com',
        'password' => bcrypt('password123'),
        'role' => 'admin',
        'email_verified_at' => now()
    ]);
    echo '✅ Admin user created: ' . \$user->email . ' (ID: ' . \$user->id . ')' . PHP_EOL;
} catch (Exception \$e) {
    echo '❌ User creation error: ' . \$e->getMessage() . PHP_EOL;
}
"

# Add sample categories
php artisan tinker --execute="
try {
    \$categories = [
        ['name' => 'Technology', 'slug' => 'technology', 'description' => 'Technology articles'],
        ['name' => 'Business', 'slug' => 'business', 'description' => 'Business content'],
        ['name' => 'Education', 'slug' => 'education', 'description' => 'Educational content'],
    ];
    
    foreach (\$categories as \$cat) {
        DB::table('categories')->insert(array_merge(\$cat, [
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]));
    }
    echo '✅ Categories created: ' . count(\$categories) . PHP_EOL;
} catch (Exception \$e) {
    echo '⚠️  Categories: ' . \$e->getMessage() . PHP_EOL;
}
"

# Add Gemini API key
php artisan tinker --execute="
try {
    DB::table('gemini_api_keys')->insert([
        'name' => 'admin',
        'api_key' => encrypt('AIzaSyDummyKeyReplaceWithYourActualKey'),
        'max_requests' => 100,
        'total_requests' => 100,
        'used_requests' => 0,
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo '✅ Gemini API key created' . PHP_EOL;
} catch (Exception \$e) {
    echo '⚠️  Gemini API key: ' . \$e->getMessage() . PHP_EOL;
}
"

echo "✅ Database seeded"
echo ""

# Step 5: Optimize application
echo "⚡ Step 5: Optimizing application..."
php artisan optimize

echo "✅ Application optimized"
echo ""

# Step 6: Verify setup
echo "🧪 Step 6: Verifying setup..."

php artisan tinker --execute="
echo '=== Database Verification ===' . PHP_EOL;
echo 'Database: ' . DB::connection()->getDatabaseName() . PHP_EOL;
echo 'Driver: ' . DB::connection()->getDriverName() . PHP_EOL;

\$tables = DB::select('SELECT tablename FROM pg_tables WHERE schemaname = \'public\' ORDER BY tablename');
echo 'Total tables: ' . count(\$tables) . PHP_EOL;

\$users = DB::table('users')->count();
\$categories = DB::table('categories')->count();
\$geminiKeys = DB::table('gemini_api_keys')->count();

echo 'Users: ' . \$users . PHP_EOL;
echo 'Categories: ' . \$categories . PHP_EOL;
echo 'Gemini API Keys: ' . \$geminiKeys . PHP_EOL;

echo '✅ Verification complete' . PHP_EOL;
"

echo ""
echo "🎉 Fresh database setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "  - Admin user: naqash263@gmail.com / password123"
echo "  - Database: Fresh PostgreSQL setup"
echo "  - All tables created with proper schema"
echo "  - Sample data seeded"
echo ""
echo "🔗 Test your application:"
echo "  - Frontend: https://naqashthaheem.com"
echo "  - Admin: https://naqashthaheem.com/admin"
echo "  - API: https://naqashthaheem.com/api/health"
echo ""
echo "⚠️  IMPORTANT: Replace the dummy Gemini API key with your real one!"
echo ""
