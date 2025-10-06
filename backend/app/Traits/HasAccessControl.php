<?php

namespace App\Traits;

use App\Models\User;
use App\Models\UserGroup;
use App\Models\UserResourceAccess;

trait HasAccessControl
{
    public function userAccess()
    {
        return $this->morphMany(UserResourceAccess::class, 'resource', 'resource_type', 'resource_id');
    }

    public function getAllowedUsers()
    {
        $userIds = $this->allowed_user_ids ?? [];
        return User::whereIn('id', $userIds)->get();
    }

    public function getAllowedGroups()
    {
        $groupIds = $this->allowed_group_ids ?? [];
        return UserGroup::whereIn('id', $groupIds)->get();
    }

    public function canUserAccess(User $user, $requiredLevel = 'view')
    {
        // Admins have access to everything
        if ($user->isAdmin()) {
            return true;
        }

        // Owner has full access
        if ($this->user_id && $this->user_id === $user->id) {
            return true;
        }

        // Check if resource is public
        if ($this->access_level === 'public') {
            return true;
        }

        // Check direct user access
        if ($this->hasDirectUserAccess($user, $requiredLevel)) {
            return true;
        }

        // Check group access
        if ($this->hasGroupAccess($user, $requiredLevel)) {
            return true;
        }

        // Check explicit user resource access
        if ($this->hasExplicitAccess($user, $requiredLevel)) {
            return true;
        }

        return false;
    }

    private function hasDirectUserAccess(User $user, $requiredLevel)
    {
        if ($this->access_level !== 'restricted') {
            return false;
        }

        $allowedUserIds = $this->allowed_user_ids ?? [];
        return in_array($user->id, $allowedUserIds);
    }

    private function hasGroupAccess(User $user, $requiredLevel)
    {
        if ($this->access_level !== 'restricted') {
            return false;
        }

        $allowedGroupIds = $this->allowed_group_ids ?? [];
        if (empty($allowedGroupIds)) {
            return false;
        }

        $userGroupIds = $user->groups()->pluck('user_groups.id')->toArray();
        return !empty(array_intersect($allowedGroupIds, $userGroupIds));
    }

    private function hasExplicitAccess(User $user, $requiredLevel)
    {
        $access = UserResourceAccess::forUser($user->id)
            ->forResource(get_class($this), $this->id)
            ->active()
            ->first();

        if (!$access) {
            return false;
        }

        // Check if user has required access level
        $accessLevels = ['view' => 1, 'edit' => 2, 'full' => 3];
        $userLevel = $accessLevels[$access->access_level] ?? 0;
        $requiredLevelValue = $accessLevels[$requiredLevel] ?? 1;

        return $userLevel >= $requiredLevelValue;
    }

    public function grantAccessToUser(User $user, $accessLevel = 'view', $grantedBy = null, $expiresAt = null, $notes = null)
    {
        return UserResourceAccess::updateOrCreate(
            [
                'user_id' => $user->id,
                'resource_type' => get_class($this),
                'resource_id' => $this->id,
            ],
            [
                'access_level' => $accessLevel,
                'is_granted' => true,
                'granted_by' => $grantedBy,
                'granted_at' => now(),
                'expires_at' => $expiresAt,
                'notes' => $notes,
            ]
        );
    }

    public function revokeAccessFromUser(User $user)
    {
        return UserResourceAccess::forUser($user->id)
            ->forResource(get_class($this), $this->id)
            ->update(['is_granted' => false]);
    }

    public function addAllowedUser($userId)
    {
        $allowedUsers = $this->allowed_user_ids ?? [];
        if (!in_array($userId, $allowedUsers)) {
            $allowedUsers[] = $userId;
            $this->update(['allowed_user_ids' => $allowedUsers]);
        }
    }

    public function removeAllowedUser($userId)
    {
        $allowedUsers = $this->allowed_user_ids ?? [];
        $allowedUsers = array_filter($allowedUsers, fn($id) => $id != $userId);
        $this->update(['allowed_user_ids' => array_values($allowedUsers)]);
    }

    public function addAllowedGroup($groupId)
    {
        $allowedGroups = $this->allowed_group_ids ?? [];
        if (!in_array($groupId, $allowedGroups)) {
            $allowedGroups[] = $groupId;
            $this->update(['allowed_group_ids' => $allowedGroups]);
        }
    }

    public function removeAllowedGroup($groupId)
    {
        $allowedGroups = $this->allowed_group_ids ?? [];
        $allowedGroups = array_filter($allowedGroups, fn($id) => $id != $groupId);
        $this->update(['allowed_group_ids' => array_values($allowedGroups)]);
    }

    public function scopeAccessibleBy($query, User $user, $accessLevel = 'view')
    {
        return $query->where(function ($q) use ($user, $accessLevel) {
            // Admin can access everything
            if ($user->isAdmin()) {
                return $q;
            }

            $q->where(function ($subQ) use ($user, $accessLevel) {
                // Public resources
                $subQ->where('access_level', 'public')
                    // Owner's resources
                    ->orWhere('user_id', $user->id)
                    // Restricted resources with direct user access
                    ->orWhere(function ($restrictedQ) use ($user) {
                        $restrictedQ->where('access_level', 'restricted')
                            ->whereJsonContains('allowed_user_ids', $user->id);
                    })
                    // Restricted resources with group access
                    ->orWhere(function ($groupQ) use ($user) {
                        $groupQ->where('access_level', 'restricted');
                        $userGroupIds = $user->groups()->pluck('user_groups.id')->toArray();
                        foreach ($userGroupIds as $groupId) {
                            $groupQ->orWhereJsonContains('allowed_group_ids', $groupId);
                        }
                    });
            });

            // Add explicit access through UserResourceAccess
            $resourceType = get_class($this->getModel());
            $q->orWhereHas('userAccess', function ($accessQ) use ($user, $accessLevel) {
                $accessQ->forUser($user->id)->active();
                
                if ($accessLevel !== 'view') {
                    $accessLevels = ['view' => 1, 'edit' => 2, 'full' => 3];
                    $requiredLevel = $accessLevels[$accessLevel] ?? 1;
                    
                    $accessQ->where(function ($levelQ) use ($requiredLevel) {
                        if ($requiredLevel >= 2) {
                            $levelQ->whereIn('access_level', ['edit', 'full']);
                        }
                        if ($requiredLevel >= 3) {
                            $levelQ->where('access_level', 'full');
                        }
                    });
                }
            });
        });
    }
}