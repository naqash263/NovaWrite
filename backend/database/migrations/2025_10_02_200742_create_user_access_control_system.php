<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Create user_resource_access table for granular access control (only if it doesn't exist)
        if (!Schema::hasTable('user_resource_access')) {
            Schema::create('user_resource_access', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('resource_type'); // 'workflow', 'course', 'post', etc.
                $table->unsignedBigInteger('resource_id');
                $table->enum('access_level', ['view', 'edit', 'full'])->default('view');
                $table->boolean('is_granted')->default(true);
                $table->unsignedBigInteger('granted_by')->nullable();
                $table->timestamp('granted_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('granted_by')->references('id')->on('users')->onDelete('set null');
                
                // Unique constraint to prevent duplicate access records
                $table->unique(['user_id', 'resource_type', 'resource_id'], 'unique_user_resource_access');
                
                // Indexes for performance
                $table->index(['user_id', 'resource_type']);
                $table->index(['resource_type', 'resource_id']);
                $table->index('access_level');
                $table->index('is_granted');
            });
        }

        // Create user_groups table for easier management (only if it doesn't exist)
        if (!Schema::hasTable('user_groups')) {
            Schema::create('user_groups', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('description')->nullable();
                $table->string('color', 7)->default('#3B82F6'); // Hex color for UI
                $table->json('default_permissions')->nullable(); // Default permissions for group members
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Create user_group_members table (only if it doesn't exist)
        if (!Schema::hasTable('user_group_members')) {
            Schema::create('user_group_members', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('group_id');
                $table->unsignedBigInteger('added_by')->nullable();
                $table->timestamp('joined_at')->default(now());
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('group_id')->references('id')->on('user_groups')->onDelete('cascade');
                $table->foreign('added_by')->references('id')->on('users')->onDelete('set null');
                
                $table->unique(['user_id', 'group_id']);
            });
        }

        // Add access control fields to existing tables (only if columns don't exist)
        if (Schema::hasTable('workflows') && !Schema::hasColumn('workflows', 'access_level')) {
            Schema::table('workflows', function (Blueprint $table) {
                $table->enum('access_level', ['public', 'restricted', 'private'])->default('public')->after('status');
                $table->json('allowed_user_ids')->nullable()->after('access_level');
                $table->json('allowed_group_ids')->nullable()->after('allowed_user_ids');
            });
        }

        if (Schema::hasTable('courses') && !Schema::hasColumn('courses', 'access_level')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->enum('access_level', ['public', 'restricted', 'private'])->default('public')->after('is_published');
                $table->json('allowed_user_ids')->nullable()->after('access_level');
                $table->json('allowed_group_ids')->nullable()->after('allowed_user_ids');
            });
        }

        if (Schema::hasTable('posts') && !Schema::hasColumn('posts', 'access_level')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->enum('access_level', ['public', 'restricted', 'private'])->default('public')->after('is_published');
                $table->json('allowed_user_ids')->nullable()->after('access_level');
                $table->json('allowed_group_ids')->nullable()->after('allowed_user_ids');
            });
        }
    }

    public function down()
    {
        // Remove added columns
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['access_level', 'allowed_user_ids', 'allowed_group_ids']);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['access_level', 'allowed_user_ids', 'allowed_group_ids']);
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->dropColumn(['access_level', 'allowed_user_ids', 'allowed_group_ids']);
        });

        // Drop new tables
        Schema::dropIfExists('user_group_members');
        Schema::dropIfExists('user_groups');
        Schema::dropIfExists('user_resource_access');
    }
};