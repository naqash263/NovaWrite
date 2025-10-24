<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemEmailSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    /**
     * Get a setting value by key
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value by key
     */
    public static function setValue(string $key, $value, ?string $description = null): void
    {
        $existing = static::where('key', $key)->first();
        
        if ($existing) {
            $existing->update([
                'value' => $value,
                'description' => $description ?? $existing->description,
            ]);
        } else {
            static::create([
                'key' => $key,
                'value' => $value,
                'description' => $description,
            ]);
        }
    }

    /**
     * Get all settings as key-value pairs
     */
    public static function getAllSettings(): array
    {
        return static::pluck('value', 'key')->toArray();
    }

    /**
     * Get SMTP configuration for a specific email type
     */
    public static function getSmtpForEmailType(string $emailType): ?int
    {
        $smtpId = static::getValue($emailType . '_smtp_id');
        
        if ($smtpId) {
            return (int) $smtpId;
        }

        // Fallback to default SMTP
        $defaultSmtpId = static::getValue('default_smtp_id');
        return $defaultSmtpId ? (int) $defaultSmtpId : null;
    }
}