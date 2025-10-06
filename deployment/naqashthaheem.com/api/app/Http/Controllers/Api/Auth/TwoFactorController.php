<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Support\Str;

class TwoFactorController extends Controller
{
    private $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    public function enable(Request $request)
    {
        $user = auth()->user();
        
        if ($user->two_factor_enabled) {
            return response()->json(['message' => 'Two-factor authentication is already enabled'], 400);
        }

        // Generate secret key
        $secret = $this->google2fa->generateSecretKey();
        
        // Generate QR Code URL
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        // Store secret temporarily (will be saved permanently after verification)
        session(['2fa_temp_secret' => $secret]);

        ActivityLog::log('2fa_setup_initiated', $user, 'User initiated two-factor authentication setup');

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'message' => 'Scan the QR code with your authenticator app and verify with a code to enable 2FA'
        ]);
    }

    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth()->user();
        $secret = session('2fa_temp_secret') ?: $user->two_factor_secret;

        if (!$secret) {
            return response()->json(['message' => 'No 2FA setup in progress'], 400);
        }

        $valid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            ActivityLog::log('2fa_verification_failed', $user, 'Invalid 2FA code entered');
            return response()->json(['message' => 'Invalid verification code'], 400);
        }

        // Generate recovery codes
        $recoveryCodes = collect(range(1, 8))->map(function () {
            return Str::random(10);
        })->toArray();

        // Enable 2FA for user
        $user->update([
            'two_factor_enabled' => true,
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => $recoveryCodes,
            'two_factor_confirmed_at' => now(),
        ]);

        // Clear temporary session
        session()->forget('2fa_temp_secret');

        ActivityLog::log('2fa_enabled', $user, 'Two-factor authentication enabled successfully');

        return response()->json([
            'message' => 'Two-factor authentication enabled successfully',
            'recovery_codes' => $recoveryCodes
        ]);
    }

    public function disable(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth()->user();

        if (!$user->two_factor_enabled) {
            return response()->json(['message' => 'Two-factor authentication is not enabled'], 400);
        }

        // Verify password
        if (!\Hash::check($request->password, $user->password)) {
            ActivityLog::log('2fa_disable_failed', $user, 'Invalid password provided for 2FA disable');
            return response()->json(['message' => 'Invalid password'], 400);
        }

        // Verify 2FA code
        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (!$valid) {
            ActivityLog::log('2fa_disable_failed', $user, 'Invalid 2FA code for disable');
            return response()->json(['message' => 'Invalid verification code'], 400);
        }

        // Disable 2FA
        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        ActivityLog::log('2fa_disabled', $user, 'Two-factor authentication disabled');

        return response()->json(['message' => 'Two-factor authentication disabled successfully']);
    }

    public function verifyLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user || !$user->two_factor_enabled) {
            return response()->json(['message' => 'Invalid request'], 400);
        }

        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (!$valid) {
            ActivityLog::log('2fa_login_failed', $user, 'Invalid 2FA code during login');
            return response()->json(['message' => 'Invalid verification code'], 400);
        }

        // Generate JWT token for authenticated user
        $token = auth('api')->login($user);

        ActivityLog::log('2fa_login_success', $user, 'Successful 2FA login');

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $user
        ]);
    }

    public function useRecoveryCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'recovery_code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user || !$user->two_factor_enabled) {
            return response()->json(['message' => 'Invalid request'], 400);
        }

        $recoveryCodes = $user->two_factor_recovery_codes ?? [];
        
        if (!in_array($request->recovery_code, $recoveryCodes)) {
            ActivityLog::log('2fa_recovery_failed', $user, 'Invalid recovery code used');
            return response()->json(['message' => 'Invalid recovery code'], 400);
        }

        // Remove used recovery code
        $remainingCodes = array_filter($recoveryCodes, fn($code) => $code !== $request->recovery_code);
        $user->update(['two_factor_recovery_codes' => array_values($remainingCodes)]);

        // Generate JWT token
        $token = auth('api')->login($user);

        ActivityLog::log('2fa_recovery_used', $user, 'Recovery code used for login');

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $user,
            'remaining_recovery_codes' => count($remainingCodes)
        ]);
    }

    public function getStatus()
    {
        $user = auth()->user();
        
        return response()->json([
            'two_factor_enabled' => $user->two_factor_enabled,
            'recovery_codes_count' => $user->two_factor_recovery_codes ? count($user->two_factor_recovery_codes) : 0
        ]);
    }
}