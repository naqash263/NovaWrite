<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CvTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CvTemplateController extends Controller
{
    /**
     * Display a listing of CV templates.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CvTemplate::with('creator');

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $templates = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Store a newly created CV template.
     */
    public function store(Request $request): JsonResponse
    {
        // Parse JSON strings if they come as strings
        $data = $request->all();
        
        // Handle JSON fields that might come as strings
        if (isset($data['json_config']) && is_string($data['json_config'])) {
            $data['json_config'] = json_decode($data['json_config'], true);
        }
        if (isset($data['customizable_options']) && is_string($data['customizable_options'])) {
            $data['customizable_options'] = json_decode($data['customizable_options'], true);
        }
        if (isset($data['field_mappings']) && is_string($data['field_mappings'])) {
            $data['field_mappings'] = json_decode($data['field_mappings'], true);
        }

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'ats_score' => 'required|integer|min:1|max:10',
            'html_content' => 'required|string',
            'json_config' => 'required|array',
            'customizable_options' => 'nullable|array',
            'field_mappings' => 'nullable|array',
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data['created_by'] = auth()->id();

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            $thumbnail = $request->file('thumbnail');
            $filename = Str::slug($request->name) . '_' . time() . '.' . $thumbnail->getClientOriginalExtension();
            $path = $thumbnail->storeAs('cv-templates/thumbnails', $filename, 'public');
            $data['thumbnail'] = Storage::url($path);
        }

        $template = CvTemplate::create($data);

        return response()->json([
            'success' => true,
            'message' => 'CV template created successfully',
            'data' => $template->load('creator')
        ], 201);
    }

    /**
     * Display the specified CV template.
     */
    public function show(CvTemplate $cvTemplate): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $cvTemplate->load('creator')
        ]);
    }

    /**
     * Update the specified CV template.
     */
    public function update(Request $request, CvTemplate $cvTemplate): JsonResponse
    {
        // Parse JSON strings if they come as strings
        $data = $request->all();
        
        // Handle JSON fields that might come as strings
        if (isset($data['json_config']) && is_string($data['json_config'])) {
            $data['json_config'] = json_decode($data['json_config'], true);
        }
        if (isset($data['customizable_options']) && is_string($data['customizable_options'])) {
            $data['customizable_options'] = json_decode($data['customizable_options'], true);
        }
        if (isset($data['field_mappings']) && is_string($data['field_mappings'])) {
            $data['field_mappings'] = json_decode($data['field_mappings'], true);
        }

        // Only validate thumbnail if it's present in the request
        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|required|string|max:100',
            'ats_score' => 'sometimes|required|integer|min:1|max:10',
            'html_content' => 'sometimes|required|string|min:1',
            'json_config' => 'sometimes|required|array',
            'customizable_options' => 'nullable|array',
            'field_mappings' => 'nullable|array',
        ];
        
        // Only add thumbnail validation if thumbnail is present
        if ($request->hasFile('thumbnail')) {
            $rules['thumbnail'] = 'image|mimes:jpeg,png,jpg,gif|max:2048';
        }
        
        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            \Log::info('Thumbnail upload detected', [
                'filename' => $request->file('thumbnail')->getClientOriginalName(),
                'size' => $request->file('thumbnail')->getSize(),
                'mime' => $request->file('thumbnail')->getMimeType()
            ]);
            
            // Delete old thumbnail
            if ($cvTemplate->thumbnail) {
                $oldPath = str_replace('/storage/', '', $cvTemplate->thumbnail);
                Storage::disk('public')->delete($oldPath);
            }

            $thumbnail = $request->file('thumbnail');
            $filename = Str::slug($request->name ?? $cvTemplate->name) . '_' . time() . '.' . $thumbnail->getClientOriginalExtension();
            $path = $thumbnail->storeAs('cv-templates/thumbnails', $filename, 'public');
            $data['thumbnail'] = Storage::url($path);
            
            \Log::info('Thumbnail saved', [
                'filename' => $filename,
                'path' => $path,
                'url' => $data['thumbnail']
            ]);
        } else {
            \Log::info('No thumbnail file in request');
        }

        $cvTemplate->update($data);

        return response()->json([
            'success' => true,
            'message' => 'CV template updated successfully',
            'data' => $cvTemplate->load('creator')
        ]);
    }

    /**
     * Remove the specified CV template.
     */
    public function destroy(CvTemplate $cvTemplate): JsonResponse
    {
        // Don't allow deletion of default template
        if ($cvTemplate->is_default) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the default template'
            ], 422);
        }

        // Delete thumbnail
        if ($cvTemplate->thumbnail) {
            $path = str_replace('/storage/', '', $cvTemplate->thumbnail);
            Storage::disk('public')->delete($path);
        }

        $cvTemplate->delete();

        return response()->json([
            'success' => true,
            'message' => 'CV template deleted successfully'
        ]);
    }

    /**
     * Upload HTML/CSS/JSON file for template.
     */
    public function uploadFile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:html,css,json,txt|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');
        $content = file_get_contents($file->getPathname());
        $extension = $file->getClientOriginalExtension();

        $result = [
            'filename' => $file->getClientOriginalName(),
            'extension' => $extension,
            'content' => $content,
        ];

        // If it's a JSON file, try to parse it
        if ($extension === 'json') {
            $jsonData = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $result['parsed_json'] = $jsonData;
            } else {
                $result['json_error'] = json_last_error_msg();
            }
        }

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Toggle active status of template.
     */
    public function toggle(CvTemplate $cvTemplate): JsonResponse
    {
        $cvTemplate->update(['is_active' => !$cvTemplate->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Template status updated successfully',
            'data' => $cvTemplate
        ]);
    }

    /**
     * Set template as default.
     */
    public function setDefault(CvTemplate $cvTemplate): JsonResponse
    {
        if (!$cvTemplate->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot set inactive template as default'
            ], 422);
        }

        $cvTemplate->setAsDefault();

        return response()->json([
            'success' => true,
            'message' => 'Default template updated successfully',
            'data' => $cvTemplate
        ]);
    }

    /**
     * Generate preview with sample data.
     */
    public function preview(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'html_content' => 'required|string',
            'customizations' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $htmlContent = $request->html_content;
        $customizations = $request->get('customizations', []);

        // Sample CV data for preview
        $sampleData = [
            'fullName' => 'John Doe',
            'jobTitle' => 'Senior Software Engineer',
            'email' => 'john.doe@example.com',
            'phoneNumber' => '+1 (555) 123-4567',
            'address' => 'San Francisco, CA',
            'professionalSummary' => 'Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies.',
            'workExperience' => [
                [
                    'jobTitle' => 'Senior Software Engineer',
                    'company' => 'Tech Corp',
                    'startDate' => '2020',
                    'endDate' => 'Present',
                    'description' => 'Led development of scalable web applications using React and Node.js'
                ]
            ],
            'education' => [
                [
                    'degree' => 'Bachelor of Computer Science',
                    'institution' => 'University of Technology',
                    'graduationYear' => '2018'
                ]
            ],
            'skills' => 'JavaScript, React, Node.js, Python, SQL, Git, Docker, AWS'
        ];

        // Apply customizations
        if (!empty($customizations)) {
            foreach ($customizations as $key => $value) {
                $htmlContent = str_replace('{{' . $key . '}}', $value, $htmlContent);
            }
        }

        // Replace sample data placeholders
        foreach ($sampleData as $key => $value) {
            if (is_array($value)) {
                // Handle array data (work experience, education)
                $htmlContent = str_replace('{{' . $key . '}}', json_encode($value), $htmlContent);
            } else {
                $htmlContent = str_replace('{{' . $key . '}}', $value, $htmlContent);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'preview_html' => $htmlContent,
                'sample_data' => $sampleData
            ]
        ]);
    }
}