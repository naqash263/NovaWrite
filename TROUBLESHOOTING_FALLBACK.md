# Troubleshooting Gemini N8N Fallback

## Issue: Fallback Not Working for "API quota exceeded" Error

### Problem
When Gemini API returns "API quota exceeded" error, the system should automatically fallback to N8N, but it's not working.

### Diagnosis Steps

1. **Check if error is being detected:**
   - The error message "API quota exceeded. Please try again later or add your own API key." contains "quota"
   - The error classifier should detect this and return `true` for `shouldFallback()`
   - Check logs for: `"Gemini API exception caught in fallback service"`

2. **Check if N8N fallback is configured:**
   - Go to Admin Panel → N8N Configuration
   - Check if there's an active configuration
   - Verify `gemini_fallback_enabled` is `true`
   - Verify `gemini_webhook_url` is set and valid

3. **Check logs:**
   Look for these log entries:
   - `"Gemini API exception caught in fallback service"` - Exception was caught
   - `"should_fallback": true/false` - Whether fallback was triggered
   - `"fallback_available": true/false` - Whether N8N is configured
   - `"Fallback needed but N8N fallback not configured"` - N8N not set up

### Common Issues

#### Issue 1: N8N Fallback Not Configured
**Symptoms:**
- Error message: "API quota exceeded. Please try again later or add your own API key."
- Log shows: `"fallback_available": false`

**Solution:**
1. Go to Admin Panel → N8N Configuration
2. Edit the active configuration
3. Enable "Gemini Fallback Enabled"
4. Set "Gemini Webhook URL" (your N8N webhook endpoint)
5. Set timeout (default: 60 seconds)
6. Save configuration

#### Issue 2: Error Classifier Not Detecting Error
**Symptoms:**
- Log shows: `"should_fallback": false`
- Error message contains "quota" but classifier doesn't detect it

**Solution:**
- Check error message format
- Verify error classifier patterns include the error message
- Check logs for `"error_message_lower"` to see what classifier sees

#### Issue 3: N8N Webhook Not Responding
**Symptoms:**
- Log shows: `"N8N fallback also failed"`
- Error: N8N webhook timeout or connection error

**Solution:**
1. Test N8N webhook connection:
   ```
   POST /api/admin/gemini-fallback/test
   ```
2. Verify N8N workflow is active
3. Check N8N server is running
4. Verify webhook URL is correct

### Testing Fallback

1. **Test Error Detection:**
   ```bash
   # Check logs after making a request that triggers quota error
   tail -f storage/logs/laravel.log | grep -i "fallback\|quota"
   ```

2. **Test N8N Configuration:**
   ```bash
   # Via API
   GET /api/admin/gemini-fallback/health?test=true
   ```

3. **Test N8N Connection:**
   ```bash
   # Via API
   POST /api/admin/gemini-fallback/test
   ```

### Expected Behavior

1. **When Gemini API fails with quota error:**
   - Exception caught by fallback service
   - Error classifier detects "quota" → `shouldFallback() = true`
   - Check if N8N is configured → `isFallbackAvailable()`
   - If configured: Call N8N webhook
   - If not configured: Throw helpful error message

2. **When N8N is not configured:**
   - Should throw: "AI service temporarily unavailable. N8N fallback is not configured. Please contact support."
   - NOT the original "API quota exceeded" error

3. **When N8N is configured:**
   - Should call N8N webhook
   - Return formatted response
   - Log successful fallback

### Debug Commands

```bash
# Check N8N configuration in database
php artisan tinker
>>> $config = \App\Models\N8nConfiguration::getActive();
>>> $config->gemini_fallback_enabled;
>>> $config->gemini_webhook_url;

# Check recent fallback logs
php artisan tinker
>>> \App\Models\GeminiFallbackLog::latest()->take(10)->get();

# Test error classifier
php artisan tinker
>>> $e = new \Exception('API quota exceeded. Please try again later.');
>>> \App\Services\GeminiErrorClassifier::shouldFallback($e);
```

### Next Steps

1. Check Laravel logs for detailed error information
2. Verify N8N configuration in admin panel
3. Test N8N webhook connection
4. Check if N8N workflow is set up correctly
5. Review fallback logs in database
