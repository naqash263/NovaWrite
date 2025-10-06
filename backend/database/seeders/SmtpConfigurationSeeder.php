<?php

namespace Database\Seeders;

use App\Models\SmtpConfiguration;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SmtpConfigurationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default SMTP configuration for naqashthaheem.com
        SmtpConfiguration::updateOrCreate(
            ['name' => 'default'],
            [
                'name' => 'default',
                'mailer' => 'smtp',
                'host' => 'mail.naqashthaheem.com',
                'port' => 587,
                'username' => 'noreply@naqashthaheem.com',
                'password' => 'your_smtp_password_here', // This will be encrypted automatically
                'encryption' => 'tls',
                'from_address' => 'noreply@naqashthaheem.com',
                'from_name' => 'NovaWrite',
                'is_active' => true,
                'is_default' => true,
                'description' => 'Default SMTP configuration for naqashthaheem.com domain',
            ]
        );

        // Create a backup configuration (inactive)
        SmtpConfiguration::updateOrCreate(
            ['name' => 'backup'],
            [
                'name' => 'backup',
                'mailer' => 'smtp',
                'host' => 'smtp.gmail.com',
                'port' => 587,
                'username' => 'your_backup_email@gmail.com',
                'password' => 'your_backup_password',
                'encryption' => 'tls',
                'from_address' => 'your_backup_email@gmail.com',
                'from_name' => 'NovaWrite Backup',
                'is_active' => false,
                'is_default' => false,
                'description' => 'Backup SMTP configuration using Gmail',
            ]
        );
    }
}
