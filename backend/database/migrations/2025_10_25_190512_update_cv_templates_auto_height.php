<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing CV templates to use auto height instead of fixed A4 height
        DB::table('cv_templates')->where('is_active', true)->get()->each(function ($template) {
            $htmlContent = $template->html_content;
            
            // Replace fixed A4 height with auto height
            $updatedContent = str_replace(
                'min-height: 842px; /* A4 height */',
                'min-height: auto; /* Auto height to avoid multiple pages */',
                $htmlContent
            );
            
            $updatedContent = str_replace(
                'min-height: 842px;',
                'min-height: auto; /* Auto height to avoid multiple pages */',
                $updatedContent
            );
            
            // Only update if content was actually changed
            if ($updatedContent !== $htmlContent) {
                DB::table('cv_templates')
                    ->where('id', $template->id)
                    ->update(['html_content' => $updatedContent]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to fixed A4 height
        DB::table('cv_templates')->where('is_active', true)->get()->each(function ($template) {
            $htmlContent = $template->html_content;
            
            // Replace auto height back to fixed A4 height
            $updatedContent = str_replace(
                'min-height: auto; /* Auto height to avoid multiple pages */',
                'min-height: 842px; /* A4 height */',
                $htmlContent
            );
            
            // Only update if content was actually changed
            if ($updatedContent !== $htmlContent) {
                DB::table('cv_templates')
                    ->where('id', $template->id)
                    ->update(['html_content' => $updatedContent]);
            }
        });
    }
};