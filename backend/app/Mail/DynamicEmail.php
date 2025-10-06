<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DynamicEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $emailSubject;
    public string $body;
    public string $type;
    public array $variables;

    /**
     * Create a new message instance.
     */
    public function __construct(string $templateName, array $variables = [])
    {
        $template = EmailTemplate::getByName($templateName);
        
        if (!$template) {
            throw new \Exception("Email template '{$templateName}' not found");
        }

        $rendered = $template->render($variables);

        $this->emailSubject = $rendered['subject'];
        $this->body = $rendered['body'];
        $this->type = $rendered['type'];
        $this->variables = $variables;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->emailSubject,
            from: config('mail.from.address'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        if ($this->type === 'html') {
            return new Content(
                html: 'emails.dynamic-html',
                with: [
                    'body' => $this->body,
                    'variables' => $this->variables,
                ]
            );
        }

        return new Content(
            markdown: 'emails.dynamic',
            with: [
                'body' => $this->body,
                'variables' => $this->variables,
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
