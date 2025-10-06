<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Crypt;

class SmtpConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'mailer',
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'from_address',
        'from_name',
        'is_active',
        'is_default',
        'description',
        'settings',
        'last_tested_at',
        'test_successful',
        'test_error',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'test_successful' => 'boolean',
        'last_tested_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * Encrypt password when setting
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Crypt::encryptString($value);
    }

    /**
     * Decrypt password when getting
     */
    public function getPasswordAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    /**
     * Get the active SMTP configuration
     */
    public static function getActive()
    {
        return static::where('is_active', true)->first();
    }

    /**
     * Get the default SMTP configuration
     */
    public static function getDefault()
    {
        return static::where('is_default', true)->first();
    }

    /**
     * Set this configuration as active (deactivates others)
     */
    public function setAsActive()
    {
        // Deactivate all other configurations
        static::where('id', '!=', $this->id)->update(['is_active' => false]);
        
        // Activate this one
        $this->update(['is_active' => true]);
    }

    /**
     * Set this configuration as default (removes default from others)
     */
    public function setAsDefault()
    {
        // Remove default from all other configurations
        static::where('id', '!=', $this->id)->update(['is_default' => false]);
        
        // Set this one as default
        $this->update(['is_default' => true]);
    }

    /**
     * Test SMTP configuration
     */
    public function testConfiguration($testEmail = null)
    {
        try {
            // Temporarily set Laravel mail config
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.host' => $this->host,
                'mail.mailers.smtp.port' => $this->port,
                'mail.mailers.smtp.username' => $this->username,
                'mail.mailers.smtp.password' => $this->password,
                'mail.mailers.smtp.encryption' => $this->encryption,
                'mail.from.address' => $this->from_address,
                'mail.from.name' => $this->from_name,
            ]);

            // Send test email
            $testEmail = $testEmail ?: $this->from_address;
            
            \Illuminate\Support\Facades\Mail::raw(
                'This is a test email from NovaWrite SMTP configuration: ' . $this->name,
                function ($message) use ($testEmail) {
                    $message->to($testEmail)
                           ->subject('NovaWrite SMTP Test - ' . now()->format('Y-m-d H:i:s'));
                }
            );

            // Update test results
            $this->update([
                'last_tested_at' => now(),
                'test_successful' => true,
                'test_error' => null,
            ]);

            return [
                'success' => true,
                'message' => 'SMTP configuration test successful!'
            ];

        } catch (\Exception $e) {
            // Update test results with error
            $this->update([
                'last_tested_at' => now(),
                'test_successful' => false,
                'test_error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'SMTP configuration test failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get configuration as array for Laravel mail config
     */
    public function toMailConfig()
    {
        return [
            'mailer' => $this->mailer,
            'host' => $this->host,
            'port' => $this->port,
            'username' => $this->username,
            'password' => $this->password,
            'encryption' => $this->encryption,
            'from_address' => $this->from_address,
            'from_name' => $this->from_name,
        ];
    }

    /**
     * Scope to get only active configurations
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only default configurations
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Get available mailer types
     */
    public static function getMailerTypes()
    {
        return [
            'smtp' => 'SMTP',
            'sendmail' => 'Sendmail',
            'mailgun' => 'Mailgun',
            'ses' => 'Amazon SES',
            'postmark' => 'Postmark',
            'resend' => 'Resend',
        ];
    }

    /**
     * Get available encryption types
     */
    public static function getEncryptionTypes()
    {
        return [
            null => 'None',
            'tls' => 'TLS',
            'ssl' => 'SSL',
        ];
    }

    /**
     * Get common SMTP ports
     */
    public static function getCommonPorts()
    {
        return [
            25 => '25 (Standard)',
            587 => '587 (TLS)',
            465 => '465 (SSL)',
            2525 => '2525 (Alternative)',
        ];
    }
}
