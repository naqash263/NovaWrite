<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSettings;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class HomeSettingsController extends Controller
{
    /**
     * Display a listing of home settings.
     */
    public function index(): JsonResponse
    {
        $settings = HomeSettings::orderBy('sort_order')->get();
        
        return response()->json([
            'settings' => $settings,
            'grouped' => $settings->groupBy('type')
        ]);
    }

    /**
     * Store a newly created home setting.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'key' => 'required|string|max:255|unique:home_settings,key',
            'type' => 'required|string|in:text,image,boolean,json',
            'value' => 'nullable|string',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $setting = HomeSettings::create($request->all());

        return response()->json([
            'message' => 'Home setting created successfully',
            'setting' => $setting
        ], 201);
    }

    /**
     * Display the specified home setting.
     */
    public function show(HomeSettings $homeSetting): JsonResponse
    {
        return response()->json(['setting' => $homeSetting]);
    }

    /**
     * Update the specified home setting.
     */
    public function update(Request $request, HomeSettings $homeSetting): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'key' => 'sometimes|string|max:255|unique:home_settings,key,' . $homeSetting->id,
            'type' => 'sometimes|string|in:text,image,boolean,json',
            'value' => 'nullable|string',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $homeSetting->update($request->all());

        return response()->json([
            'message' => 'Home setting updated successfully',
            'setting' => $homeSetting
        ]);
    }

    /**
     * Remove the specified home setting.
     */
    public function destroy(HomeSettings $homeSetting): JsonResponse
    {
        // If it's an image setting, delete the file
        if ($homeSetting->type === 'image' && $homeSetting->value) {
            Storage::disk('public')->delete($homeSetting->value);
        }

        $homeSetting->delete();

        return response()->json([
            'message' => 'Home setting deleted successfully'
        ]);
    }

    /**
     * Upload image for home setting
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'key' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $file = $request->file('image');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('home-images', $filename, 'public');

        // Update or create the setting
        $setting = HomeSettings::updateOrCreate(
            ['key' => $request->key],
            [
                'type' => 'image',
                'value' => $path,
                'title' => ucfirst(str_replace('_', ' ', $request->key)),
                'is_active' => true,
            ]
        );

        return response()->json([
            'message' => 'Image uploaded successfully',
            'setting' => $setting,
            'image_url' => Storage::disk('public')->url($path)
        ]);
    }

    /**
     * Get public home settings (for frontend display)
     */
    public function getPublicSettings(): JsonResponse
    {
        $settings = HomeSettings::active()
            ->orderBy('sort_order')
            ->get()
            ->map(function ($setting) {
                $data = [
                    'key' => $setting->key,
                    'type' => $setting->type,
                    'value' => $setting->value,
                ];

                // For images, return the full URL
                if ($setting->type === 'image' && $setting->value) {
                    $data['image_url'] = Storage::disk('public')->url($setting->value);
                }

                return $data;
            });

        return response()->json([
            'settings' => $settings,
            'grouped' => $settings->groupBy('type')
        ]);
    }

    /**
     * Bulk update settings
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        foreach ($request->settings as $settingData) {
            HomeSettings::where('key', $settingData['key'])
                ->update(['value' => $settingData['value']]);
        }

        return response()->json([
            'message' => 'Settings updated successfully'
        ]);
    }

    /**
     * Toggle setting active status
     */
    public function toggleActive(HomeSettings $homeSetting): JsonResponse
    {
        $homeSetting->update(['is_active' => !$homeSetting->is_active]);

        return response()->json([
            'message' => 'Setting status updated successfully',
            'setting' => $homeSetting
        ]);
    }
}