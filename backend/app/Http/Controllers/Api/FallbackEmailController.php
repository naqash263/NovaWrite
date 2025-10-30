<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailQueue;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class FallbackEmailController extends Controller
{
    /**
     * GET /admin/fallback-emails
     * Return paginated list of unsent/failed emails (admin-only)
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailQueue::query();
        $statusFilter = $request->get('status', 'failed');
        $query->whereIn('status', [$statusFilter, 'failed', 'unsent']);

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }
        if ($request->has('recipient_email')) {
            $query->where('recipient_email', $request->recipient_email);
        }

        $emails = $query->orderBy('created_at', 'desc')->paginate(25);
        return response()->json([
            'success' => true,
            'data' => $emails
        ]);
    }

    /**
     * POST /admin/fallback-emails/{id}/mark-sent
     * Mark a given email as completed (admin-only)
     */
    public function markSent($id, Request $request): JsonResponse
    {
        $email = EmailQueue::find($id);
        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Email not found',
            ], 404);
        }
        $was = $email->status;
        $email->status = 'completed';
        $email->completed_at = now();
        $email->save();

        Log::info('FallbackEmail marked as sent by admin', [
            'email_queue_id' => $email->id,
            'previous_status' => $was,
            'by_admin' => $request->user() ? $request->user()->id : null
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email marked as sent',
            'data' => $email
        ]);
    }
}
