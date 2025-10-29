<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdSenseSettings;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AdSenseSettingsController extends Controller
{
    /**
     * Display all AdSense settings
     */
    public function index(): JsonResponse
    {
        $settings = AdSenseSettings::orderBy('sort_order')
            ->orderBy('key')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Get active AdSense settings for frontend
     */
    public function getActive(): JsonResponse
    {
        $settings = AdSenseSettings::active()
            ->orderBy('sort_order')
            ->pluck('value', 'key')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Store or update AdSense settings
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|max:255',
            'settings.*.value' => 'nullable|string',
            'settings.*.title' => 'nullable|string|max:255',
            'settings.*.description' => 'nullable|string',
            'settings.*.is_active' => 'nullable|boolean',
            'settings.*.sort_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updated = [];
        
        foreach ($request->settings as $settingData) {
            $setting = AdSenseSettings::updateOrCreate(
                ['key' => $settingData['key']],
                [
                    'value' => $settingData['value'] ?? '',
                    'title' => $settingData['title'] ?? ucfirst(str_replace('_', ' ', $settingData['key'])),
                    'description' => $settingData['description'] ?? null,
                    'is_active' => $settingData['is_active'] ?? true,
                    'sort_order' => $settingData['sort_order'] ?? 0,
                ]
            );
            $updated[] = $setting;
        }

        return response()->json([
            'success' => true,
            'message' => 'AdSense settings saved successfully',
            'data' => $updated
        ]);
    }

    /**
     * Update a specific setting
     */
    public function update(Request $request, AdSenseSettings $adSenseSetting): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'value' => 'nullable|string',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $adSenseSetting->update($request->only([
            'value',
            'title',
            'description',
            'is_active',
            'sort_order'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Setting updated successfully',
            'data' => $adSenseSetting
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggleActive(AdSenseSettings $adSenseSetting): JsonResponse
    {
        $adSenseSetting->update(['is_active' => !$adSenseSetting->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Setting status updated successfully',
            'data' => $adSenseSetting
        ]);
    }

    /**
     * Delete a setting
     */
    public function destroy(AdSenseSettings $adSenseSetting): JsonResponse
    {
        $adSenseSetting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Setting deleted successfully'
        ]);
    }

    /**
     * Reset to default settings
     */
    public function reset(): JsonResponse
    {
        // Delete all existing settings
        AdSenseSettings::truncate();

        // Create default settings
        $defaultSettings = [
            [
                'key' => 'client_id',
                'value' => '',
                'title' => 'Publisher ID',
                'description' => 'Your Google AdSense Publisher ID (ca-pub-XXXXXXXXXX)',
                'is_active' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'slot_header',
                'value' => '',
                'title' => 'Header Ad Slot',
                'description' => 'Ad unit ID for header/banner ads',
                'is_active' => false,
                'sort_order' => 2,
            ],
            [
                'key' => 'slot_sidebar',
                'value' => '',
                'title' => 'Sidebar Ad Slot',
                'description' => 'Ad unit ID for sidebar ads',
                'is_active' => false,
                'sort_order' => 3,
            ],
            [
                'key' => 'slot_content_top',
                'value' => '',
                'title' => 'Content Top Ad Slot',
                'description' => 'Ad unit ID for top of content area',
                'is_active' => false,
                'sort_order' => 4,
            ],
            [
                'key' => 'slot_content_middle',
                'value' => '',
                'title' => 'Content Middle Ad Slot',
                'description' => 'Ad unit ID for middle of content',
                'is_active' => false,
                'sort_order' => 5,
            ],
            [
                'key' => 'slot_content_bottom',
                'value' => '',
                'title' => 'Content Bottom Ad Slot',
                'description' => 'Ad unit ID for bottom of content',
                'is_active' => false,
                'sort_order' => 6,
            ],
            [
                'key' => 'slot_footer',
                'value' => '',
                'title' => 'Footer Ad Slot',
                'description' => 'Ad unit ID for footer ads',
                'is_active' => false,
                'sort_order' => 7,
            ],
            [
                'key' => 'slot_between_posts',
                'value' => '',
                'title' => 'Between Posts Ad Slot',
                'description' => 'Ad unit ID for ads between blog posts',
                'is_active' => false,
                'sort_order' => 8,
            ],
            [
                'key' => 'enabled',
                'value' => 'false',
                'title' => 'Enable AdSense',
                'description' => 'Master switch to enable/disable all AdSense ads',
                'is_active' => false,
                'sort_order' => 0,
            ],
        ];

        foreach ($defaultSettings as $setting) {
            AdSenseSettings::create($setting);
        }

        return response()->json([
            'success' => true,
            'message' => 'AdSense settings reset to defaults',
            'data' => AdSenseSettings::all()
        ]);
    }
}