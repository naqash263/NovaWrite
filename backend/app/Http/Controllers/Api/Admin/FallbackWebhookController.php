<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\FallbackWebhook;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class FallbackWebhookController extends Controller
{
    public function index(): JsonResponse
    {
        $hooks = FallbackWebhook::orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $hooks]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = \Validator::make($request->all(), [
            'url' => 'required|url|max:1000',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $hook = FallbackWebhook::create($request->only(['url','description','is_active']));
        return response()->json(['success' => true, 'data' => $hook], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $hook = FallbackWebhook::findOrFail($id);
        $validator = \Validator::make($request->all(), [
            'url' => 'sometimes|required|url|max:1000',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $hook->update($request->only(['url','description','is_active']));
        return response()->json(['success' => true, 'data' => $hook]);
    }

    public function destroy($id): JsonResponse
    {
        $hook = FallbackWebhook::findOrFail($id);
        $hook->delete();
        return response()->json(['success' => true]);
    }
}


