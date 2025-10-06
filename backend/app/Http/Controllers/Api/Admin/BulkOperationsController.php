<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BulkOperationsController extends Controller
{
    public function bulkDeletePosts(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:posts,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $deletedCount = Post::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => "Successfully deleted {$deletedCount} posts",
            'deleted_count' => $deletedCount
        ]);
    }

    public function bulkUpdatePostStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:posts,id',
            'status' => 'required|in:draft,published',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updatedCount = Post::whereIn('id', $request->ids)
            ->update(['status' => $request->status]);

        return response()->json([
            'message' => "Successfully updated {$updatedCount} posts to {$request->status}",
            'updated_count' => $updatedCount
        ]);
    }

    public function bulkDeleteUsers(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Prevent deleting the current user
        $currentUserId = auth()->id();
        $idsToDelete = array_filter($request->ids, function($id) use ($currentUserId) {
            return $id != $currentUserId;
        });

        if (empty($idsToDelete)) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $deletedCount = User::whereIn('id', $idsToDelete)->delete();

        return response()->json([
            'message' => "Successfully deleted {$deletedCount} users",
            'deleted_count' => $deletedCount
        ]);
    }

    public function bulkUpdateUserRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
            'role' => 'required|in:admin,user',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updatedCount = User::whereIn('id', $request->ids)
            ->update(['role' => $request->role]);

        return response()->json([
            'message' => "Successfully updated {$updatedCount} users to {$request->role}",
            'updated_count' => $updatedCount
        ]);
    }

    public function bulkDeleteWorkflows(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:workflows,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $deletedCount = Workflow::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => "Successfully deleted {$deletedCount} workflows",
            'deleted_count' => $deletedCount
        ]);
    }

    public function bulkUpdateWorkflowStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'exists:workflows,id',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updatedCount = Workflow::whereIn('id', $request->ids)
            ->update(['status' => $request->status]);

        return response()->json([
            'message' => "Successfully updated {$updatedCount} workflows to {$request->status}",
            'updated_count' => $updatedCount
        ]);
    }
}