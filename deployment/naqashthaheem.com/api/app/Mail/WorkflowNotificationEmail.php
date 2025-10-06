<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Workflow;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkflowNotificationEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;
    public Workflow $workflow;
    public string $type; // 'new', 'updated', 'approved', 'rejected'

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, Workflow $workflow, string $type = 'new')
    {
        $this->user = $user;
        $this->workflow = $workflow;
        $this->type = $type;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = match($this->type) {
            'new' => "New Workflow: {$this->workflow->title}",
            'updated' => "Updated Workflow: {$this->workflow->title}",
            'approved' => "Workflow Approved: {$this->workflow->title}",
            'rejected' => "Workflow Update: {$this->workflow->title}",
            default => "Workflow Notification: {$this->workflow->title}",
        };

        return new Envelope(
            subject: $subject,
            from: config('mail.from.address'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.workflow-notification',
            with: [
                'user' => $this->user,
                'workflow' => $this->workflow,
                'type' => $this->type,
                'workflowUrl' => config('app.url') . "/workflows/{$this->workflow->id}",
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
