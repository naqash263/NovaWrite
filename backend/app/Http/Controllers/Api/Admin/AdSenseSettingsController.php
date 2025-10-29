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
        try {
            // Check if table exists and has data
            if (!\Illuminate\Support\Facades\Schema::hasTable('ad_sense_settings')) {
                // Return empty array if table doesn't exist
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $settings = AdSenseSettings::orderBy('sort_order')
                ->orderBy('key')
                ->get();

            // If no settings exist, initialize defaults
            if ($settings->isEmpty()) {
                $this->initializeDefaults();
                $settings = AdSenseSettings::orderBy('sort_order')
                    ->orderBy('key')
                    ->get();
            }

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            \Log::error('AdSense settings index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Get active AdSense settings for frontend
     */
    public function getActive(): JsonResponse
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('ad_sense_settings')) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $settings = AdSenseSettings::active()
                ->orderBy('sort_order')
                ->pluck('value', 'key')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            \Log::error('AdSense getActive error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
    }

    /**
     * Store or update AdSense settings
     */
    public function store(Request $request): JsonResponse
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('ad_sense_settings')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Table does not exist. Please run migrations first.'
                ], 500);
            }

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
        } catch (\Exception $e) {
            \Log::error('AdSense settings store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Update a specific setting
     */
    public function update(Request $request, AdSenseSettings $adSenseSetting): JsonResponse
    {
        try {
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
        } catch (\Exception $e) {
            \Log::error('AdSense settings update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update setting',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Toggle active status
     */
    public function toggleActive(AdSenseSettings $adSenseSetting): JsonResponse
    {
        try {
            $adSenseSetting->update(['is_active' => !$adSenseSetting->is_active]);

            return response()->json([
                'success' => true,
                'message' => 'Setting status updated successfully',
                'data' => $adSenseSetting
            ]);
        } catch (\Exception $e) {
            \Log::error('AdSense settings toggle error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle setting',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Delete a setting
     */
    public function destroy(AdSenseSettings $adSenseSetting): JsonResponse
    {
        try {
            $adSenseSetting->delete();

            return response()->json([
                'success' => true,
                'message' => 'Setting deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('AdSense settings delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete setting',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Initialize default settings
     */
    private function initializeDefaults(): void
    {
        $defaultSettings = $this->getDefaultSettings();
        
        foreach ($defaultSettings as $setting) {
            AdSenseSettings::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    /**
     * Get default settings array
     */
    private function getDefaultSettings(): array
    {
        return [
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
    }

    /**
     * Reset to default settings
     */
    public function reset(): JsonResponse
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('ad_sense_settings')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Table does not exist. Please run migrations first.'
                ], 500);
            }

            // Delete all existing settings
            AdSenseSettings::truncate();

            // Create default settings
            $this->initializeDefaults();

            return response()->json([
                'success' => true,
                'message' => 'AdSense settings reset to defaults',
                'data' => AdSenseSettings::all()
            ]);
        } catch (\Exception $e) {
            \Log::error('AdSense settings reset error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }
}