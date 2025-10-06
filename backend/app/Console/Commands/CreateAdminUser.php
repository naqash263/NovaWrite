<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create-user {email} {password} {name?}';
    protected $description = 'Create an admin user';

    public function handle()
    {
        $email = $this->argument('email');
        $password = $this->argument('password');
        $name = $this->argument('name') ?: 'Admin User';

        // Check if user already exists
        $existingUser = User::where('email', $email)->first();
        
        if ($existingUser) {
            $this->info("User with email {$email} already exists. Updating to admin role...");
            $existingUser->update([
                'role' => 'admin',
                'password' => Hash::make($password),
                'name' => $name
            ]);
            $this->info("User updated successfully!");
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin'
            ]);
            $this->info("Admin user created successfully!");
            $this->info("Email: {$user->email}");
            $this->info("Name: {$user->name}");
        }

        return 0;
    }
}