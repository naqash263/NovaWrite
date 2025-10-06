<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\UserGroup;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UserGroupController extends Controller
{
    public function index(Request $request)
    {
        $query = UserGroup::withCount('members');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $groups = $query->orderBy('name')->get();
        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:user_groups',
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|size:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'default_permissions' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $group = UserGroup::create($request->all());

        ActivityLog::log('group_created', $group, "Created user group: {$group->name}");

        return response()->json($group->load('members'), 201);
    }

    public function show($id)
    {
        $group = UserGroup::with(['members' => function($query) {
            $query->select('users.id', 'users.name', 'users.email', 'users.role')
                  ->withPivot(['added_by', 'joined_at']);
        }])->findOrFail($id);

        return response()->json($group);
    }

    public function update(Request $request, $id)
    {
        $group = UserGroup::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:user_groups,name,' . $id,
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|size:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'default_permissions' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $oldName = $group->name;
        $group->update($request->all());

        ActivityLog::log('group_updated', $group, "Updated user group from '{$oldName}' to '{$group->name}'");

        return response()->json($group->load('members'));
    }

    public function destroy($id)
    {
        $group = UserGroup::findOrFail($id);
        $groupName = $group->name;
        
        // Remove all members from the group
        $group->members()->detach();
        
        $group->delete();

        ActivityLog::log('group_deleted', null, "Deleted user group: {$groupName}");

        return response()->json(['message' => 'User group deleted successfully']);
    }

    public function addMember(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $group = UserGroup::findOrFail($id);
        $user = User::findOrFail($request->user_id);

        if ($group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'User is already a member of this group'], 409);
        }

        $group->members()->attach($user->id, [
            'added_by' => auth()->id(),
            'joined_at' => now()
        ]);

        ActivityLog::log('group_member_added', $group, "Added {$user->name} to group {$group->name}");

        return response()->json([
            'message' => 'User added to group successfully',
            'group' => $group->load('members')
        ]);
    }

    public function removeMember(Request $request, $id, $userId)
    {
        $group = UserGroup::findOrFail($id);
        $user = User::findOrFail($userId);

        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'User is not a member of this group'], 404);
        }

        $group->members()->detach($user->id);

        ActivityLog::log('group_member_removed', $group, "Removed {$user->name} from group {$group->name}");

        return response()->json([
            'message' => 'User removed from group successfully',
            'group' => $group->load('members')
        ]);
    }

    public function bulkAddMembers(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $group = UserGroup::findOrFail($id);
        $userIds = $request->user_ids;

        // Get existing members to avoid duplicates
        $existingMemberIds = $group->members()->pluck('user_id')->toArray();
        $newMemberIds = array_diff($userIds, $existingMemberIds);

        if (empty($newMemberIds)) {
            return response()->json(['message' => 'All selected users are already members of this group'], 409);
        }

        // Add new members
        $memberData = [];
        foreach ($newMemberIds as $userId) {
            $memberData[$userId] = [
                'added_by' => auth()->id(),
                'joined_at' => now()
            ];
        }

        $group->members()->attach($memberData);

        $addedCount = count($newMemberIds);
        ActivityLog::log('group_bulk_members_added', $group, "Added {$addedCount} members to group {$group->name}");

        return response()->json([
            'message' => "Successfully added {$addedCount} users to the group",
            'added_count' => $addedCount,
            'group' => $group->load('members')
        ]);
    }

    public function getStats()
    {
        $stats = [
            'total_groups' => UserGroup::count(),
            'active_groups' => UserGroup::where('is_active', true)->count(),
            'total_memberships' => DB::table('user_group_members')->count(),
            'average_group_size' => DB::table('user_group_members')
                ->join('user_groups', 'user_group_members.group_id', '=', 'user_groups.id')
                ->where('user_groups.is_active', true)
                ->count() / max(UserGroup::where('is_active', true)->count(), 1),
        ];

        // Most popular groups
        $popularGroups = UserGroup::withCount('members')
            ->where('is_active', true)
            ->orderBy('members_count', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'color']);

        return response()->json([
            'stats' => $stats,
            'popular_groups' => $popularGroups
        ]);
    }
}