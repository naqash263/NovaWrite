<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\CareerToolUpdate;
use Illuminate\Http\Request;

class CareerToolController extends Controller
{
    /**
     * Trigger a career tool update notification (for testing)
     */
    public function triggerUpdate(Request $request)
    {
        $request->validate([
            'tool_name' => 'required|string|max:255',
            'update_type' => 'required|string|in:new_feature,improvement,fix',
            'data' => 'nullable|array'
        ]);

        // Dispatch event for push notifications
        event(new CareerToolUpdate(
            $request->tool_name,
            $request->update_type,
            $request->data ?? []
        ));

        return response()->json([
            'message' => 'Career tool update notification triggered successfully',
            'tool_name' => $request->tool_name,
            'update_type' => $request->update_type
        ]);
    }
}
