<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'color',
        'default_permissions',
        'is_active'
    ];

    protected $casts = [
        'default_permissions' => 'array',
        'is_active' => 'boolean'
    ];

    public function members()
    {
        return $this->belongsToMany(User::class, 'user_group_members', 'group_id', 'user_id')
            ->withPivot(['added_by', 'joined_at'])
            ->withTimestamps();
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}