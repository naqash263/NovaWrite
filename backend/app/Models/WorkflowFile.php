<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowFile extends Model
{
    protected $fillable = [
        'workflow_id',
        'file_id',
        'display_name',
        'description',
        'is_active',
        'sort_order',
        'download_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'download_count' => 'integer',
        'sort_order' => 'integer',
    ];

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function file()
    {
        return $this->belongsTo(File::class);
    }

    public function downloads()
    {
        return $this->hasMany(WorkflowDownload::class);
    }

    public function incrementDownloads()
    {
        $this->increment('download_count');
    }
}
