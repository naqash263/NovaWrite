<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ApiTokenController extends Controller
{
    /**
     * Display a listing of API tokens.
     */
    public function index(): JsonResponse
    {
        $tokens = ApiToken::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($token) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'token' => $token->token, // Only show token in listing for admin
                    'permissions' => $token->permissions,
                    'last_used_at' => $token->last_used_at,
                    'expires_at' => $token->expires_at,
                    'created_at' => $token->created_at,
                ];
            });

        return response()->json($tokens);
    }

    /**
     * Store a newly created API token.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'expires_in_days' => 'required|integer|min:0|max:3650', // Max 10 years
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'in:read,write,delete,admin',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $expiresAt = null;
        if ($request->expires_in_days > 0) {
            $expiresAt = Carbon::now()->addDays($request->expires_in_days);
        }

        $token = ApiToken::create([
            'name' => $request->name,
            'token' => ApiToken::generateToken(),
            'permissions' => $request->permissions,
            'expires_at' => $expiresAt,
            'user_id' => Auth::id(),
        ]);

        return response()->json([
            'id' => $token->id,
            'name' => $token->name,
            'token' => $token->token, // Return token only on creation
            'permissions' => $token->permissions,
            'expires_at' => $token->expires_at,
            'created_at' => $token->created_at,
        ], 201);
    }

    /**
     * Display the specified API token.
     */
    public function show(ApiToken $apiToken): JsonResponse
    {
        // Ensure user can only access their own tokens
        if ($apiToken->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'id' => $apiToken->id,
            'name' => $apiToken->name,
            'permissions' => $apiToken->permissions,
            'last_used_at' => $apiToken->last_used_at,
            'expires_at' => $apiToken->expires_at,
            'created_at' => $apiToken->created_at,
        ]);
    }

    /**
     * Update the specified API token.
     */
    public function update(Request $request, ApiToken $apiToken): JsonResponse
    {
        // Ensure user can only update their own tokens
        if ($apiToken->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'permissions' => 'sometimes|array|min:1',
            'permissions.*' => 'in:read,write,delete,admin',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $apiToken->update($request->only(['name', 'permissions']));

        return response()->json([
            'id' => $apiToken->id,
            'name' => $apiToken->name,
            'permissions' => $apiToken->permissions,
            'last_used_at' => $apiToken->last_used_at,
            'expires_at' => $apiToken->expires_at,
            'updated_at' => $apiToken->updated_at,
        ]);
    }

    /**
     * Remove the specified API token.
     */
    public function destroy(ApiToken $apiToken): JsonResponse
    {
        // Ensure user can only delete their own tokens
        if ($apiToken->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $apiToken->delete();

        return response()->json(['message' => 'Token deleted successfully']);
    }

    /**
     * Get API token statistics.
     */
    public function stats(): JsonResponse
    {
        $userTokens = ApiToken::where('user_id', Auth::id())->get();

        $stats = [
            'total_tokens' => $userTokens->count(),
            'active_tokens' => $userTokens->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })->count(),
            'expired_tokens' => $userTokens->where('expires_at', '<', now())->count(),
            'tokens_used_today' => $userTokens->whereDate('last_used_at', today())->count(),
        ];

        return response()->json($stats);
    }
}