# Gemini API Management with N8N Fallback - Implementation Plan

## Executive Summary

This plan outlines the implementation of a robust Gemini API management system with automatic fallback to N8N when Gemini API fails. The system will ensure continuous service availability by routing requests to N8N workflows when Gemini API encounters errors, quota limits, or network issues.

## Current System Analysis

### Existing Components

1. **Gemini API Services**:
   - `CvAiService` - CV extraction and tailoring
   - `CareerAiService` - Career tools (LinkedIn, cover letter, interview prep, etc.)
   - `ContactAiService` - Contact form AI responses
   - `GrammarCheckerController` - Grammar checking
   - `TextSummarizerController` - Text summarization
   - `ArticleRewriterController` - Article rewriting
   - `LanguageTranslatorController` - Language translation

2. **API Key Management**:
   - `GeminiApiKey` model - Admin API keys with encryption
   - `UserApiKey` model - User-specific API keys
   - Automatic key selection (user keys → admin keys)
   - Daily limit tracking (100 requests per key per day)
   - Usage tracking and reset mechanisms

3. **N8N Integration**:
   - `N8nConfiguration` model - Webhook configuration
   - `N8nEmailService` - Email sending via N8N
   - Active configuration management
   - Webhook timeout and retry handling

### Current Error Handling

**Gemini API Errors Currently Handled**:
- Token count exceeded
- Quota exceeded
- Invalid API key
- Network timeouts
- Rate limiting
- Service unavailable

**Current Behavior**:
- Errors are logged and exceptions are thrown
- No automatic fallback mechanism
- Users see error messages when API fails

## Architecture Overview

### Request Flow

```
User Request
    ↓
1. Try Gemini API (Primary)
    ↓ (Success)
    Return Response
    ↓ (Failure)
2. Check Error Type
    ↓
3. Route to N8N Fallback
    ↓
4. N8N Processes Request
    ↓
5. Format N8N Response
    ↓
6. Return to User
```

### Fallback Triggers

The system should fallback to N8N when:

1. **API Errors**:
   - HTTP 400, 401, 403 (Invalid/Unauthorized)
   - HTTP 429 (Rate Limited)
   - HTTP 500, 503 (Server Errors)
   - Network timeouts
   - Connection failures

2. **Quota Issues**:
   - All API keys exhausted
   - Daily limits reached
   - Quota exceeded errors

3. **Service Issues**:
   - Gemini API temporarily unavailable
   - Model access denied
   - Invalid response format

4. **Configuration Issues**:
   - No available API keys
   - Decryption failures
   - Invalid key format

## Implementation Plan

### Phase 1: Core Fallback Service

#### 1.1 Create GeminiN8nFallbackService

**Location**: `backend/app/Services/GeminiN8nFallbackService.php`

**Responsibilities**:
- Detect Gemini API failures
- Route requests to N8N when needed
- Format N8N responses to match Gemini format
- Log fallback usage
- Track fallback statistics

**Key Methods**:
```php
- callWithFallback($prompt, $options = [])
- detectFallbackNeeded($exception, $response)
- callN8nFallback($prompt, $toolType, $options = [])
- formatN8nResponse($n8nResponse, $expectedFormat)
- logFallbackUsage($toolType, $reason)
```

#### 1.2 Create N8N Configuration for Gemini

**Database Migration**:
- Add `gemini_fallback_enabled` to `n8n_configurations` table
- Add `gemini_webhook_url` field (separate from email webhook)
- Add `gemini_fallback_timeout` field

**Model Updates**:
- Update `N8nConfiguration` model with Gemini-specific fields
- Add methods: `getGeminiWebhookUrl()`, `isGeminiFallbackEnabled()`

#### 1.3 Create Fallback Logging System

**Database Migration**:
- Create `gemini_fallback_logs` table:
  ```sql
  - id
  - tool_type (cv_extract, cv_tailor, cover_letter, etc.)
  - prompt_hash (for privacy)
  - fallback_reason (quota_exceeded, api_error, timeout, etc.)
  - gemini_error_code
  - n8n_response_time
  - success (boolean)
  - created_at
  ```

**Model**: `GeminiFallbackLog`

### Phase 2: Update Existing Services

#### 2.1 Update CvAiService

**Changes**:
- Wrap `callGeminiApi()` with fallback logic
- Add fallback to N8N when Gemini fails
- Maintain same response format

**Code Pattern**:
```php
try {
    $response = $this->callGeminiApi($apiKey, $prompt);
} catch (\Exception $e) {
    if ($this->shouldFallbackToN8n($e)) {
        $response = $this->fallbackService->callN8nFallback(
            $prompt,
            'cv_extract',
            ['file_type' => $fileType]
        );
    } else {
        throw $e;
    }
}
```

#### 2.2 Update CareerAiService

**Changes**:
- Add fallback for all 7 career tools
- Map each tool to N8N workflow
- Preserve response structure

**Tools to Update**:
1. LinkedIn Analysis
2. Cover Letter Generation
3. Interview Prep
4. Salary Negotiation
5. Skills Assessment
6. Career Path
7. Job Search Strategy

#### 2.3 Update Other Services

**Services to Update**:
- `ContactAiService`
- `GrammarCheckerController`
- `TextSummarizerController`
- `ArticleRewriterController`
- `LanguageTranslatorController`

### Phase 3: N8N Workflow Setup

#### 3.1 N8N Workflow Structure

**Required N8N Workflows**:

1. **Gemini Fallback - CV Extract**
   - Webhook trigger
   - Extract prompt and file type
   - Call Gemini API (or alternative AI)
   - Format response as JSON
   - Return structured CV data

2. **Gemini Fallback - CV Tailor**
   - Webhook trigger
   - Extract CV data and job description
   - Process with AI
   - Return tailored CV JSON

3. **Gemini Fallback - Career Tools**
   - Single workflow with tool routing
   - Accept `tool_type` parameter
   - Route to appropriate AI processing
   - Return formatted response

4. **Gemini Fallback - Text Processing**
   - Grammar checker
   - Text summarizer
   - Article rewriter
   - Language translator

#### 3.2 N8N Webhook Payload Format

**Request Format**:
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
    "user_id": 123,
    "request_id": "uuid",
    "fallback_reason": "quota_exceeded"
  }
}
```

**Response Format**:
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

#### 3.3 N8N Response Formatting Requirements

**CV Extract Response**:
```json
{
  "fullName": "...",
  "jobTitle": "...",
  "email": "...",
  "workExperience": [...],
  "education": [...],
  "skills": "...",
  // ... all CV fields
}
```

**Career Tools Response**:
- Must match existing response structures
- Include all expected fields
- Maintain same JSON schema

### Phase 4: Error Detection & Routing

#### 4.1 Error Classification

**Create Error Classifier**:
```php
class GeminiErrorClassifier
{
    public static function shouldFallback($exception): bool
    {
        // Check error type
        // Check HTTP status
        // Check error message patterns
        // Return true if fallback needed
    }
    
    public static function getFallbackReason($exception): string
    {
        // quota_exceeded
        // rate_limited
        // api_error
        // timeout
        // invalid_key
        // service_unavailable
    }
}
```

#### 4.2 Fallback Decision Logic

**Decision Tree**:
1. Is N8N fallback enabled? → No: Throw error
2. Is error fallback-eligible? → No: Throw error
3. Is N8N webhook configured? → No: Throw error
4. Attempt N8N fallback
5. If N8N fails → Throw original error

### Phase 5: Response Format Standardization

#### 5.1 Response Adapter

**Create ResponseAdapter**:
```php
class N8nResponseAdapter
{
    public function adapt($n8nResponse, $toolType): array
    {
        // Transform N8N response to match Gemini format
        // Handle different tool types
        // Validate response structure
        // Return standardized format
    }
}
```

#### 5.2 Format Validation

**Ensure**:
- Response structure matches Gemini output
- All required fields present
- Data types correct
- JSON structure valid

### Phase 6: Logging & Monitoring

#### 6.1 Fallback Logging

**Log Events**:
- Fallback triggered (reason, tool type)
- N8N request sent
- N8N response received
- Response formatting success/failure
- Total processing time

#### 6.2 Statistics Tracking

**Track**:
- Fallback usage count per tool
- Fallback success rate
- Average N8N response time
- Most common fallback reasons
- Daily/weekly fallback trends

#### 6.3 Admin Dashboard

**New Admin Endpoints**:
- `GET /api/admin/gemini-fallback/stats` - Fallback statistics
- `GET /api/admin/gemini-fallback/logs` - Fallback logs
- `GET /api/admin/gemini-fallback/health` - N8N fallback health check

### Phase 7: Configuration Management

#### 7.1 Admin Interface Updates

**Add to Admin Panel**:
- N8N Gemini Fallback Configuration
- Enable/disable fallback per tool
- Configure N8N webhook URLs
- View fallback statistics
- Test N8N connections

#### 7.2 Environment Variables

**New .env Variables**:
```env
GEMINI_N8N_FALLBACK_ENABLED=true
GEMINI_N8N_FALLBACK_TIMEOUT=60
GEMINI_N8N_FALLBACK_RETRY_ATTEMPTS=2
GEMINI_N8N_WEBHOOK_URL=https://your-n8n-server.com/webhook/gemini-fallback
```

### Phase 8: Testing Strategy

#### 8.1 Unit Tests

**Test Cases**:
- Error detection logic
- Fallback decision making
- Response formatting
- Error classification

#### 8.2 Integration Tests

**Test Scenarios**:
1. Gemini API success (no fallback)
2. Gemini API failure → N8N success
3. Gemini API failure → N8N failure
4. Quota exceeded → N8N fallback
5. Network timeout → N8N fallback
6. Invalid response format handling

#### 8.3 End-to-End Tests

**Test Flows**:
- CV extraction with fallback
- Career tool with fallback
- Multiple concurrent requests
- Fallback rate limiting

## Database Schema Changes

### New Tables

#### gemini_fallback_logs
```sql
CREATE TABLE gemini_fallback_logs (
    id BIGSERIAL PRIMARY KEY,
    tool_type VARCHAR(50) NOT NULL,
    prompt_hash VARCHAR(64),
    fallback_reason VARCHAR(50) NOT NULL,
    gemini_error_code VARCHAR(20),
    gemini_error_message TEXT,
    n8n_response_time DECIMAL(10,3),
    success BOOLEAN DEFAULT false,
    response_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tool_type (tool_type),
    INDEX idx_fallback_reason (fallback_reason),
    INDEX idx_created_at (created_at)
);
```

### Modified Tables

#### n8n_configurations
```sql
ALTER TABLE n8n_configurations
ADD COLUMN gemini_fallback_enabled BOOLEAN DEFAULT false,
ADD COLUMN gemini_webhook_url VARCHAR(500),
ADD COLUMN gemini_fallback_timeout INTEGER DEFAULT 60,
ADD COLUMN gemini_fallback_retry_attempts INTEGER DEFAULT 2;
```

## API Endpoints

### New Admin Endpoints

1. **Fallback Statistics**
   ```
   GET /api/admin/gemini-fallback/stats
   Response: {
     "total_fallbacks": 150,
     "success_rate": 95.5,
     "by_tool": {...},
     "by_reason": {...}
   }
   ```

2. **Fallback Logs**
   ```
   GET /api/admin/gemini-fallback/logs?tool_type=cv_extract&limit=50
   Response: {
     "logs": [...],
     "pagination": {...}
   }
   ```

3. **N8N Fallback Health**
   ```
   GET /api/admin/gemini-fallback/health
   Response: {
     "enabled": true,
     "webhook_configured": true,
     "last_test": "2025-01-15T10:00:00Z",
     "status": "healthy"
   }
   ```

4. **Test N8N Fallback**
   ```
   POST /api/admin/gemini-fallback/test
   Body: {
     "tool_type": "cv_extract",
     "prompt": "Test prompt"
   }
   ```

## N8N Workflow Implementation Guide

### Workflow 1: CV Extract Fallback

**Nodes**:
1. Webhook (POST) - Receive request
2. Extract prompt and options
3. HTTP Request - Call Gemini API (or alternative)
4. Format Response - Convert to expected JSON
5. Respond to Webhook - Return formatted response

**Error Handling**:
- If Gemini fails, try alternative AI service
- If all fail, return error response
- Log all attempts

### Workflow 2: Career Tools Fallback

**Nodes**:
1. Webhook (POST) - Receive request
2. Switch - Route by tool_type
3. Process with AI (per tool type)
4. Format Response - Standardize output
5. Respond to Webhook - Return response

**Tool Routing**:
- `cover_letter` → Cover letter generation
- `interview_prep` → Interview preparation
- `salary_negotiation` → Salary strategy
- etc.

### Workflow 3: Text Processing Fallback

**Nodes**:
1. Webhook (POST)
2. Extract text and processing type
3. Process with AI
4. Format and return

## Error Handling Strategy

### Error Types & Actions

| Error Type | Action | Fallback? |
|------------|--------|-----------|
| Quota Exceeded | Log + Fallback | Yes |
| Rate Limited | Log + Fallback | Yes |
| Invalid API Key | Log + Error | No |
| Network Timeout | Log + Fallback | Yes |
| Service Unavailable | Log + Fallback | Yes |
| Invalid Response | Log + Fallback | Yes |
| Token Limit | Log + Error | No* |

*Token limit errors might be handled by truncating and retrying

### Fallback Failure Handling

**If N8N also fails**:
1. Log both failures
2. Return user-friendly error
3. Suggest retry later
4. Optionally queue for retry

## Performance Considerations

### Timeout Management

- Gemini API timeout: 30 seconds
- N8N fallback timeout: 60 seconds
- Total max wait: 90 seconds

### Caching Strategy

- Cache successful N8N responses (optional)
- Cache error responses (short TTL)
- Don't cache user-specific data

### Rate Limiting

- Limit fallback requests per user
- Limit fallback requests per tool
- Implement exponential backoff

## Security Considerations

### API Key Management

- N8N workflows should use their own Gemini API keys
- Keys stored securely in N8N
- Rotate keys regularly

### Request Validation

- Validate all inputs before sending to N8N
- Sanitize prompts
- Limit prompt size
- Validate response structure

### Logging Privacy

- Hash prompts in logs (don't store full text)
- Don't log sensitive user data
- Comply with data privacy regulations

## Monitoring & Alerts

### Key Metrics

1. **Fallback Rate**: % of requests using fallback
2. **Success Rate**: % of successful fallbacks
3. **Response Time**: Average N8N response time
4. **Error Rate**: % of failed fallbacks

### Alerts

- High fallback rate (>50%)
- Low success rate (<80%)
- N8N webhook failures
- Response time spikes

## Rollout Plan

### Phase 1: Development (Week 1)
- Create fallback service
- Update database schema
- Basic N8N workflow setup

### Phase 2: Testing (Week 2)
- Unit tests
- Integration tests
- N8N workflow testing
- Load testing

### Phase 3: Staging (Week 3)
- Deploy to staging
- End-to-end testing
- Performance testing
- User acceptance testing

### Phase 4: Production (Week 4)
- Gradual rollout (10% → 50% → 100%)
- Monitor metrics
- Adjust as needed

## Success Criteria

1. ✅ Fallback activates automatically on Gemini failures
2. ✅ N8N responses match Gemini format
3. ✅ <5% increase in response time
4. ✅ >95% fallback success rate
5. ✅ Comprehensive logging and monitoring
6. ✅ Admin dashboard for management
7. ✅ Zero user-facing errors from fallback

## Future Enhancements

1. **Multiple N8N Endpoints**: Load balance across N8N instances
2. **Smart Routing**: Choose best endpoint based on load
3. **Response Caching**: Cache common requests
4. **Predictive Fallback**: Pre-emptively use N8N during high load
5. **A/B Testing**: Compare Gemini vs N8N quality
6. **Cost Optimization**: Route based on cost/performance

## Dependencies

### Backend
- Laravel 10+
- Guzzle HTTP Client
- Existing N8N integration

### N8N
- N8N server with webhook support
- Gemini API access (or alternative AI)
- Sufficient server resources

### Database
- PostgreSQL (existing)
- Migration support

## Risk Assessment

### Risks

1. **N8N Server Downtime**: Mitigate with health checks and alerts
2. **Response Format Mismatch**: Mitigate with strict validation
3. **Increased Latency**: Mitigate with timeout limits
4. **Cost Increase**: Monitor and optimize N8N usage
5. **Data Privacy**: Ensure N8N workflows comply with regulations

### Mitigation Strategies

- Health checks before fallback
- Response validation
- Timeout limits
- Cost monitoring
- Privacy compliance review

## Conclusion

This plan provides a comprehensive approach to implementing Gemini API management with N8N fallback. The system will ensure high availability and reliability while maintaining response quality and user experience.

**Next Steps**:
1. Review and approve this plan
2. Set up N8N server and workflows
3. Begin Phase 1 implementation
4. Schedule regular progress reviews
