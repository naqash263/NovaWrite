<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowDownload extends Model
{
    protected $fillable = [
        'workflow_id',
        'workflow_file_id',
        'email',
        'downloaded_at',
        'ip_address',
        'user_agent',
        'marketing_opt_in',
    ];

    protected $casts = [
        'downloaded_at' => 'datetime',
        'marketing_opt_in' => 'boolean',
    ];

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function workflowFile()
    {
        return $this->belongsTo(WorkflowFile::class);
    }
}
