<x-mail::message>
# Reset Your Password

Hi {{ $user->name }},

We received a request to reset your password for your NovaWrite account. If you didn't make this request, you can safely ignore this email.

## Reset Your Password

Click the button below to reset your password. This link will expire in {{ $expiresIn }} for security reasons.

<x-mail::button :url="$resetUrl">
Reset Password
</x-mail::button>

## Security Notice

- This link will expire in {{ $expiresIn }}
- If you didn't request this password reset, please ignore this email
- For security, never share this link with anyone
- If you continue to have issues, contact our support team

## Need Help?

If you're having trouble with the button above, copy and paste the URL below into your web browser:

{{ $resetUrl }}

If you didn't request this password reset, no further action is required.

Best regards,<br>
**The NovaWrite Team**<br>
{{ config('app.name') }}
</x-mail::message>
