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
        'variables',
        'description',
        'is_active',
        'category',
        'metadata',
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
     * Get template preview with sample data
     */
    public function getPreview(): array
    {
        $sampleData = $this->getSampleData();
        return $this->render($sampleData);
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
        }

        return $sampleData;
    }
}
