<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $code = $request->input('code');
            $state = $request->input('state');

            \Log::info('Google OAuth callback received', [
                'code' => $code ? 'present' : 'missing',
                'state' => $state ? 'present' : 'missing',
                'has_code' => !empty($code),
            ]);

            if (!$code) {
                return response()->json([
                    'error' => 'Authorization code not provided',
                ], 400);
            }

            // Exchange code for access token
            $tokenResponse = $this->getAccessToken($code);
            $accessToken = $tokenResponse['access_token'];

            // Get user info from Google
            $userInfo = $this->getUserInfo($accessToken);

            \Log::info('Google user info received', [
                'email' => $userInfo['email'] ?? 'missing',
                'name' => $userInfo['name'] ?? 'missing',
                'id' => $userInfo['id'] ?? 'missing',
            ]);

            // Check if user already exists
            $user = User::where('email', $userInfo['email'])->first();
            
            if ($user) {
                // User exists - update their Google info and mark as verified
                $user->google_id = $userInfo['id'];
                $user->avatar = $userInfo['picture'] ?? $user->avatar; // Keep existing avatar if no new one
                $user->email_verified_at = now(); // Mark as verified since Google users are pre-verified
                $user->save();
                
                \Log::info('Existing user logged in with Google (API)', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'google_id' => $user->google_id,
                ]);
            } else {
                // Create new user
                $user = User::create([
                    'name' => $userInfo['name'],
                    'email' => $userInfo['email'],
                    'google_id' => $userInfo['id'],
                    'avatar' => $userInfo['picture'] ?? null,
                    'password' => Hash::make(Str::random(24)), // Random password for Google users
                    'email_verified_at' => now(), // Google users are pre-verified
                    'role' => 'user', // Default role
                ]);
                
                \Log::info('New user created via Google OAuth (API)', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'google_id' => $user->google_id,
                ]);
            }

            // Generate JWT token
            $token = auth('api')->login($user);

            // Check if this is a redirect request (from web route)
            if ($request->header('Accept') && str_contains($request->header('Accept'), 'text/html')) {
                // Redirect to frontend success page
                $frontendUrl = config('app.frontend_url', config('app.url'));
                return redirect($frontendUrl . '/auth/google/success?token=' . $token . '&user=' . urlencode(json_encode($user)));
            }
            
            return response()->json([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => $user,
            ]);

        } catch (\Exception $e) {
            \Log::error('Google OAuth callback error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'error' => 'Google authentication failed',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Exchange authorization code for access token
     */
    private function getAccessToken($code)
    {
        $requestData = [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => config('services.google.redirect'),
            'grant_type' => 'authorization_code',
            'code' => $code,
        ];

        \Log::info('Google OAuth token exchange request', [
            'client_id' => $requestData['client_id'],
            'redirect_uri' => $requestData['redirect_uri'],
            'code_length' => strlen($code),
        ]);

        $response = \Http::asForm()->post('https://oauth2.googleapis.com/token', $requestData);

        if (!$response->successful()) {
            \Log::error('Google OAuth token exchange failed', [
                'status' => $response->status(),
                'response' => $response->body(),
                'client_id' => config('services.google.client_id'),
                'redirect_uri' => config('services.google.redirect'),
                'request_data' => $requestData,
            ]);
            throw new \Exception('Failed to exchange code for token: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Get user info from Google
     */
    private function getUserInfo($accessToken)
    {
        $response = \Http::withHeaders([
            'Authorization' => 'Bearer ' . $accessToken,
        ])->get('https://www.googleapis.com/oauth2/v2/userinfo');

        if (!$response->successful()) {
            throw new \Exception('Failed to get user info from Google');
        }

        return $response->json();
    }

    /**
     * Get Google OAuth URL for frontend
     */
    public function getGoogleUrl()
    {
        $state = Str::random(40);
        
        $params = [
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.redirect'),
            'scope' => 'openid profile email',
            'response_type' => 'code',
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'consent',
        ];

        $url = 'https://accounts.google.com/o/oauth2/auth?' . http_build_query($params);

        return response()->json([
            'url' => $url,
            'state' => $state,
        ]);
    }

    /**
     * Handle Google OAuth callback for web (redirects to frontend)
     */
    public function handleGoogleCallbackWeb(Request $request)
    {
        try {
            $code = $request->input('code');
            $state = $request->input('state');
            $error = $request->input('error');

            $frontendUrl = config('app.frontend_url', config('app.url'));
            
            if ($error) {
                return redirect($frontendUrl . '/login?error=' . urlencode($error));
            }

            if (!$code) {
                return redirect($frontendUrl . '/login?error=no_code');
            }

            // Exchange code for access token
            $tokenResponse = $this->getAccessToken($code);
            $accessToken = $tokenResponse['access_token'];

            // Get user info from Google
            $userInfo = $this->getUserInfo($accessToken);

            // Check if user already exists
            $user = User::where('email', $userInfo['email'])->first();
            
            if ($user) {
                // User exists - update their Google info and mark as verified
                $user->google_id = $userInfo['id'];
                $user->avatar = $userInfo['picture'] ?? $user->avatar; // Keep existing avatar if no new one
                $user->email_verified_at = now(); // Mark as verified since Google users are pre-verified
                $user->save();
                
                \Log::info('Existing user logged in with Google (Web)', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'google_id' => $user->google_id,
                ]);
            } else {
                // Create new user
                $user = User::create([
                    'name' => $userInfo['name'],
                    'email' => $userInfo['email'],
                    'google_id' => $userInfo['id'],
                    'avatar' => $userInfo['picture'] ?? null,
                    'password' => Hash::make(Str::random(24)), // Random password for Google users
                    'email_verified_at' => now(), // Google users are pre-verified
                    'role' => 'user', // Default role
                ]);
                
                \Log::info('New user created via Google OAuth (Web)', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'google_id' => $user->google_id,
                ]);
            }

            // Generate JWT token using the API guard
            try {
                $token = auth('api')->login($user);
            } catch (\Exception $e) {
                \Log::error('JWT token generation failed in web callback', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id,
                ]);
                
                // Fallback: redirect to login with error
                return redirect($frontendUrl . '/login?error=' . urlencode('Authentication failed: ' . $e->getMessage()));
            }

            // Redirect to frontend with token
            return redirect($frontendUrl . '/auth/google/success?token=' . $token . '&user=' . urlencode(json_encode($user)));

        } catch (\Exception $e) {
            \Log::error('Google OAuth web callback error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            $frontendUrl = config('app.frontend_url', config('app.url'));
            return redirect($frontendUrl . '/login?error=' . urlencode($e->getMessage()));
        }
    }
}
