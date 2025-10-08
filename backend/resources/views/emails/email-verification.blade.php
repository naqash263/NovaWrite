@component('mail::message')
# Verify Your Email Address

Hello {{ $user->name }},

Thank you for registering with {{ config('app.name') }}! To complete your registration and start using your account, please verify your email address by clicking the button below.

@component('mail::button', ['url' => $verificationUrl])
Verify Email Address
@endcomponent

If you didn't create an account with {{ config('app.name') }}, you can safely ignore this email.

**Important:** This verification link will expire in 24 hours for security reasons.

If the button above doesn't work, you can copy and paste the following link into your browser:

{{ $verificationUrl }}

Thanks,<br>
{{ config('app.name') }} Team

---

**Need help?** If you're having trouble verifying your email, please contact our support team at {{ config('mail.from.address') }}.
@endcomponent

