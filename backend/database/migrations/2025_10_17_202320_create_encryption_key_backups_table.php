<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('encryption_key_backups', function (Blueprint $table) {
            $table->id();
            $table->string('environment')->unique();
            $table->text('key');
            $table->timestamp('backed_up_at');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('encryption_key_backups');
    }
};