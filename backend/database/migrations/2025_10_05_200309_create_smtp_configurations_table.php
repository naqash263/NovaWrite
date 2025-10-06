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
        Schema::create('smtp_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Configuration name (e.g., 'default', 'backup')
            $table->string('mailer')->default('smtp'); // smtp, sendmail, etc.
            $table->string('host'); // SMTP host
            $table->integer('port')->default(587); // SMTP port
            $table->string('username'); // SMTP username
            $table->text('password'); // SMTP password (encrypted)
            $table->string('encryption')->nullable(); // tls, ssl, or null
            $table->string('from_address'); // From email address
            $table->string('from_name'); // From name
            $table->boolean('is_active')->default(false); // Only one can be active
            $table->boolean('is_default')->default(false); // Default configuration
            $table->text('description')->nullable(); // Configuration description
            $table->json('settings')->nullable(); // Additional settings
            $table->timestamp('last_tested_at')->nullable(); // Last test timestamp
            $table->boolean('test_successful')->nullable(); // Last test result
            $table->text('test_error')->nullable(); // Last test error message
            $table->timestamps();
            
            $table->index(['is_active', 'is_default']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('smtp_configurations');
    }
};
