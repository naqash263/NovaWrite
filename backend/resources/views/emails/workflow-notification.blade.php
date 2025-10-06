<x-mail::message>
@if($type === 'new')
# New Workflow Available: {{ $workflow->title }} 📝
@elseif($type === 'updated')
# Workflow Updated: {{ $workflow->title }} 🔄
@elseif($type === 'approved')
# Workflow Approved: {{ $workflow->title }} ✅
@elseif($type === 'rejected')
# Workflow Update: {{ $workflow->title }} ❌
@else
# Workflow Notification: {{ $workflow->title }} 📋
@endif

Hi {{ $user->name }},

@if($type === 'new')
A new workflow has been added to your account: **{{ $workflow->title }}**. This workflow is now available for you to use in your writing projects.
@elseif($type === 'updated')
The workflow **{{ $workflow->title }}** has been updated with new content and improvements. Check out the latest version!
@elseif($type === 'approved')
Great news! Your workflow **{{ $workflow->title }}** has been approved and is now available for use.
@elseif($type === 'rejected')
We've reviewed your workflow **{{ $workflow->title }}** and it requires some modifications before it can be approved.
@else
There's an update regarding the workflow **{{ $workflow->title }}**.
@endif

## Workflow Details

**Title:** {{ $workflow->title }}  
**Description:** {{ $workflow->description ?? 'A professional writing workflow to enhance your productivity.' }}

## What You Can Do

- 📖 **View Workflow**: Access the complete workflow details
- 📝 **Start Using**: Begin implementing the workflow in your projects
- 💡 **Get Tips**: Learn best practices for effective writing
- 🎯 **Track Progress**: Monitor your workflow implementation

<x-mail::button :url="$workflowUrl">
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
**The NovaWrite Team**<br>
{{ config('app.name') }}
</x-mail::message>
