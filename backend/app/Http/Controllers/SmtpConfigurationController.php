<?php

namespace App\Http\Controllers;

use App\Models\SmtpConfiguration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class SmtpConfigurationController extends Controller
{
    public function __construct()
    {
        // Middleware is handled by the route group
    }

    /**
     * Display a listing of SMTP configurations
     */
    public function index(): JsonResponse
    {
        $configurations = SmtpConfiguration::orderBy('is_active', 'desc')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $configurations
        ]);
    }

    /**
     * Store a newly created SMTP configuration
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:smtp_configurations,name',
            'mailer' => 'required|string|in:smtp,sendmail,mailgun,ses,postmark,resend',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'username' => 'required|string|max:255',
            'password' => 'required|string',
            'encryption' => 'nullable|string|in:tls,ssl',
            'from_address' => 'required|email|max:255',
            'from_name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $configuration = SmtpConfiguration::create($request->all());

        // If this is set as active, deactivate others
        if ($request->boolean('is_active')) {
            $configuration->setAsActive();
        }

        // If this is set as default, remove default from others
        if ($request->boolean('is_default')) {
            $configuration->setAsDefault();
        }

        return response()->json([
            'success' => true,
            'message' => 'SMTP configuration created successfully',
            'data' => $configuration
        ], 201);
    }

    /**
     * Display the specified SMTP configuration
     */
    public function show(string $id): JsonResponse
    {
        $configuration = SmtpConfiguration::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $configuration
        ]);
    }

    /**
     * Update the specified SMTP configuration
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $configuration = SmtpConfiguration::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255|unique:smtp_configurations,name,' . $id,
            'mailer' => 'sometimes|string|in:smtp,sendmail,mailgun,ses,postmark,resend',
            'host' => 'sometimes|string|max:255',
            'port' => 'sometimes|integer|min:1|max:65535',
            'username' => 'sometimes|string|max:255',
            'password' => 'sometimes|string',
            'encryption' => 'nullable|string|in:tls,ssl',
            'from_address' => 'sometimes|email|max:255',
            'from_name' => 'sometimes|string|max:255',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $configuration->update($request->all());

        // If this is set as active, deactivate others
        if ($request->has('is_active') && $request->boolean('is_active')) {
            $configuration->setAsActive();
        }

        // If this is set as default, remove default from others
        if ($request->has('is_default') && $request->boolean('is_default')) {
            $configuration->setAsDefault();
        }

        return response()->json([
            'success' => true,
            'message' => 'SMTP configuration updated successfully',
            'data' => $configuration
        ]);
    }

    /**
     * Remove the specified SMTP configuration
     */
    public function destroy(string $id): JsonResponse
    {
        $configuration = SmtpConfiguration::findOrFail($id);

        // Don't allow deletion of the last configuration
        if (SmtpConfiguration::count() <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the last SMTP configuration'
            ], 422);
        }

        $configuration->delete();

        return response()->json([
            'success' => true,
            'message' => 'SMTP configuration deleted successfully'
        ]);
    }

    /**
     * Test SMTP configuration
     */
    public function test(Request $request, string $id): JsonResponse
    {
        $configuration = SmtpConfiguration::findOrFail($id);
        $testEmail = $request->get('test_email', $configuration->from_address);

        $result = $configuration->testConfiguration($testEmail);

        return response()->json($result);
    }

    /**
     * Set configuration as active
     */
    public function setActive(string $id): JsonResponse
    {
        $configuration = SmtpConfiguration::findOrFail($id);
        $configuration->setAsActive();

        return response()->json([
            'success' => true,
            'message' => 'SMTP configuration set as active',
            'data' => $configuration
        ]);
    }

    /**
     * Set configuration as default
     */
    public function setDefault(string $id): JsonResponse
    {
        $configuration = SmtpConfiguration::findOrFail($id);
        $configuration->setAsDefault();

        return response()->json([
            'success' => true,
            'message' => 'SMTP configuration set as default',
            'data' => $configuration
        ]);
    }

    /**
     * Get mailer types
     */
    public function getMailerTypes(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => SmtpConfiguration::getMailerTypes()
        ]);
    }

    /**
     * Get encryption types
     */
    public function getEncryptionTypes(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => SmtpConfiguration::getEncryptionTypes()
        ]);
    }

    /**
     * Get common ports
     */
    public function getCommonPorts(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => SmtpConfiguration::getCommonPorts()
        ]);
    }

    /**
     * Get active configuration
     */
    public function getActive(): JsonResponse
    {
        $configuration = SmtpConfiguration::getActive();

        if (!$configuration) {
            return response()->json([
                'success' => false,
                'message' => 'No active SMTP configuration found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $configuration
        ]);
    }

    /**
     * Get default configuration
     */
    public function getDefault(): JsonResponse
    {
        $configuration = SmtpConfiguration::getDefault();

        if (!$configuration) {
            return response()->json([
                'success' => false,
                'message' => 'No default SMTP configuration found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $configuration
        ]);
    }

    /**
     * Duplicate configuration
     */
    public function duplicate(string $id): JsonResponse
    {
        $originalConfiguration = SmtpConfiguration::findOrFail($id);
        
        $newConfiguration = $originalConfiguration->replicate();
        $newConfiguration->name = $originalConfiguration->name . '_copy_' . time();
        $newConfiguration->is_active = false;
        $newConfiguration->is_default = false;
        $newConfiguration->save();

        return response()->json([
            'success' => true,
            'message' => 'SMTP configuration duplicated successfully',
            'data' => $newConfiguration
        ], 201);
    }
}
