<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'welcome',
                'subject' => 'Welcome to {{app_name}}! 🚀',
                'body' => '# Welcome to {{app_name}}! 🚀

Hi {{user_name}},

Welcome to **{{app_name}}** - your gateway to professional writing excellence! We\'re thrilled to have you join our community of writers, content creators, and professionals.

## What\'s Next?

Your account is now active and ready to use. Here\'s what you can do:

- 📚 **Explore Courses**: Browse our comprehensive writing courses
- 📝 **Access Workflows**: Get professional writing templates and guides
- 🎯 **Track Progress**: Monitor your learning journey
- 💡 **Join Community**: Connect with fellow writers

<x-mail::button :url="{{login_url}}">
Get Started Now
</x-mail::button>

## Need Help?

If you have any questions or need assistance getting started, don\'t hesitate to reach out to our support team.

Happy writing!

Best regards,<br>
**The {{app_name}} Team**',
                'type' => 'markdown',
                'variables' => ['user_name', 'user_email', 'app_name', 'app_url', 'login_url'],
                'description' => 'Welcome email sent to new users upon registration',
                'category' => 'user',
                'is_active' => true,
            ],
            [
                'name' => 'password_reset',
                'subject' => 'Reset Your {{app_name}} Password',
                'body' => '# Reset Your Password

Hi {{user_name}},

We received a request to reset your password for your {{app_name}} account. If you didn\'t make this request, you can safely ignore this email.

## Reset Your Password

Click the button below to reset your password. This link will expire in {{expires_in}} for security reasons.

<x-mail::button :url="{{reset_url}}">
Reset Password
</x-mail::button>

## Security Notice

- This link will expire in {{expires_in}}
- If you didn\'t request this password reset, please ignore this email
- For security, never share this link with anyone
- If you continue to have issues, contact our support team

## Need Help?

If you\'re having trouble with the button above, copy and paste the URL below into your web browser:

{{reset_url}}

If you didn\'t request this password reset, no further action is required.

Best regards,<br>
**The {{app_name}} Team**',
                'type' => 'markdown',
                'variables' => ['user_name', 'user_email', 'reset_url', 'expires_in', 'app_name'],
                'description' => 'Password reset email with secure reset link',
                'category' => 'user',
                'is_active' => true,
            ],
            [
                'name' => 'course_enrollment',
                'subject' => 'Welcome to {{course_title}}! 📚',
                'body' => '# Welcome to {{course_title}}! 📚

Hi {{user_name}},

Congratulations! You\'ve successfully enrolled in **{{course_title}}**. We\'re excited to have you join this course and start your learning journey.

## Course Details

**Course:** {{course_title}}  
**Description:** {{course_description}}

## What\'s Next?

Your course is now available in your dashboard. Here\'s what you can do:

- 📖 **Start Learning**: Access course materials and lessons
- 📝 **Track Progress**: Monitor your completion status
- 💬 **Join Discussions**: Engage with other learners
- 🏆 **Earn Certificates**: Complete the course to earn your certificate

<x-mail::button :url="{{course_url}}">
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
**The {{app_name}} Team**',
                'type' => 'markdown',
                'variables' => ['user_name', 'course_title', 'course_description', 'course_url', 'app_name'],
                'description' => 'Course enrollment confirmation email',
                'category' => 'course',
                'is_active' => true,
            ],
            [
                'name' => 'workflow_notification',
                'subject' => 'New Workflow: {{workflow_title}} 📝',
                'body' => '# New Workflow Available: {{workflow_title}} 📝

Hi {{user_name}},

A new workflow has been added to your account: **{{workflow_title}}**. This workflow is now available for you to use in your writing projects.

## Workflow Details

**Title:** {{workflow_title}}  
**Description:** {{workflow_description}}

## What You Can Do

- 📖 **View Workflow**: Access the complete workflow details
- 📝 **Start Using**: Begin implementing the workflow in your projects
- 💡 **Get Tips**: Learn best practices for effective writing
- 🎯 **Track Progress**: Monitor your workflow implementation

<x-mail::button :url="{{workflow_url}}">
View Workflow
</x-mail::button>

## Workflow Benefits

- Streamlined writing process
- Professional templates and guides
- Step-by-step instructions
- Best practices and tips
- Improved productivity and quality

## Need Help?

If you have questions about this workflow or need assistance implementing it, our support team is ready to help.

Happy writing!

Best regards,<br>
**The {{app_name}} Team**',
                'type' => 'markdown',
                'variables' => ['user_name', 'workflow_title', 'workflow_description', 'workflow_url', 'app_name'],
                'description' => 'Workflow notification email for new or updated workflows',
                'category' => 'workflow',
                'is_active' => true,
            ],
            [
                'name' => 'newsletter',
                'subject' => '{{app_name}} Newsletter - {{date}}',
                'body' => '# {{app_name}} Newsletter

Hi {{user_name}},

Welcome to our weekly newsletter! Here\'s what\'s new and exciting in the world of professional writing.

## This Week\'s Highlights

{{newsletter_content}}

## Featured Content

- **New Course**: {{featured_course}}
- **Popular Workflow**: {{featured_workflow}}
- **Community Spotlight**: {{community_spotlight}}

## Quick Tips

{{quick_tips}}

## Stay Connected

Follow us on social media for daily writing tips and updates:

- Twitter: @{{app_name}}
- LinkedIn: {{app_name}}
- Facebook: {{app_name}}

<x-mail::button :url="{{app_url}}">
Visit {{app_name}}
</x-mail::button>

Thanks for being part of our community!

Best regards,<br>
**The {{app_name}} Team**',
                'type' => 'markdown',
                'variables' => ['user_name', 'app_name', 'date', 'newsletter_content', 'featured_course', 'featured_workflow', 'community_spotlight', 'quick_tips', 'app_url'],
                'description' => 'Newsletter template for marketing communications',
                'category' => 'marketing',
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['name' => $template['name']],
                $template
            );
        }
    }
}
