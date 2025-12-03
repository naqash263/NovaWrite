<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailUnsubscribe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class EmailUnsubscribeController extends Controller
{
    /**
     * Unsubscribe via token (from email link)
     */
    public function unsubscribeByToken(Request $request, string $token): JsonResponse
    {
        try {
            $unsubscribe = EmailUnsubscribe::where('token', $token)->first();

            if (!$unsubscribe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid unsubscribe token'
                ], 404);
            }

            // Get email types from request or unsubscribe from all
            $types = $request->input('types', []);
            $unsubscribeAll = $request->boolean('all', false);

            if ($unsubscribeAll) {
                $unsubscribe->update(['unsubscribe_all' => true, 'unsubscribed_types' => null]);
            } elseif (!empty($types)) {
                $existingTypes = $unsubscribe->unsubscribed_types ?? [];
                $newTypes = array_unique(array_merge($existingTypes, $types));
                $unsubscribe->update(['unsubscribed_types' => $newTypes]);
            } else {
                // If no types specified, unsubscribe from all
                $unsubscribe->update(['unsubscribe_all' => true]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Successfully unsubscribed',
                'email' => $unsubscribe->email,
                'unsubscribed_all' => $unsubscribe->unsubscribe_all,
                'unsubscribed_types' => $unsubscribe->unsubscribed_types
            ]);
        } catch (\Exception $e) {
            Log::error('Error unsubscribing by token: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to unsubscribe'
            ], 500);
        }
    }

    /**
     * Unsubscribe via email (public endpoint)
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'types' => 'nullable|array',
            'types.*' => 'string|in:new_comment,comment_reply,issue_created,issue_solved,issue_status_changed',
            'all' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = $request->email;
            $types = $request->input('types', []);
            $unsubscribeAll = $request->boolean('all', false);

            $unsubscribe = EmailUnsubscribe::unsubscribe($email, $types, $unsubscribeAll);

            return response()->json([
                'success' => true,
                'message' => 'Successfully unsubscribed',
                'email' => $email,
                'unsubscribed_all' => $unsubscribe->unsubscribe_all,
                'unsubscribed_types' => $unsubscribe->unsubscribed_types
            ]);
        } catch (\Exception $e) {
            Log::error('Error unsubscribing: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to unsubscribe'
            ], 500);
        }
    }

    /**
     * Resubscribe (remove unsubscribe)
     */
    public function resubscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'nullable|string', // Optional token for verification
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = $request->email;
            $token = $request->token;

            if ($token) {
                $unsubscribe = EmailUnsubscribe::where('token', $token)
                    ->where('email', $email)
                    ->first();

                if (!$unsubscribe) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid token or email'
                    ], 404);
                }

                $unsubscribe->delete();
            } else {
                EmailUnsubscribe::resubscribe($email);
            }

            return response()->json([
                'success' => true,
                'message' => 'Successfully resubscribed'
            ]);
        } catch (\Exception $e) {
            Log::error('Error resubscribing: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resubscribe'
            ], 500);
        }
    }

    /**
     * Get unsubscribe status
     */
    public function status(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $unsubscribe = EmailUnsubscribe::where('email', $request->email)->first();

            return response()->json([
                'success' => true,
                'is_unsubscribed' => $unsubscribe !== null,
                'unsubscribed_all' => $unsubscribe?->unsubscribe_all ?? false,
                'unsubscribed_types' => $unsubscribe?->unsubscribed_types ?? [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get status'
            ], 500);
        }
    }
}
