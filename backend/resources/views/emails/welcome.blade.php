<x-mail::message>
# Welcome to NovaWrite! 🚀

Hi {{ $user->name }},

Welcome to **NovaWrite** - your gateway to professional writing excellence! We're thrilled to have you join our community of writers, content creators, and professionals.

## What's Next?

Your account is now active and ready to use. Here's what you can do:

- 📚 **Explore Courses**: Browse our comprehensive writing courses
- 📝 **Access Workflows**: Get professional writing templates and guides
- 🎯 **Track Progress**: Monitor your learning journey
- 💡 **Join Community**: Connect with fellow writers

<x-mail::button :url="$loginUrl">
Get Started Now
</x-mail::button>

## Need Help?

If you have any questions or need assistance getting started, don't hesitate to reach out to our support team.

Happy writing!

Best regards,<br>
**The NovaWrite Team**<br>
{{ config('app.name') }}
</x-mail::message>
