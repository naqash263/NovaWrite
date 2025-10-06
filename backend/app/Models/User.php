<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'role_id',
        'google_id',
        'avatar',
        'email_verified_at',
        'email_verification_token',
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
            'two_factor_recovery_codes' => 'array',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'enrollments')
            ->withPivot('enrolled_at', 'progress', 'completed_at')
            ->withTimestamps();
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions');
    }

    public function lessonProgress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function testAttempts()
    {
        return $this->hasMany(TestAttempt::class);
    }

    /**
     * Check if user has completed a specific lesson
     */
    public function hasCompletedLesson($lessonId)
    {
        return $this->lessonProgress()
            ->where('lesson_id', $lessonId)
            ->where('is_completed', true)
            ->exists();
    }

    /**
     * Check if user can access a lesson (previous lessons completed)
     */
    public function canAccessLesson($lessonId)
    {
        $lesson = Lesson::find($lessonId);
        if (!$lesson) return false;

        // Get all previous lessons in the same course
        $previousLessons = Lesson::where('course_id', $lesson->course_id)
            ->where('order', '<', $lesson->order)
            ->pluck('id');

        // Check if all previous lessons are completed
        foreach ($previousLessons as $prevLessonId) {
            if (!$this->hasCompletedLesson($prevLessonId)) {
                return false;
            }
        }

        return true;
    }

    public function hasPermission($permission)
    {
        // Direct permission check
        if ($this->permissions()->where('name', $permission)->exists()) {
            return true;
        }

        // Role-based permission check
        if ($this->roleModel && $this->roleModel->hasPermission($permission)) {
            return true;
        }

        // Admin has all permissions
        if ($this->isAdmin()) {
            return true;
        }

        return false;
    }

    public function givePermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->first();
        }

        if ($permission && !$this->hasPermission($permission->name)) {
            $this->permissions()->attach($permission);
        }
    }

    public function revokePermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->first();
        }

        if ($permission) {
            $this->permissions()->detach($permission);
        }
    }

    public function getAllPermissions()
    {
        $permissions = collect();
        
        // Add direct permissions
        $permissions = $permissions->merge($this->permissions);
        
        // Add role permissions
        if ($this->roleModel) {
            $permissions = $permissions->merge($this->roleModel->permissions);
        }
        
        return $permissions->unique('id');
    }

    public function groups()
    {
        return $this->belongsToMany(UserGroup::class, 'user_group_members', 'user_id', 'group_id')
            ->withPivot(['added_by', 'joined_at'])
            ->withTimestamps();
    }

    public function resourceAccess()
    {
        return $this->hasMany(UserResourceAccess::class);
    }

    public function grantedAccess()
    {
        return $this->hasMany(UserResourceAccess::class, 'granted_by');
    }

    public function addToGroup($groupId, $addedBy = null)
    {
        if (!$this->groups()->where('group_id', $groupId)->exists()) {
            $this->groups()->attach($groupId, [
                'added_by' => $addedBy,
                'joined_at' => now()
            ]);
        }
    }

    public function removeFromGroup($groupId)
    {
        $this->groups()->detach($groupId);
    }

    public function isInGroup($groupId)
    {
        return $this->groups()->where('group_id', $groupId)->exists();
    }

    public function isEnrolledIn($courseId)
    {
        return $this->enrollments()->where('course_id', $courseId)->exists();
    }

    /**
     * Check if user's email is verified
     */
    public function hasVerifiedEmail()
    {
        return !is_null($this->email_verified_at);
    }

    /**
     * Mark the given user's email as verified
     */
    public function markEmailAsVerified()
    {
        return $this->forceFill([
            'email_verified_at' => $this->freshTimestamp(),
            'email_verification_token' => null,
        ])->save();
    }

    /**
     * Generate email verification token
     */
    public function generateEmailVerificationToken()
    {
        $token = bin2hex(random_bytes(32));
        $this->forceFill([
            'email_verification_token' => $token,
        ])->save();
        return $token;
    }

    /**
     * Verify email with token
     */
    public function verifyEmailWithToken($token)
    {
        if ($this->email_verification_token === $token) {
            return $this->markEmailAsVerified();
        }
        return false;
    }
}
