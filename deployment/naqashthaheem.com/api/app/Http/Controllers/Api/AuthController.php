<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\EmailVerificationMail;
use App\Mail\PasswordResetEmail;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Generate email verification token
        $verificationToken = $user->generateEmailVerificationToken();
        $verificationUrl = config('app.url') . '/verify-email?token=' . $verificationToken . '&email=' . urlencode($user->email);

        // Send verification email
        try {
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationUrl));
        } catch (\Exception $e) {
            // Log error but don't fail registration
            \Log::error('Failed to send verification email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Registration successful! Please check your email to verify your account.',
            'user' => $user,
            'email_verification_required' => true,
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
            'remember_me' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $credentials = $request->only('email', 'password');
        $rememberMe = $request->boolean('remember_me', false);

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = auth('api')->user();

        // Check if email is verified
        if (!$user->hasVerifiedEmail()) {
            auth('api')->logout(); // Logout the user
            return response()->json([
                'error' => 'Email not verified',
                'message' => 'Please verify your email address before logging in.',
                'email_verification_required' => true,
            ], 403);
        }

        // Set token expiration based on remember me
        if ($rememberMe) {
            // Extend token expiration to 30 days for remember me
            $token = auth('api')->setTTL(60 * 24 * 30)->attempt($credentials);
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
            'expires_in' => $rememberMe ? 60 * 24 * 30 : config('jwt.ttl'), // Return expiration info
        ]);
    }

    public function me()
    {
        return response()->json(auth('api')->user());
    }

    public function logout()
    {
        auth('api')->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh()
    {
        return response()->json([
            'token' => auth('api')->refresh(),
        ]);
    }

    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)
            ->where('email_verification_token', $request->token)
            ->first();

        if (!$user) {
            return response()->json([
                'error' => 'Invalid verification token or email',
                'message' => 'The verification link is invalid or has expired.',
            ], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified',
            ], 200);
        }

        // Verify the email
        $user->markEmailAsVerified();

        // Send welcome email after verification
        try {
            $emailService = app(EmailService::class);
            $emailService->sendWelcomeEmail($user);
        } catch (\Exception $e) {
            \Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Email verified successfully! You can now log in.',
            'user' => $user,
        ], 200);
    }

    public function resendVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified',
            ], 200);
        }

        // Generate new verification token
        $verificationToken = $user->generateEmailVerificationToken();
        $verificationUrl = config('app.url') . '/verify-email?token=' . $verificationToken . '&email=' . urlencode($user->email);

        // Send verification email
        try {
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationUrl));
            
            // For development: include verification link in response
            $isDevelopment = config('app.env') === 'local' || config('mail.default') === 'log';
            
            $response = [
                'message' => 'Verification email sent successfully!',
            ];
            
            if ($isDevelopment) {
                $response['verification_url'] = $verificationUrl;
                $response['note'] = 'Development mode: Email logged to storage/logs/laravel.log. Use the verification_url to verify your email.';
            }
            
            return response()->json($response, 200);
        } catch (\Exception $e) {
            \Log::error('Failed to resend verification email: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to send verification email',
                'message' => 'Please try again later.',
            ], 500);
        }
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();

        // Generate password reset token
        $resetToken = Str::random(64);
        $user->password_reset_token = $resetToken;
        $user->password_reset_expires_at = now()->addHour();
        $user->save();

        $resetUrl = config('app.url') . '/reset-password?token=' . $resetToken . '&email=' . urlencode($user->email);

        // Send password reset email
        try {
            Mail::to($user->email)->send(new PasswordResetEmail($user, $resetUrl));
            
            // For development: include reset link in response
            $isDevelopment = config('app.env') === 'local' || config('mail.default') === 'log';
            
            $response = [
                'message' => 'Password reset email sent successfully!',
            ];
            
            if ($isDevelopment) {
                $response['reset_url'] = $resetUrl;
                $response['note'] = 'Development mode: Email logged to storage/logs/laravel.log. Use the reset_url to reset your password.';
            }
            
            return response()->json($response, 200);
        } catch (\Exception $e) {
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to send password reset email',
                'message' => 'Please try again later.',
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)
            ->where('password_reset_token', $request->token)
            ->where('password_reset_expires_at', '>', now())
            ->first();

        if (!$user) {
            return response()->json([
                'error' => 'Invalid or expired reset token',
                'message' => 'The password reset link is invalid or has expired. Please request a new one.',
            ], 400);
        }

        // Update password and clear reset token
        $user->password = Hash::make($request->password);
        $user->password_reset_token = null;
        $user->password_reset_expires_at = null;
        $user->save();

        return response()->json([
            'message' => 'Password reset successfully!',
        ], 200);
    }
}
