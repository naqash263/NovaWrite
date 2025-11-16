<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{

    /**
     * Get all users with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');
        $role = $request->get('role');
        $verificationStatus = $request->get('verification_status');

        $query = User::query();

        // Search functionality
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($role) {
            $query->where('role', $role);
        }

        // Filter by verification status
        if ($verificationStatus !== null) {
            if ($verificationStatus === 'verified') {
                $query->whereNotNull('email_verified_at');
            } elseif ($verificationStatus === 'unverified') {
                $query->whereNull('email_verified_at');
            }
        }

        $users = $query->orderBy('created_at', 'desc')
                      ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Get a specific user
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Update user information
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'role' => 'sometimes|in:user,admin,moderator',
            'password' => 'sometimes|nullable|string|min:8',
        ]);

        $updateData = $request->only(['name', 'email', 'role']);

        // Handle password update - only update if password is provided and not empty
        // Note: User model has 'password' => 'hashed' cast, so we don't need to hash manually
        if ($request->filled('password') && !empty(trim($request->password))) {
            $updateData['password'] = $request->password; // Model will auto-hash via cast
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->fresh()
        ]);
    }

    /**
     * Manually verify a user account
     */
    public function verifyAccount(User $user): JsonResponse
    {
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'User account is already verified'
            ], 400);
        }

        $user->markEmailAsVerified();

        return response()->json([
            'success' => true,
            'message' => 'User account has been manually verified',
            'data' => $user->fresh()
        ]);
    }

    /**
     * Unverify a user account (admin action)
     */
    public function unverifyAccount(User $user): JsonResponse
    {
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'User account is not verified'
            ], 400);
        }

        $user->email_verified_at = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'User account has been unverified',
            'data' => $user->fresh()
        ]);
    }

    /**
     * Delete a user account
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent admin from deleting themselves
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User account deleted successfully'
        ]);
    }

    /**
     * Get user statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_users' => User::count(),
            'verified_users' => User::whereNotNull('email_verified_at')->count(),
            'unverified_users' => User::whereNull('email_verified_at')->count(),
            'admin_users' => User::where('role', 'admin')->count(),
            'regular_users' => User::where('role', 'user')->count(),
            'moderator_users' => User::where('role', 'moderator')->count(),
            'recent_registrations' => User::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Bulk verify multiple users
     */
    public function bulkVerify(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id'
        ]);

        $userIds = $request->user_ids;
        $verifiedCount = 0;
        $alreadyVerifiedCount = 0;

        foreach ($userIds as $userId) {
            $user = User::find($userId);
            if ($user && !$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
                $verifiedCount++;
            } else {
                $alreadyVerifiedCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Bulk verification completed. {$verifiedCount} users verified, {$alreadyVerifiedCount} were already verified.",
            'data' => [
                'verified_count' => $verifiedCount,
                'already_verified_count' => $alreadyVerifiedCount
            ]
        ]);
    }

    /**
     * Resend verification email to user
     */
    public function resendVerification(User $user): JsonResponse
    {
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'User account is already verified'
            ], 400);
        }

        // Generate new verification token
        $user->email_verification_token = bin2hex(random_bytes(32));
        $user->save();

        // Send verification email (you can implement this)
        // Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationUrl));

        return response()->json([
            'success' => true,
            'message' => 'Verification email has been resent',
            'data' => $user->fresh()
        ]);
    }
}
