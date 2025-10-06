<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Models\UserResourceAccess;
use App\Models\Post;
use App\Models\Course;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserAccessController extends Controller
{
    public function getUserAccess(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        
        $query = UserResourceAccess::forUser($userId)
            ->with(['grantedBy:id,name'])
            ->orderBy('granted_at', 'desc');

        if ($request->has('resource_type')) {
            $query->where('resource_type', $request->resource_type);
        }

        if ($request->has('access_level')) {
            $query->where('access_level', $request->access_level);
        }

        if ($request->has('active')) {
            if ($request->boolean('active')) {
                $query->active();
            } else {
                $query->where('is_granted', false);
            }
        }

        $access = $query->paginate($request->get('per_page', 20));

        // Add resource details
        $access->getCollection()->transform(function ($item) {
            switch ($item->resource_type) {
                case 'App\\Models\\Post':
                    $resource = Post::find($item->resource_id);
                    $item->resource_details = $resource ? [
                        'title' => $resource->title,
                        'slug' => $resource->slug
                    ] : null;
                    break;
                case 'App\\Models\\Course':
                    $resource = Course::find($item->resource_id);
                    $item->resource_details = $resource ? [
                        'title' => $resource->title,
                        'slug' => $resource->slug
                    ] : null;
                    break;
                case 'App\\Models\\Workflow':
                    $resource = Workflow::find($item->resource_id);
                    $item->resource_details = $resource ? [
                        'title' => $resource->title,
                        'slug' => $resource->slug
                    ] : null;
                    break;
                default:
                    $item->resource_details = null;
            }
            return $item;
        });

        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'role']),
            'access' => $access
        ]);
    }

    public function grantAccess(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'resource_type' => 'required|in:App\\Models\\Post,App\\Models\\Course,App\\Models\\Workflow',
            'resource_id' => 'required|integer',
            'access_level' => 'required|in:view,edit,full',
            'expires_at' => 'nullable|date|after:now',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify resource exists
        $resourceClass = $request->resource_type;
        $resource = $resourceClass::find($request->resource_id);
        if (!$resource) {
            return response()->json(['message' => 'Resource not found'], 404);
        }

        $user = User::findOrFail($request->user_id);

        $access = UserResourceAccess::updateOrCreate(
            [
                'user_id' => $user->id,
                'resource_type' => $request->resource_type,
                'resource_id' => $request->resource_id,
            ],
            [
                'access_level' => $request->access_level,
                'is_granted' => true,
                'granted_by' => auth()->id(),
                'granted_at' => now(),
                'expires_at' => $request->expires_at,
                'notes' => $request->notes,
            ]
        );

        ActivityLog::log(
            'access_granted', 
            $resource, 
            "Granted {$request->access_level} access to {$user->name} for " . class_basename($request->resource_type) . ": {$resource->title}"
        );

        return response()->json([
            'message' => 'Access granted successfully',
            'access' => $access->load('grantedBy:id,name')
        ], 201);
    }

    public function revokeAccess(Request $request, $accessId)
    {
        $access = UserResourceAccess::findOrFail($accessId);
        $user = $access->user;
        
        // Get resource details for logging
        $resourceClass = $access->resource_type;
        $resource = $resourceClass::find($access->resource_id);
        
        $access->update(['is_granted' => false]);

        ActivityLog::log(
            'access_revoked', 
            $resource, 
            "Revoked access from {$user->name} for " . class_basename($access->resource_type) . ": {$resource->title}"
        );

        return response()->json(['message' => 'Access revoked successfully']);
    }

    public function updateAccess(Request $request, $accessId)
    {
        $validator = Validator::make($request->all(), [
            'access_level' => 'required|in:view,edit,full',
            'expires_at' => 'nullable|date|after:now',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $access = UserResourceAccess::findOrFail($accessId);
        $oldLevel = $access->access_level;
        
        $access->update([
            'access_level' => $request->access_level,
            'expires_at' => $request->expires_at,
            'notes' => $request->notes,
        ]);

        // Get resource details for logging
        $resourceClass = $access->resource_type;
        $resource = $resourceClass::find($access->resource_id);
        $user = $access->user;

        ActivityLog::log(
            'access_updated', 
            $resource, 
            "Updated {$user->name}'s access from {$oldLevel} to {$request->access_level} for " . class_basename($access->resource_type) . ": {$resource->title}"
        );

        return response()->json([
            'message' => 'Access updated successfully',
            'access' => $access->load('grantedBy:id,name')
        ]);
    }

    public function bulkGrantAccess(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'resource_type' => 'required|in:App\\Models\\Post,App\\Models\\Course,App\\Models\\Workflow',
            'resource_id' => 'required|integer',
            'access_level' => 'required|in:view,edit,full',
            'expires_at' => 'nullable|date|after:now',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify resource exists
        $resourceClass = $request->resource_type;
        $resource = $resourceClass::find($request->resource_id);
        if (!$resource) {
            return response()->json(['message' => 'Resource not found'], 404);
        }

        $grantedCount = 0;
        $users = User::whereIn('id', $request->user_ids)->get();

        foreach ($users as $user) {
            UserResourceAccess::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'resource_type' => $request->resource_type,
                    'resource_id' => $request->resource_id,
                ],
                [
                    'access_level' => $request->access_level,
                    'is_granted' => true,
                    'granted_by' => auth()->id(),
                    'granted_at' => now(),
                    'expires_at' => $request->expires_at,
                    'notes' => $request->notes,
                ]
            );
            $grantedCount++;
        }

        ActivityLog::log(
            'bulk_access_granted', 
            $resource, 
            "Bulk granted {$request->access_level} access to {$grantedCount} users for " . class_basename($request->resource_type) . ": {$resource->title}"
        );

        return response()->json([
            'message' => "Successfully granted access to {$grantedCount} users",
            'granted_count' => $grantedCount
        ]);
    }

    public function getResourceAccess(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'resource_type' => 'required|in:App\\Models\\Post,App\\Models\\Course,App\\Models\\Workflow',
            'resource_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify resource exists
        $resourceClass = $request->resource_type;
        $resource = $resourceClass::find($request->resource_id);
        if (!$resource) {
            return response()->json(['message' => 'Resource not found'], 404);
        }

        $access = UserResourceAccess::forResource($request->resource_type, $request->resource_id)
            ->with(['user:id,name,email,role', 'grantedBy:id,name'])
            ->active()
            ->orderBy('granted_at', 'desc')
            ->get();

        return response()->json([
            'resource' => [
                'type' => class_basename($request->resource_type),
                'id' => $resource->id,
                'title' => $resource->title,
                'access_level' => $resource->access_level ?? 'public'
            ],
            'access' => $access
        ]);
    }

    public function getAccessStats()
    {
        $stats = [
            'total_grants' => UserResourceAccess::count(),
            'active_grants' => UserResourceAccess::active()->count(),
            'expired_grants' => UserResourceAccess::where('expires_at', '<', now())->count(),
            'revoked_grants' => UserResourceAccess::where('is_granted', false)->count(),
        ];

        // Access by resource type
        $accessByType = UserResourceAccess::active()
            ->selectRaw('resource_type, COUNT(*) as count')
            ->groupBy('resource_type')
            ->get()
            ->mapWithKeys(function ($item) {
                return [class_basename($item->resource_type) => $item->count];
            });

        // Access by level
        $accessByLevel = UserResourceAccess::active()
            ->selectRaw('access_level, COUNT(*) as count')
            ->groupBy('access_level')
            ->pluck('count', 'access_level');

        return response()->json([
            'stats' => $stats,
            'access_by_type' => $accessByType,
            'access_by_level' => $accessByLevel
        ]);
    }
}