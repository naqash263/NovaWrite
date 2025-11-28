# Gemini API System Analysis & Implementation Guide

## Current System Overview

### API Key Management

#### 1. **Admin API Keys (GeminiApiKey Model)**
- **Table**: `gemini_api_keys`
- **Fields**:
  - `name`: Key identifier
  - `api_key`: Encrypted API key
  - `max_requests`: Maximum requests per day (default: 100)
  - `total_requests`: Total requests available (same as max_requests)
  - `used_requests`: Number of requests used
  - `is_active`: Whether key is active
  - `last_reset_at`: Last time limits were reset

#### 2. **User API Keys (UserApiKey Model)**
- **Table**: `user_api_keys`
- **Fields**:
  - `user_id`: Owner of the key
  - `name`: Key identifier
  - `api_key`: Encrypted API key
  - `max_requests`: Maximum requests per day (default: 100)
  - `used_requests`: Number of requests used
  - `is_active`: Whether key is active
  - `last_reset_at`: Last time limits were reset

### API Key Selection Logic

The system uses a **priority-based selection**:

1. **Authenticated Users**: 
   - First tries user's own API keys (`user_api_keys`)
   - Falls back to admin keys if user keys exhausted

2. **Public/Unauthenticated Users**:
   - Uses admin API keys (`gemini_api_keys`)
   - Rotates through available keys

3. **Key Selection Criteria**:
   - Must be `is_active = true`
   - Must have `used_requests < max_requests` (or `total_requests` for admin keys)
   - Selects first available key

### Usage Tracking

#### Current Implementation:
- **Global tracking**: All API calls increment `used_requests` on the selected key
- **No per-endpoint tracking**: All endpoints share the same API key pool
- **Daily reset**: Limits reset daily (100 requests per key per day)

#### Usage Increment:
```php
// After successful API call:
$apiKey->incrementUsage(); // Increments used_requests by 1
```

### Daily Reset System

- **Command**: `php artisan api:reset-limits`
- **Frequency**: Should run daily (via cron)
- **Action**: 
  - Resets `used_requests = 0`
  - Sets `total_requests = 100`
  - Sets `max_requests = 100`
  - Updates `last_reset_at = now()`

## Current API Endpoints Using Gemini

1. **CV AI Tools** (`/api/cv-ai/*`):
   - `/extract` - Extract CV data
   - `/tailor` - Tailor CV to job

2. **Career Tools** (`/api/career-tools/*`):
   - `/linkedin/analyze` - Analyze LinkedIn profile
   - `/cover-letter/generate` - Generate cover letter
   - `/interview-prep/generate` - Interview preparation
   - `/salary-negotiation/generate` - Salary negotiation
   - `/skills-assessment/generate` - Skills assessment
   - `/career-path/generate` - Career path planning
   - `/job-search/generate` - Job search strategy

## Limitations of Current System

### ❌ No Per-Endpoint Tracking
- All endpoints share the same API key pool
- Cannot track which tool uses how many requests
- Cannot set different limits per tool

### ❌ No Per-User Rate Limiting
- Public users share admin API keys
- No individual user limits (except authenticated users with their own keys)

### ❌ No Request Cost Tracking
- All requests count as 1, regardless of complexity
- No differentiation between simple and complex prompts

## Recommended Improvements for New Tools

### Option 1: Keep Current System (Simple)
**Pros:**
- No database changes needed
- Works immediately
- Simple to implement

**Cons:**
- All tools share same limits
- Cannot track per-tool usage
- Cannot optimize per-tool

**Implementation:**
- Just use existing `getAvailableApiKey()` and `incrementUsage()` methods
- All new tools will share the same API key pool

### Option 2: Add Per-Endpoint Tracking (Recommended)
**Pros:**
- Track usage per tool
- Set different limits per tool
- Better analytics
- Can optimize high-usage tools

**Cons:**
- Requires database migration
- More complex implementation

**Implementation:**
1. Create `api_usage_logs` table:
   ```sql
   - id
   - api_key_id (nullable, for admin keys)
   - user_id (nullable, for user keys)
   - endpoint (e.g., 'text-summarizer', 'grammar-checker')
   - tool_name (e.g., 'Text Summarizer')
   - request_count (default: 1)
   - created_at
   ```

2. Log each API call:
   ```php
   ApiUsageLog::create([
       'api_key_id' => $apiKey instanceof GeminiApiKey ? $apiKey->id : null,
       'user_id' => $apiKey instanceof UserApiKey ? $apiKey->user_id : null,
       'endpoint' => 'text-summarizer',
       'tool_name' => 'Text Summarizer',
       'request_count' => 1
   ]);
   ```

3. Add analytics endpoint:
   ```php
   GET /api/admin/api-usage/stats
   // Returns usage per tool, per key, per user
   ```

### Option 3: Per-Tool API Key Pools (Advanced)
**Pros:**
- Complete isolation between tools
- Can set different limits per tool
- Better resource management

**Cons:**
- Most complex
- Requires multiple API keys per tool

**Implementation:**
- Create separate API key pools for each tool
- More complex key selection logic

## Recommended Approach for New Tools

### Phase 1: Implement with Current System
- Use existing `getAvailableApiKey()` method
- Use existing `incrementUsage()` method
- All tools share the same pool (simple and works)

### Phase 2: Add Usage Logging (Optional)
- Create `api_usage_logs` table
- Log each API call with endpoint name
- Add analytics dashboard
- This allows tracking without changing limits

### Phase 3: Per-Tool Limits (Future)
- If needed, implement per-tool limits later
- Based on usage data from Phase 2

## Implementation Template for New Tools

```php
<?php

namespace App\Http\Controllers\Api;

use App\Services\CareerAiService; // Or create new service
use App\Models\GeminiApiKey;
use App\Models\UserApiKey;
use Illuminate\Http\Request;

class TextSummarizerController extends Controller
{
    private $aiService;
    
    public function __construct(CareerAiService $aiService)
    {
        $this->aiService = $aiService;
    }
    
    public function summarize(Request $request)
    {
        // 1. Validate input
        $request->validate([
            'text' => 'required|string|max:50000',
            'length' => 'sometimes|in:short,medium,long'
        ]);
        
        // 2. Get available API key (handles user/admin priority)
        $apiKey = $this->getAvailableApiKey();
        
        if (!$apiKey) {
            return response()->json([
                'error' => 'No available API keys. Please try again later.'
            ], 503);
        }
        
        // 3. Build prompt
        $prompt = $this->buildSummarizePrompt($request->text, $request->length);
        
        // 4. Call Gemini API
        try {
            $response = $this->aiService->callGeminiApi($apiKey, $prompt);
            
            // 5. Increment usage (tracks globally)
            $this->incrementApiUsage($apiKey);
            
            // 6. Optional: Log usage per endpoint
            // ApiUsageLog::create([...]);
            
            return response()->json([
                'success' => true,
                'summary' => $response['summary'] ?? $response,
                'remaining_requests' => $apiKey->remaining_requests ?? 0
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate summary: ' . $e->getMessage()
            ], 500);
        }
    }
    
    private function getAvailableApiKey()
    {
        // Use existing method from CareerAiService or CvAiService
        // This handles user/admin priority automatically
    }
    
    private function incrementApiUsage($apiKey)
    {
        // Use existing method from CareerAiService
        // Increments used_requests on the key
    }
    
    private function buildSummarizePrompt($text, $length)
    {
        $lengthMap = [
            'short' => 'in 2-3 sentences',
            'medium' => 'in 1-2 paragraphs',
            'long' => 'in 3-5 paragraphs'
        ];
        
        return "Summarize the following text {$lengthMap[$length]}:\n\n{$text}";
    }
}
```

## Current API Limits Summary

### Admin Keys (GeminiApiKey):
- **Default Limit**: 100 requests per key per day
- **Reset**: Daily (via cron job)
- **Shared**: All public users share these keys

### User Keys (UserApiKey):
- **Default Limit**: 100 requests per key per day
- **Reset**: Daily (via cron job)
- **Per User**: Each authenticated user can have their own keys

### Total Available Requests:
- **Admin Pool**: Sum of all active admin keys × 100
- **User Pool**: Sum of all active user keys × 100
- **Example**: 3 admin keys = 300 requests/day for public users

## Recommendations for New Tools

1. **Start Simple**: Use existing system, all tools share pool
2. **Monitor Usage**: Check `/api/cv-ai/stats` to see current usage
3. **Add Logging**: Implement usage logs for analytics (optional)
4. **Scale Keys**: Add more API keys if needed (each = 100 more requests/day)

## Next Steps

1. ✅ Understand current system (this document)
2. ✅ Implement first tool using existing system
3. ⏳ Monitor usage patterns
4. ⏳ Add usage logging if needed
5. ⏳ Optimize based on data

