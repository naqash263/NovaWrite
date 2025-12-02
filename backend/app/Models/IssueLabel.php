<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueLabel extends Model
{
    protected $fillable = [
        'name',
        'color',
        'description',
    ];

    /**
     * Scope: Order by name
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('name');
    }
}
