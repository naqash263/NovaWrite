<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class WorkflowDownload extends Model
{
    protected $fillable = [
        'workflow_id',
        'workflow_file_id',
        'email',
        'token',
        'download_token',
        'expires_at',
        'downloaded_at',
        'ip_address',
        'user_agent',
        'marketing_opt_in',
        'user_id',
    ];

    protected $casts = [
        'downloaded_at' => 'datetime',
        'expires_at' => 'datetime',
        'marketing_opt_in' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($download) {
            $uuid = Str::uuid()->toString();
            
            // Set download_token (primary field)
            if (empty($download->download_token)) {
                $download->download_token = $uuid;
            }
            
            // Set token only if the column exists (for backward compatibility)
            if (Schema::hasColumn('workflow_downloads', 'token') && empty($download->token)) {
                $download->token = $uuid;
            }
        });
    }

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function workflowFile()
    {
        return $this->belongsTo(WorkflowFile::class);
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
