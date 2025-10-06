<x-mail::message>
# Welcome to {{ $course->title }}! 📚

Hi {{ $user->name }},

Congratulations! You've successfully enrolled in **{{ $course->title }}**. We're excited to have you join this course and start your learning journey.

## Course Details

**Course:** {{ $course->title }}  
**Description:** {{ $course->description ?? 'A comprehensive course designed to enhance your skills.' }}

## What's Next?

Your course is now available in your dashboard. Here's what you can do:

- 📖 **Start Learning**: Access course materials and lessons
- 📝 **Track Progress**: Monitor your completion status
- 💬 **Join Discussions**: Engage with other learners
- 🏆 **Earn Certificates**: Complete the course to earn your certificate

<x-mail::button :url="$courseUrl">
Start Course
</x-mail::button>

## Course Features

- Interactive lessons and materials
- Progress tracking
- Community discussions
- Certificate upon completion
- Lifetime access to course content

## Need Support?

If you have any questions about the course or need technical assistance, our support team is here to help.

Happy learning!

Best regards,<br>
**The NovaWrite Team**<br>
{{ config('app.name') }}
</x-mail::message>
