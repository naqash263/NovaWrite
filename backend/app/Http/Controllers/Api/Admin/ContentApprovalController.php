<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ContentApprovalController extends Controller
{
    public function getPendingPosts()
    {
        $posts = Post::where('approval_status', 'pending')
            ->with(['user', 'category'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($posts);
    }

    public function approvePost(Request $request, $id)
    {
        $post = Post::findOrFail($id);
        
        $post->update([
            'approval_status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => Carbon::now(),
            'status' => 'published', // Auto-publish approved posts
        ]);

        return response()->json([
            'message' => 'Post approved successfully',
            'post' => $post->load(['user', 'category'])
        ]);
    }

    public function rejectPost(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $post = Post::findOrFail($id);
        
        $post->update([
            'approval_status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_by' => auth()->id(),
            'approved_at' => Carbon::now(),
            'status' => 'draft', // Set back to draft
        ]);

        return response()->json([
            'message' => 'Post rejected successfully',
            'post' => $post->load(['user', 'category'])
        ]);
    }

    public function getApprovalStats()
    {
        $postStats = [
            'pending' => Post::where('approval_status', 'pending')->count(),
            'approved' => Post::where('approval_status', 'approved')->count(),
            'rejected' => Post::where('approval_status', 'rejected')->count(),
        ];

        return response()->json([
            'posts' => $postStats,
            'total_pending' => $postStats['pending'],
        ]);
    }

    public function bulkApprove(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:posts',
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = [
            'approval_status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => Carbon::now(),
        ];

        $updateData['status'] = 'published';
        $count = Post::whereIn('id', $request->ids)->update($updateData);

        return response()->json([
            'message' => "Successfully approved {$count} {$request->type}",
            'approved_count' => $count
        ]);
    }

    public function bulkReject(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:posts',
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = [
            'approval_status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_by' => auth()->id(),
            'approved_at' => Carbon::now(),
        ];

        $updateData['status'] = 'draft';
        $count = Post::whereIn('id', $request->ids)->update($updateData);

        return response()->json([
            'message' => "Successfully rejected {$count} {$request->type}",
            'rejected_count' => $count
        ]);
    }
}