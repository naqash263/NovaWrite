<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class N8nConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'webhook_url',
        'webhook_timeout',
        'max_retry_attempts',
        'is_active',
        'auto_notify_on_failure',
        'gemini_fallback_enabled',
        'gemini_webhook_url',
        'gemini_fallback_timeout',
        'gemini_fallback_retry_attempts'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'webhook_timeout' => 'integer',
        'max_retry_attempts' => 'integer',
        'auto_notify_on_failure' => 'boolean',
        'gemini_fallback_enabled' => 'boolean',
        'gemini_fallback_timeout' => 'integer',
        'gemini_fallback_retry_attempts' => 'integer'
    ];

    /**
     * Get the active N8n configuration
     */
    public static function getActive(): ?self
    {
        return static::where('is_active', true)->first();
    }

    /**
     * Activate this configuration (deactivate others)
     */
    public function activate(): void
    {
        // Deactivate all other configurations
        static::where('id', '!=', $this->id)->update(['is_active' => false]);
        
        // Activate this one
        $this->update(['is_active' => true]);
    }

    /**
     * Deactivate this configuration
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    /**
     * Validation rules
     */
    public static function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'webhook_url' => 'required|url|max:500',
            'webhook_timeout' => 'required|integer|min:5|max:300',
            'max_retry_attempts' => 'required|integer|min:1|max:10',
            'gemini_fallback_enabled' => 'sometimes|boolean',
            'gemini_webhook_url' => 'nullable|url|max:500',
            'gemini_fallback_timeout' => 'sometimes|integer|min:5|max:300',
            'gemini_fallback_retry_attempts' => 'sometimes|integer|min:1|max:10'
        ];
    }

    /**
     * Check if webhook URL is valid
     */
    public function isValidWebhookUrl(): bool
    {
        return filter_var($this->webhook_url, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Check if Gemini fallback is enabled
     */
    public function isGeminiFallbackEnabled(): bool
    {
        return $this->gemini_fallback_enabled ?? false;
    }

    /**
     * Get Gemini webhook URL
     */
    public function getGeminiWebhookUrl(): ?string
    {
        return $this->gemini_webhook_url;
    }

    /**
     * Check if Gemini webhook URL is valid
     */
    public function isValidGeminiWebhookUrl(): bool
    {
        if (!$this->gemini_webhook_url) {
            return false;
        }
        return filter_var($this->gemini_webhook_url, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Get Gemini fallback timeout
     */
    public function getGeminiFallbackTimeout(): int
    {
        return $this->gemini_fallback_timeout ?? 120; // Increased default from 60 to 120 seconds
    }

    /**
     * Get Gemini fallback retry attempts
     */
    public function getGeminiFallbackRetryAttempts(): int
    {
        return $this->gemini_fallback_retry_attempts ?? 2;
    }
}