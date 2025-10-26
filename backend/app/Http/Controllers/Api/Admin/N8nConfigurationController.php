<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\N8nConfiguration;
use App\Services\N8nEmailService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class N8nConfigurationController extends Controller
{
    protected $n8nService;

    public function __construct(N8nEmailService $n8nService)
    {
        $this->n8nService = $n8nService;
    }

    /**
     * Display a listing of N8n configurations.
     */
    public function index(): JsonResponse
    {
        $configurations = N8nConfiguration::orderBy('is_active', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $configurations
        ]);
    }

    /**
     * Store a newly created N8n configuration.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), N8nConfiguration::rules());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $configuration = N8nConfiguration::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'N8n configuration created successfully',
            'data' => $configuration
        ], 201);
    }

    /**
     * Display the specified N8n configuration.
     */
    public function show(N8nConfiguration $n8nConfiguration): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $n8nConfiguration
        ]);
    }

    /**
     * Update the specified N8n configuration.
     */
    public function update(Request $request, N8nConfiguration $n8nConfiguration): JsonResponse
    {
        $validator = Validator::make($request->all(), N8nConfiguration::rules());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $n8nConfiguration->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'N8n configuration updated successfully',
            'data' => $n8nConfiguration
        ]);
    }

    /**
     * Remove the specified N8n configuration.
     */
    public function destroy(N8nConfiguration $n8nConfiguration): JsonResponse
    {
        if ($n8nConfiguration->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete active configuration. Please activate another configuration first.'
            ], 422);
        }

        $n8nConfiguration->delete();

        return response()->json([
            'success' => true,
            'message' => 'N8n configuration deleted successfully'
        ]);
    }

    /**
     * Activate the specified N8n configuration.
     */
    public function activate($id): JsonResponse
    {
        $n8nConfiguration = N8nConfiguration::findOrFail($id);
        
        $n8nConfiguration->activate();

        return response()->json([
            'success' => true,
            'message' => 'N8n configuration activated successfully',
            'data' => $n8nConfiguration->fresh()
        ]);
    }

    /**
     * Deactivate the specified N8n configuration.
     */
    public function deactivate($id): JsonResponse
    {
        $n8nConfiguration = N8nConfiguration::findOrFail($id);
        
        $n8nConfiguration->deactivate();

        return response()->json([
            'success' => true,
            'message' => 'N8n configuration deactivated successfully',
            'data' => $n8nConfiguration->fresh()
        ]);
    }

    /**
     * Test the N8n webhook connection.
     */
    public function test($id): JsonResponse
    {
        $n8nConfiguration = N8nConfiguration::findOrFail($id);
        
        $result = $this->n8nService->testConnection($n8nConfiguration);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result
        ]);
    }
}