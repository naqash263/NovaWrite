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
        if (!Schema::hasTable('email_unsubscribes')) {
            Schema::create('email_unsubscribes', function (Blueprint $table) {
                $table->id();
                $table->string('email')->index();
                $table->string('token')->unique(); // For unsubscribe links
                $table->json('unsubscribed_types')->nullable(); // Array of email types to unsubscribe from
                $table->boolean('unsubscribe_all')->default(false); // Unsubscribe from all emails
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                $table->timestamp('unsubscribed_at')->useCurrent();
                $table->timestamps();
                
                $table->index('email');
                $table->index('token');
                $table->index('user_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_unsubscribes');
    }
};
