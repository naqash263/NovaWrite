<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirectToGoogle()
    {
        try {
            $redirectUrl = Socialite::driver('google')
                ->stateless()
                ->redirect()
                ->getTargetUrl();

            return response()->json([
                'redirect_url' => $redirectUrl
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to generate Google OAuth URL',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            // Get the authorization code from the request
            $code = $request->input('code');
            
            if (!$code) {
                return response()->json([
                    'message' => 'Authorization code not provided'
                ], 400);
            }

            // Get user data from Google
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            // Check if user already exists with this Google ID
            $user = User::where('google_id', $googleUser->getId())->first();

            if ($user) {
                // User exists with Google ID, log them in
                $this->updateUserFromGoogle($user, $googleUser);
                ActivityLog::log('google_login', $user, 'User logged in with Google OAuth');
            } else {
                // Check if user exists with the same email
                $existingUser = User::where('email', $googleUser->getEmail())->first();
                
                if ($existingUser) {
                    // Link Google account to existing user
                    $existingUser->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                        'email_verified_at' => now(), // Google emails are verified
                    ]);
                    $user = $existingUser;
                    ActivityLog::log('google_account_linked', $user, 'Google account linked to existing user');
                } else {
                    // Create new user
                    $user = $this->createUserFromGoogle($googleUser);
                    ActivityLog::log('google_registration', $user, 'New user registered with Google OAuth');
                }
            }

            // Generate JWT token
            $token = auth('api')->login($user);
            
            return response()->json([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => $user->load('roleModel'),
                'message' => 'Successfully authenticated with Google'
            ]);

        } catch (Exception $e) {
            ActivityLog::log('google_login_failed', null, 'Google OAuth login failed: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Google authentication failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function createUserFromGoogle($googleUser)
    {
        // Get default user role
        $userRole = Role::where('name', 'user')->first();
        
        return User::create([
            'name' => $googleUser->getName(),
            'email' => $googleUser->getEmail(),
            'google_id' => $googleUser->getId(),
            'avatar' => $googleUser->getAvatar(),
            'email_verified_at' => now(), // Google emails are verified
            'password' => Hash::make(Str::random(24)), // Random password for Google users
            'role' => 'user',
            'role_id' => $userRole ? $userRole->id : null,
        ]);
    }

    private function updateUserFromGoogle($user, $googleUser)
    {
        $user->update([
            'name' => $googleUser->getName(),
            'avatar' => $googleUser->getAvatar(),
            'email_verified_at' => now(), // Ensure email is verified
        ]);
    }

    public function unlinkGoogle(Request $request)
    {
        $user = auth()->user();

        if (!$user->google_id) {
            return response()->json([
                'message' => 'No Google account linked to this user'
            ], 400);
        }

        // Check if user has a password (can't unlink if no other auth method)
        if (!$user->password || $user->password === '') {
            return response()->json([
                'message' => 'Cannot unlink Google account. Please set a password first.'
            ], 400);
        }

        $user->update([
            'google_id' => null,
            'avatar' => null,
        ]);

        ActivityLog::log('google_account_unlinked', $user, 'Google account unlinked from user');

        return response()->json([
            'message' => 'Google account successfully unlinked'
        ]);
    }

    public function getGoogleStatus()
    {
        $user = auth()->user();
        
        return response()->json([
            'google_linked' => !is_null($user->google_id),
            'avatar' => $user->avatar,
            'has_password' => !is_null($user->password) && $user->password !== '',
        ]);
    }

    public function setPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = auth()->user();

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        ActivityLog::log('password_set', $user, 'Password set for Google OAuth user');

        return response()->json([
            'message' => 'Password set successfully'
        ]);
    }
}