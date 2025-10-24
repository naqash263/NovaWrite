<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_email_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('system_email_settings')->insert([
            [
                'key' => 'password_reset_smtp_id',
                'value' => null,
                'description' => 'SMTP configuration ID for password reset emails',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'welcome_email_smtp_id',
                'value' => null,
                'description' => 'SMTP configuration ID for welcome emails',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'notification_smtp_id',
                'value' => null,
                'description' => 'SMTP configuration ID for notification emails',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'default_smtp_id',
                'value' => null,
                'description' => 'Default SMTP configuration ID for system emails',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_email_settings');
    }
};