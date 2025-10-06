@component('mail::message')
# Reset Your Password

Hello {{ $user->name }},

You requested to reset your password for your NovaWrite account. Click the button below to reset your password:

@component('mail::button', ['url' => $resetUrl])
Reset Password
@endcomponent

**Important:** This reset link will expire in {{ $expiresIn }} for security reasons.

If the button above doesn't work, you can copy and paste the following link into your browser:

{{ $resetUrl }}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Thanks,<br>
{{ config('app.name') }} Team
@endcomponent