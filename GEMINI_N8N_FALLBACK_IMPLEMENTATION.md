# Gemini API Management with N8N Fallback - Implementation Summary

## ✅ Implementation Complete

All core components of the Gemini API Management with N8N Fallback system have been implemented.

## 📦 Components Created

### 1. Database Migrations
- ✅ `2025_01_15_000001_create_gemini_fallback_logs_table.php` - Logs table for tracking fallback usage
- ✅ `2025_01_15_000002_add_gemini_fallback_to_n8n_configurations.php` - Adds Gemini fields to N8N configurations

### 2. Models
- ✅ `GeminiFallbackLog` - Model for logging fallback events with statistics methods
- ✅ `N8nConfiguration` - Updated with Gemini fallback fields and helper methods

### 3. Services
- ✅ `GeminiErrorClassifier` - Classifies errors and determines if fallback is needed
- ✅ `N8nResponseAdapter` - Adapts N8N responses to match Gemini API format
- ✅ `GeminiN8nFallbackService` - Main service handling fallback logic

### 4. Service Updates
- ✅ `CvAiService` - Updated `extractCvData()` and `tailorCvToJob()` to use fallback
- ✅ `CareerAiService` - Updated all 7 methods to use fallback:
  - `analyzeLinkedInProfile()`
  - `generateCoverLetter()`
  - `generateInterviewPrep()`
  - `generateSalaryNegotiation()`
  - `generateSkillsAssessment()`
  - `generateCareerPath()`
  - `generateJobSearchStrategy()`

### 5. Admin API Endpoints
- ✅ `GeminiFallbackController` - Admin endpoints for:
  - `GET /api/admin/gemini-fallback/stats` - Statistics
  - `GET /api/admin/gemini-fallback/logs` - Logs with filtering
  - `GET /api/admin/gemini-fallback/health` - Health check
  - `POST /api/admin/gemini-fallback/test` - Test connection

## 🔧 Configuration

### Database Fields Added

**n8n_configurations table:**
- `gemini_fallback_enabled` (boolean) - Enable/disable fallback
- `gemini_webhook_url` (string) - N8N webhook URL for Gemini fallback
- `gemini_fallback_timeout` (integer) - Timeout in seconds (default: 60)
- `gemini_fallback_retry_attempts` (integer) - Retry attempts (default: 2)

**gemini_fallback_logs table:**
- `tool_type` - Which tool used fallback
- `prompt_hash` - Hashed prompt for privacy
- `fallback_reason` - Why fallback was triggered
- `gemini_error_code` - Original error code
- `gemini_error_message` - Original error message
- `n8n_response_time` - Response time from N8N
- `success` - Whether fallback succeeded
- `response_size` - Size of response
- `metadata` - Additional metadata (JSON)

## 🚀 How It Works

### Request Flow

1. **User makes request** → Service method called
2. **Service tries Gemini API** → Wrapped in `callWithFallback()`
3. **If Gemini succeeds** → Return response (no fallback)
4. **If Gemini fails** → Error classifier checks if fallback needed
5. **If fallback eligible** → Call N8N webhook
6. **N8N processes** → Returns response
7. **Response adapter** → Formats N8N response to match Gemini format
8. **Return to user** → Seamless experience

### Fallback Triggers

Fallback is triggered for:
- ✅ Quota exceeded errors
- ✅ Rate limiting (429)
- ✅ Server errors (500, 502, 503, 504)
- ✅ Network timeouts
- ✅ Connection failures
- ✅ Service unavailable
- ✅ No available API keys

Fallback is NOT triggered for:
- ❌ Invalid API key (400, 401, 403)
- ❌ Token limit exceeded (user error)
- ❌ Invalid request format

## 📋 N8N Webhook Requirements

### Request Format

```json
{
  "action": "gemini_fallback",
  "tool_type": "cv_extract|cv_tailor|cover_letter|...",
  "prompt": "Full prompt text",
  "options": {
    "file_type": "pdf",
    "temperature": 0.7,
    "max_tokens": 2048
  },
  "metadata": {
    "request_id": "req_...",
    "timestamp": "2025-01-15T10:00:00Z",
    "fallback_reason": "quota_exceeded"
  }
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    // Tool-specific response structure
    // Must match Gemini API response format
  },
  "metadata": {
    "provider": "n8n",
    "processing_time": 2.5,
    "model_used": "gemini-2.0-flash"
  }
}
```

### Tool Types Supported

- `cv_extract` - CV extraction
- `cv_tailor` - CV tailoring
- `cover_letter` - Cover letter generation
- `interview_prep` - Interview preparation
- `salary_negotiation` - Salary negotiation
- `skills_assessment` - Skills assessment
- `career_path` - Career path planning
- `job_search` - Job search strategy
- `linkedin_analysis` - LinkedIn analysis
- `grammar_check` - Grammar checking
- `text_summarize` - Text summarization
- `article_rewrite` - Article rewriting
- `language_translate` - Language translation

## 🔐 Setup Instructions

### 1. Run Migrations

```bash
php artisan migrate
```

### 2. Configure N8N

1. Go to Admin Panel → N8N Configuration
2. Edit active configuration
3. Enable "Gemini Fallback Enabled"
4. Set "Gemini Webhook URL" (your N8N webhook endpoint)
5. Set timeout and retry attempts
6. Save configuration

### 3. Create N8N Workflows

Create workflows for each tool type that:
1. Accept webhook POST requests
2. Extract `tool_type`, `prompt`, and `options`
3. Process with Gemini API (or alternative AI)
4. Format response to match expected structure
5. Return JSON response

### 4. Test Connection

```bash
# Via API
POST /api/admin/gemini-fallback/test

# Or check health
GET /api/admin/gemini-fallback/health?test=true
```

## 📊 Monitoring

### View Statistics

```bash
GET /api/admin/gemini-fallback/stats?days=7
GET /api/admin/gemini-fallback/stats?tool_type=cv_extract&days=7
```

### View Logs

```bash
GET /api/admin/gemini-fallback/logs?tool_type=cv_extract&limit=50
GET /api/admin/gemini-fallback/logs?fallback_reason=quota_exceeded
GET /api/admin/gemini-fallback/logs?success=true
```

## 🎯 Next Steps

1. **Set up N8N workflows** - Create workflows for each tool type
2. **Test fallback** - Test with quota exceeded scenario
3. **Monitor usage** - Check statistics regularly
4. **Optimize** - Adjust timeouts and retry attempts based on usage

## 📝 Notes

- Fallback is automatic and transparent to users
- All fallback events are logged for monitoring
- Response format is automatically adapted to match Gemini format
- Fallback only activates when Gemini API fails with eligible errors
- N8N responses must match Gemini API response structure

## 🔍 Troubleshooting

### Fallback not working?

1. Check N8N configuration is active
2. Verify `gemini_fallback_enabled` is true
3. Check `gemini_webhook_url` is valid
4. Test connection via admin endpoint
5. Check logs for error details

### Response format issues?

1. Check N8N workflow returns correct format
2. Verify response adapter is handling tool type
3. Check logs for formatting errors
4. Review response structure in logs

### High fallback rate?

1. Check Gemini API key quotas
2. Review error reasons in statistics
3. Consider adding more API keys
4. Optimize N8N workflow performance
