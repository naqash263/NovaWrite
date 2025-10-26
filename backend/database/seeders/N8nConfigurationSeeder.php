<?php

namespace Database\Seeders;

use App\Models\N8nConfiguration;
use Illuminate\Database\Seeder;

class N8nConfigurationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default N8n configuration
        N8nConfiguration::create([
            'name' => 'Default N8n Webhook',
            'webhook_url' => 'https://tamera-inclinable-taylor.ngrok-free.dev/webhook/sendemail',
            'webhook_timeout' => 30,
            'max_retry_attempts' => 3,
            'is_active' => true
        ]);
    }
}