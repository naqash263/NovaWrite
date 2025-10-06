<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserResourceAccess extends Model
{
    use HasFactory;

    protected $table = 'user_resource_access';

    protected $fillable = [
        'user_id',
        'resource_type',
        'resource_id',
        'access_level',
        'is_granted',
        'granted_by',
        'granted_at',
        'expires_at',
        'notes'
    ];

    protected $casts = [
        'is_granted' => 'boolean',
        'granted_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function grantedBy()
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    public function resource()
    {
        return $this->morphTo('resource', 'resource_type', 'resource_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_granted', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForResource($query, $resourceType, $resourceId)
    {
        return $query->where('resource_type', $resourceType)
            ->where('resource_id', $resourceId);
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isActive()
    {
        return $this->is_granted && !$this->isExpired();
    }
}