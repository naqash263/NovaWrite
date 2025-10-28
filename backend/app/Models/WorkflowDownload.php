<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WorkflowDownload extends Model
{
    protected $fillable = [
        'workflow_id',
        'workflow_file_id',
        'email',
        'token',
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
            if (empty($download->token)) {
                $download->token = Str::uuid()->toString();
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
