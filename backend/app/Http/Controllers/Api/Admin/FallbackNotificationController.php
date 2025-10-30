<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailQueue;
use App\Models\N8nConfiguration;
use App\Services\FallbackWebhookNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FallbackNotificationController extends Controller
{
    public function notifyNow(FallbackWebhookNotifier $notifier): JsonResponse
    {
        $emails = EmailQueue::whereIn('status', ['failed','unsent'])->orderBy('created_at','desc')->limit(200)->get();
        $notifier->notifyAllEmails($emails);
        return response()->json(['success' => true, 'count' => $emails->count()]);
    }

    public function toggleAuto(Request $request): JsonResponse
    {
        $request->validate([
            'config_id' => 'required|integer|exists:n8n_configurations,id',
            'auto_notify_on_failure' => 'required|boolean',
        ]);

        $config = N8nConfiguration::findOrFail($request->config_id);
        $config->update(['auto_notify_on_failure' => $request->boolean('auto_notify_on_failure')]);

        return response()->json(['success' => true, 'data' => $config->fresh()]);
    }
}


