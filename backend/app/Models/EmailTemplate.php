<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'subject',
        'body',
        'type',
        'category',
        'variables',
        'description',
        'metadata',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'metadata' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Scope to get only active templates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Get template by name
     */
    public static function getByName($name)
    {
        return static::where('name', $name)->active()->first();
    }

    /**
     * Render template with variables
     */
    public function render(array $variables = []): array
    {
        $subject = $this->subject;
        $body = $this->body;

        // Replace variables in subject and body
        foreach ($variables as $key => $value) {
            $subject = str_replace("{{$key}}", $value, $subject);
            $body = str_replace("{{$key}}", $value, $body);
        }

        return [
            'subject' => $subject,
            'body' => $body,
            'type' => $this->type,
            'category' => $this->category,
        ];
    }

    /**
     * Get available template categories
     */
    public static function getCategories(): array
    {
        return [
            'general' => 'General',
            'user' => 'User Management',
            'course' => 'Course Related',
            'workflow' => 'Workflow Related',
            'system' => 'System Notifications',
            'marketing' => 'Marketing',
        ];
    }

    /**
     * Get available template types
     */
    public static function getTypes(): array
    {
        return [
            'markdown' => 'Markdown',
            'html' => 'HTML',
        ];
    }

    /**
     * Validate template variables
     */
    public function validateVariables(array $variables): array
    {
        $errors = [];
        $requiredVariables = $this->variables ?? [];

        foreach ($requiredVariables as $variable) {
            if (!isset($variables[$variable])) {
                $errors[] = "Required variable '{$variable}' is missing";
            }
        }

        return $errors;
    }


    /**
     * Scope to filter by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter by language
     */
    public function scopeByLanguage($query, $language)
    {
        return $query->where('language', $language);
    }

    /**
     * Scope to get system templates
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to get non-system templates
     */
    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Automatically detect variables from template content
     */
    public function detectVariables(): array
    {
        $content = $this->subject . ' ' . $this->body;
        $variables = [];
        
        // Find all {{variable_name}} patterns
        preg_match_all('/\{\{([^}]+)\}\}/', $content, $matches);
        
        if (!empty($matches[1])) {
            $variables = array_unique($matches[1]);
            sort($variables);
        }
        
        return $variables;
    }

    /**
     * Get preview of template with sample data
     */
    public function getPreview(): array
    {
        $sampleData = $this->getSampleData();
        $rendered = $this->render($sampleData);
        
        return [
            'template' => $this->toArray(),
            'preview' => $rendered,
            'sample_data' => $sampleData,
            'variables' => $this->detectVariables(),
        ];
    }

    /**
     * Get sample data for template preview
     */
    protected function getSampleData(): array
    {
        $sampleData = [
            'user_name' => 'John Doe',
            'user_email' => 'john@example.com',
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'login_url' => config('app.url') . '/login',
            'support_email' => config('mail.from.address'),
            // Add your custom variables here
            'Hoioyo' => 'Sample Custom Value',
            'customer_name' => 'Jane Smith',
            'order_number' => 'ORD-12345',
            'product_name' => 'Premium Package',
        ];

        // Add category-specific sample data
        switch ($this->category) {
            case 'course':
                $sampleData = array_merge($sampleData, [
                    'course_title' => 'Advanced Writing Techniques',
                    'course_description' => 'Learn advanced writing techniques to improve your skills.',
                    'course_url' => config('app.url') . '/courses/1',
                ]);
                break;
            case 'workflow':
                $sampleData = array_merge($sampleData, [
                    'workflow_title' => 'Content Creation Workflow',
                    'workflow_description' => 'A comprehensive workflow for content creation.',
                    'workflow_url' => config('app.url') . '/workflows/1',
                    'workflow_type' => 'new',
                ]);
                break;
            case 'marketing':
                $sampleData = array_merge($sampleData, [
                    'promo_code' => 'SAVE20',
                    'discount_percent' => '20',
                    'expiry_date' => '2025-12-31',
                ]);
                break;
            case 'system':
                $sampleData = array_merge($sampleData, [
                    'maintenance_date' => '2025-01-15',
                    'downtime_duration' => '2 hours',
                    'affected_services' => 'Email, File Upload',
                ]);
                break;
        }

        return $sampleData;
    }
}
