<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Add indexes for posts table (only if they don't exist)
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                if (!$this->indexExists('posts', 'posts_published_index')) {
                    $table->index(['is_published', 'published_at'], 'posts_published_index');
                }
                if (!$this->indexExists('posts', 'posts_category_published_index')) {
                    $table->index(['category_id', 'is_published'], 'posts_category_published_index');
                }
                if (!$this->indexExists('posts', 'posts_user_published_index')) {
                    $table->index(['user_id', 'is_published'], 'posts_user_published_index');
                }
                if (!$this->indexExists('posts', 'posts_views_index')) {
                    $table->index('views', 'posts_views_index');
                }
                if (!$this->indexExists('posts', 'posts_created_at_index')) {
                    $table->index('created_at', 'posts_created_at_index');
                }
                if (!$this->indexExists('posts', 'posts_approval_status_index')) {
                    $table->index('approval_status', 'posts_approval_status_index');
                }
            });
        }

        // Add indexes for workflows table (only if they don't exist)
        if (Schema::hasTable('workflows')) {
            Schema::table('workflows', function (Blueprint $table) {
                if (!$this->indexExists('workflows', 'workflows_status_created_index')) {
                    $table->index(['status', 'created_at'], 'workflows_status_created_index');
                }
                if (!$this->indexExists('workflows', 'workflows_category_status_index')) {
                    $table->index(['workflow_category_id', 'status'], 'workflows_category_status_index');
                }
                if (!$this->indexExists('workflows', 'workflows_user_status_index')) {
                    $table->index(['created_by', 'status'], 'workflows_user_status_index');
                }
                if (!$this->indexExists('workflows', 'workflows_approval_status_index')) {
                    $table->index(['approval_status', 'status'], 'workflows_approval_status_index');
                }
            });
        }

        // Add indexes for users table (only if they don't exist)
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!$this->indexExists('users', 'users_role_index')) {
                    $table->index('role', 'users_role_index');
                }
                if (!$this->indexExists('users', 'users_created_at_index')) {
                    $table->index('created_at', 'users_created_at_index');
                }
            });
        }

        // Add indexes for categories table (only if they don't exist)
        if (Schema::hasTable('categories')) {
            Schema::table('categories', function (Blueprint $table) {
                if (!$this->indexExists('categories', 'categories_slug_index')) {
                    $table->index('slug', 'categories_slug_index');
                }
            });
        }

        // Add indexes for workflow_categories table (only if they don't exist)
        if (Schema::hasTable('workflow_categories')) {
            Schema::table('workflow_categories', function (Blueprint $table) {
                if (!$this->indexExists('workflow_categories', 'workflow_categories_slug_index')) {
                    $table->index('slug', 'workflow_categories_slug_index');
                }
            });
        }
    }

    private function indexExists($table, $index)
    {
        $indexes = DB::select("PRAGMA index_list($table)");
        foreach ($indexes as $idx) {
            if ($idx->name === $index) {
                return true;
            }
        }
        return false;
    }

    public function down()
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_published_index');
            $table->dropIndex('posts_category_published_index');
            $table->dropIndex('posts_user_published_index');
            $table->dropIndex('posts_views_index');
            $table->dropIndex('posts_created_at_index');
            $table->dropIndex('posts_approval_status_index');
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->dropIndex('workflows_status_created_index');
            $table->dropIndex('workflows_category_status_index');
            $table->dropIndex('workflows_user_status_index');
            $table->dropIndex('workflows_approval_status_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_index');
            $table->dropIndex('users_created_at_index');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('categories_slug_index');
        });

        Schema::table('workflow_categories', function (Blueprint $table) {
            $table->dropIndex('workflow_categories_slug_index');
        });
    }
};