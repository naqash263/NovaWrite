<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class EmailTemplateController extends Controller
{
    /**
     * Display a listing of email templates
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailTemplate::query();

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by language
        if ($request->has('language') && $request->language !== 'all') {
            $query->where('language', $request->language);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by system status
        if ($request->has('is_system')) {
            $query->where('is_system', $request->boolean('is_system'));
        }

        // Search by name or subject
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $templates = $query->paginate($perPage);

        return response()->json([
            'data' => $templates->items(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
            ],
            'filters' => [
                'categories' => EmailTemplate::getCategories(),
                'types' => EmailTemplate::getTypes(),
                'languages' => ['en' => 'English', 'es' => 'Spanish', 'fr' => 'French'],
            ]
        ]);
    }

    /**
     * Store a newly created email template
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:email_templates,name',
            'subject' => 'required|string|max:500',
            'body' => 'required|string',
            'description' => 'nullable|string',
            'type' => ['required', Rule::in(['html', 'markdown'])],
            'category' => 'required|string|max:100',
            'variables' => 'nullable|array',
            'variables.*' => 'string',
            'metadata' => 'nullable|array',
            'is_active' => 'boolean',
            'is_system' => 'boolean',
            'language' => 'string|max:5',
        ]);

        // Auto-detect variables from content
        $detectedVariables = [];
        $content = $validated['subject'] . ' ' . $validated['body'];
        preg_match_all('/\{\{([^}]+)\}\}/', $content, $matches);
        if (!empty($matches[1])) {
            $detectedVariables = array_unique($matches[1]);
            sort($detectedVariables);
        }
        $validated['variables'] = $detectedVariables;

        $template = EmailTemplate::create($validated);

        return response()->json([
            'message' => 'Email template created successfully',
            'data' => $template
        ], 201);
    }

    /**
     * Display the specified email template
     */
    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        return response()->json([
            'data' => $emailTemplate
        ]);
    }

    /**
     * Update the specified email template
     */
    public function update(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        // Prevent updating system templates
        if ($emailTemplate->is_system) {
            return response()->json([
                'message' => 'System templates cannot be modified'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:email_templates,name,' . $emailTemplate->id,
            'subject' => 'sometimes|string|max:500',
            'body' => 'sometimes|string',
            'description' => 'nullable|string',
            'type' => ['sometimes', Rule::in(['html', 'markdown'])],
            'category' => 'sometimes|string|max:100',
            'variables' => 'nullable|array',
            'variables.*' => 'string',
            'metadata' => 'nullable|array',
            'is_active' => 'boolean',
            'language' => 'string|max:5',
        ]);

        // Auto-detect variables if body or subject is being updated
        if (isset($validated['body']) || isset($validated['subject'])) {
            $content = ($validated['subject'] ?? $emailTemplate->subject) . ' ' . ($validated['body'] ?? $emailTemplate->body);
            preg_match_all('/\{\{([^}]+)\}\}/', $content, $matches);
            if (!empty($matches[1])) {
                $detectedVariables = array_unique($matches[1]);
                sort($detectedVariables);
                $validated['variables'] = $detectedVariables;
            }
        }

        $emailTemplate->update($validated);

        return response()->json([
            'message' => 'Email template updated successfully',
            'data' => $emailTemplate
        ]);
    }

    /**
     * Remove the specified email template
     */
    public function destroy(EmailTemplate $emailTemplate): JsonResponse
    {
        // Prevent deleting system templates
        if ($emailTemplate->is_system) {
            return response()->json([
                'message' => 'System templates cannot be deleted'
            ], 403);
        }

        $emailTemplate->delete();

        return response()->json([
            'message' => 'Email template deleted successfully'
        ]);
    }

    /**
     * Get template preview with sample data
     */
    public function preview(EmailTemplate $emailTemplate): JsonResponse
    {
        $preview = $emailTemplate->getPreview();

        return response()->json([
            'data' => $preview
        ]);
    }

    /**
     * Test template with custom variables
     */
    public function test(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $validated = $request->validate([
            'variables' => 'required|array',
        ]);

        // Validate required variables
        $errors = $emailTemplate->validateVariables($validated['variables']);
        if (!empty($errors)) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $errors
            ], 422);
        }

        $rendered = $emailTemplate->render($validated['variables']);

        return response()->json([
            'data' => $rendered
        ]);
    }

    /**
     * Get template by name
     */
    public function getByName(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'language' => 'string|max:5',
        ]);

        $template = EmailTemplate::where('name', $validated['name'])
            ->where('language', $validated['language'])
            ->active()
            ->first();

        if (!$template) {
            return response()->json([
                'message' => 'Template not found'
            ], 404);
        }

        return response()->json([
            'data' => $template
        ]);
    }

    /**
     * Render template with variables
     */
    public function render(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'variables' => 'required|array',
            'language' => 'string|max:5',
        ]);

        $template = EmailTemplate::where('name', $validated['name'])
            ->where('language', $validated['language'])
            ->active()
            ->first();

        if (!$template) {
            return response()->json([
                'message' => 'Template not found'
            ], 404);
        }

        // Validate required variables
        $errors = $template->validateVariables($validated['variables']);
        if (!empty($errors)) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $errors
            ], 422);
        }

        $rendered = $template->render($validated['variables']);

        return response()->json([
            'data' => $rendered
        ]);
    }

    /**
     * Get template statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_templates' => EmailTemplate::count(),
            'active_templates' => EmailTemplate::active()->count(),
            'system_templates' => EmailTemplate::system()->count(),
            'custom_templates' => EmailTemplate::custom()->count(),
            'by_category' => EmailTemplate::selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category'),
            'by_type' => EmailTemplate::selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
            'by_language' => EmailTemplate::selectRaw('language, COUNT(*) as count')
                ->groupBy('language')
                ->pluck('count', 'language'),
        ];

        return response()->json([
            'data' => $stats
        ]);
    }

    /**
     * Duplicate a template
     */
    public function duplicate(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:email_templates,name',
        ]);

        $newTemplate = $emailTemplate->replicate();
        $newTemplate->name = $validated['name'];
        $newTemplate->is_system = false;
        $newTemplate->save();

        return response()->json([
            'message' => 'Template duplicated successfully',
            'data' => $newTemplate
        ], 201);
    }

    /**
     * Toggle template active status
     */
    public function toggleActive(EmailTemplate $emailTemplate): JsonResponse
    {
        $emailTemplate->update(['is_active' => !$emailTemplate->is_active]);

        return response()->json([
            'message' => 'Template status updated successfully',
            'data' => $emailTemplate
        ]);
    }
}