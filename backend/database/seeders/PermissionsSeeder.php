<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class PermissionsSeeder extends Seeder
{
    public function run()
    {
        // Create permissions
        $permissions = [
            // User management
            ['name' => 'users.view', 'description' => 'View users list', 'category' => 'users'],
            ['name' => 'users.create', 'description' => 'Create new users', 'category' => 'users'],
            ['name' => 'users.edit', 'description' => 'Edit existing users', 'category' => 'users'],
            ['name' => 'users.delete', 'description' => 'Delete users', 'category' => 'users'],
            
            // Post management
            ['name' => 'posts.view', 'description' => 'View posts list', 'category' => 'posts'],
            ['name' => 'posts.create', 'description' => 'Create new posts', 'category' => 'posts'],
            ['name' => 'posts.edit', 'description' => 'Edit existing posts', 'category' => 'posts'],
            ['name' => 'posts.delete', 'description' => 'Delete posts', 'category' => 'posts'],
            ['name' => 'posts.publish', 'description' => 'Publish/unpublish posts', 'category' => 'posts'],
            
            // Workflow management
            ['name' => 'workflows.view', 'description' => 'View workflows list', 'category' => 'workflows'],
            ['name' => 'workflows.create', 'description' => 'Create new workflows', 'category' => 'workflows'],
            ['name' => 'workflows.edit', 'description' => 'Edit existing workflows', 'category' => 'workflows'],
            ['name' => 'workflows.delete', 'description' => 'Delete workflows', 'category' => 'workflows'],
            
            // Category management
            ['name' => 'categories.view', 'description' => 'View categories list', 'category' => 'categories'],
            ['name' => 'categories.create', 'description' => 'Create new categories', 'category' => 'categories'],
            ['name' => 'categories.edit', 'description' => 'Edit existing categories', 'category' => 'categories'],
            ['name' => 'categories.delete', 'description' => 'Delete categories', 'category' => 'categories'],
            
            // File management
            ['name' => 'files.view', 'description' => 'View files list', 'category' => 'files'],
            ['name' => 'files.upload', 'description' => 'Upload new files', 'category' => 'files'],
            ['name' => 'files.delete', 'description' => 'Delete files', 'category' => 'files'],
            
            // Course management
            ['name' => 'courses.view', 'description' => 'View courses list', 'category' => 'courses'],
            ['name' => 'courses.create', 'description' => 'Create new courses', 'category' => 'courses'],
            ['name' => 'courses.edit', 'description' => 'Edit existing courses', 'category' => 'courses'],
            ['name' => 'courses.delete', 'description' => 'Delete courses', 'category' => 'courses'],
            
            // Content approval
            ['name' => 'content.approve', 'description' => 'Approve content', 'category' => 'approval'],
            ['name' => 'content.reject', 'description' => 'Reject content', 'category' => 'approval'],
            
            // Analytics and reports
            ['name' => 'analytics.view', 'description' => 'View analytics dashboard', 'category' => 'analytics'],
            ['name' => 'reports.generate', 'description' => 'Generate reports', 'category' => 'analytics'],
            
            // System management
            ['name' => 'system.cache', 'description' => 'Manage system cache', 'category' => 'system'],
            ['name' => 'system.logs', 'description' => 'View system logs', 'category' => 'system'],
            ['name' => 'system.settings', 'description' => 'Manage system settings', 'category' => 'system'],
            
            // Bulk operations
            ['name' => 'bulk.operations', 'description' => 'Perform bulk operations', 'category' => 'bulk'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Create roles
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['description' => 'Full system administrator with all permissions']
        );

        $editorRole = Role::firstOrCreate(
            ['name' => 'editor'],
            ['description' => 'Content editor with limited permissions']
        );

        $authorRole = Role::firstOrCreate(
            ['name' => 'author'],
            ['description' => 'Content author with basic permissions']
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'user'],
            ['description' => 'Regular user with minimal permissions']
        );

        // Assign permissions to roles
        // Admin gets all permissions
        $adminRole->permissions()->sync(Permission::all());

        // Editor gets content management permissions
        $editorPermissions = Permission::whereIn('category', [
            'posts', 'workflows', 'categories', 'files', 'courses', 'approval'
        ])->get();
        $editorRole->permissions()->sync($editorPermissions);

        // Author gets basic content creation permissions
        $authorPermissions = Permission::whereIn('name', [
            'posts.view', 'posts.create', 'posts.edit',
            'workflows.view', 'workflows.create', 'workflows.edit',
            'files.view', 'files.upload',
            'categories.view'
        ])->get();
        $authorRole->permissions()->sync($authorPermissions);

        // User gets minimal permissions
        $userPermissions = Permission::whereIn('name', [
            'posts.view', 'workflows.view', 'categories.view', 'files.view'
        ])->get();
        $userRole->permissions()->sync($userPermissions);

        // Update existing users to use role_id
        $users = User::all();
        foreach ($users as $user) {
            if ($user->role === 'admin') {
                $user->role_id = $adminRole->id;
            } else {
                $user->role_id = $userRole->id;
            }
            $user->save();
        }
    }
}