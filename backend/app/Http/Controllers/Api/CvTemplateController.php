<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CvTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CvTemplateController extends Controller
{
    /**
     * Display a listing of active CV templates for users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CvTemplate::active();

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->byCategory($request->category);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $templates = $query->select([
            'id', 'name', 'description', 'thumbnail', 'category', 
            'ats_score', 'customizable_options', 'html_content', 'json_config', 'field_mappings', 'created_at'
        ])->orderBy('is_default', 'desc')
          ->orderBy('created_at', 'desc')
          ->get();

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Display the specified CV template for rendering.
     */
    public function show(CvTemplate $cvTemplate): JsonResponse
    {
        if (!$cvTemplate->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $cvTemplate->id,
                'name' => $cvTemplate->name,
                'html_content' => $cvTemplate->html_content,
                'json_config' => $cvTemplate->json_config,
                'customizable_options' => $cvTemplate->customizable_options,
                'ats_score' => $cvTemplate->ats_score,
                'category' => $cvTemplate->category,
            ]
        ]);
    }

    /**
     * Apply user customizations to template.
     */
    public function customize(Request $request): JsonResponse
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'template_id' => 'required|exists:cv_templates,id',
            'customizations' => 'required|array',
            'customizations.primaryColor' => 'nullable|string',
            'customizations.secondaryColor' => 'nullable|string',
            'customizations.fontFamily' => 'nullable|string',
            'customizations.fontSize' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $template = CvTemplate::findOrFail($request->template_id);

        if (!$template->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }

        // Validate customizations against allowed options
        $allowedCustomizations = $template->customizable_options ?? [];
        $customizations = $request->customizations;
        $validatedCustomizations = [];

        foreach ($customizations as $key => $value) {
            if (in_array($key, $allowedCustomizations)) {
                $validatedCustomizations[$key] = $value;
            }
        }

        // Apply customizations to HTML
        $customizedHtml = $template->applyCustomizations($validatedCustomizations);

        return response()->json([
            'success' => true,
            'data' => [
                'template_id' => $template->id,
                'customized_html' => $customizedHtml,
                'applied_customizations' => $validatedCustomizations,
                'json_config' => $template->json_config,
            ]
        ]);
    }

    /**
     * Get template categories.
     */
    public function categories(): JsonResponse
    {
        $categories = CvTemplate::active()
            ->select('category')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Get default template.
     */
    public function default(): JsonResponse
    {
        $defaultTemplate = CvTemplate::getDefault();

        if (!$defaultTemplate) {
            return response()->json([
                'success' => false,
                'message' => 'No default template found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $defaultTemplate->id,
                'name' => $defaultTemplate->name,
                'html_content' => $defaultTemplate->html_content,
                'json_config' => $defaultTemplate->json_config,
                'customizable_options' => $defaultTemplate->customizable_options,
                'ats_score' => $defaultTemplate->ats_score,
                'category' => $defaultTemplate->category,
            ]
        ]);
    }
}