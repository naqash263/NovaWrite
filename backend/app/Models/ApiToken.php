<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ApiToken extends Model
{
    protected $fillable = [
        'name',
        'token',
        'permissions',
        'last_used_at',
        'expires_at',
        'user_id',
    ];

    protected $casts = [
        'permissions' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $hidden = [
        'token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }

    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions ?? []);
    }

    public function canAccess(string $resource, string $action = 'read'): bool
    {
        // Admin permission grants access to everything
        if ($this->hasPermission('admin')) {
            return true;
        }

        // Check specific permissions
        $requiredPermission = $action === 'read' ? 'read' : $action;
        return $this->hasPermission($requiredPermission);
    }
}
