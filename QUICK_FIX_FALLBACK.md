# Quick Fix: Enable N8N Fallback

## The Issue
You're getting "API quota exceeded" error because N8N fallback is not configured.

## Quick Solution

### Option 1: Configure via Admin Panel (Recommended)
1. Go to: `https://naqashthaheem.com/admin/n8n-configurations`
2. Edit the active N8N configuration
3. Enable: **"Gemini Fallback Enabled"**
4. Set: **"Gemini Webhook URL"** (your N8N webhook endpoint)
5. Set timeout: **60** seconds
6. Save

### Option 2: Configure via Database (If admin panel not available)

```sql
-- Check current config
SELECT id, name, is_active, gemini_fallback_enabled, gemini_webhook_url 
FROM n8n_configurations 
WHERE is_active = true;

-- Update to enable fallback
UPDATE n8n_configurations 
SET 
    gemini_fallback_enabled = true,
    gemini_webhook_url = 'https://your-n8n-server.com/webhook/gemini-fallback',
    gemini_fallback_timeout = 60,
    gemini_fallback_retry_attempts = 2
WHERE is_active = true;
```

### Option 3: Test Connection First

```bash
# Test if N8N fallback is configured
curl -X POST https://naqashthaheem.com/api/admin/gemini-fallback/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Verify It's Working

After configuring, check logs:
```bash
tail -f storage/logs/laravel.log | grep -i "fallback"
```

You should see:
- `"Gemini API exception caught in fallback service"`
- `"should_fallback": true`
- `"fallback_available": true`
- `"Gemini API failed, attempting N8N fallback"`

## Expected Behavior After Configuration

**Before (Current):**
```
Error: "API quota exceeded. Please try again later or add your own API key."
```

**After (With N8N configured):**
- Gemini API fails → Detects quota error
- Automatically calls N8N webhook
- Returns response from N8N
- User gets result seamlessly

**After (If N8N also fails):**
```
Error: "AI service temporarily unavailable. N8N fallback is not configured. Please contact support."
```

## N8N Webhook Setup

Your N8N workflow should:
1. Accept POST requests
2. Expect payload:
```json
{
  "action": "gemini_fallback",
  "tool_type": "linkedin_analysis",
  "prompt": "...",
  "options": {...}
}
```
3. Return response:
```json
{
  "success": true,
  "data": {
    // Tool-specific response matching Gemini format
  }
}
```

## Still Not Working?

1. Check migrations ran: `php artisan migrate:status`
2. Check N8N config in database
3. Check Laravel logs for detailed error
4. Test N8N webhook directly
5. Verify N8N server is running
