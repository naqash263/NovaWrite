<?php

namespace App\Services;

use App\Models\FallbackWebhook;
use App\Models\EmailQueue;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class FallbackWebhookNotifier
{
    protected Client $client;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 15,
        ]);
    }

    /**
     * Notify all active webhooks with a collection of failed/unsent emails
     */
    public function notifyAllEmails($emails): void
    {
        $payload = [
            'emails' => $emails->map(function ($e) {
                return $this->serializeEmail($e);
            })->values()->all()
        ];

        $this->postToAllWebhooks($payload);
    }

    /**
     * Notify all active webhooks about a single failed email
     */
    public function notifySingleEmail(EmailQueue $email): void
    {
        $payload = [
            'emails' => [ $this->serializeEmail($email) ]
        ];

        $this->postToAllWebhooks($payload);
    }

    protected function postToAllWebhooks(array $payload): void
    {
        $webhooks = FallbackWebhook::where('is_active', true)->get();
        foreach ($webhooks as $wh) {
            try {
                $this->client->post($wh->url, [
                    'json' => $payload,
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ]
                ]);
                Log::info('Fallback webhook notified', ['url' => $wh->url, 'count' => count($payload['emails'])]);
            } catch (\Throwable $t) {
                Log::warning('Fallback webhook notify failed', ['url' => $wh->url, 'error' => $t->getMessage()]);
            }
        }
    }

    protected function serializeEmail(EmailQueue $email): array
    {
        return [
            'id' => $email->id,
            'action' => $email->action,
            'recipient_email' => $email->recipient_email,
            'recipient_name' => $email->recipient_name,
            'details' => $email->details,
            'status' => $email->status,
            'last_error' => $email->last_error,
            'attempts' => $email->attempts,
            'max_attempts' => $email->max_attempts,
            'created_at' => optional($email->created_at)->toISOString(),
            'updated_at' => optional($email->updated_at)->toISOString(),
            'completed_at' => optional($email->completed_at)->toISOString(),
        ];
    }
}


