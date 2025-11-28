# Gemini-Powered & Self-Hosted Tools Implementation Plan

## Current Gemini API System Status

### ✅ What's Working:
- **API Key Management**: Admin and user keys with encryption
- **Usage Tracking**: Global tracking per API key
- **Daily Limits**: 100 requests per key per day (resets daily)
- **Key Selection**: Automatic priority (user keys → admin keys)
- **Existing Tools**: CV AI, Career Tools (7 endpoints)

### 📊 Current Limits:
- **Admin Keys**: Shared pool for public users
- **User Keys**: Individual limits for authenticated users
- **Reset**: Daily via `php artisan api:reset-limits`
- **Tracking**: Global `used_requests` counter per key

### ⚠️ Limitations:
- **No per-endpoint tracking**: All tools share same pool
- **No per-tool limits**: Cannot set different limits per tool
- **Shared resources**: Public users share admin keys

## Tools to Implement

### Category 1: Gemini-Powered Tools (Using Existing System)

#### Priority 1: High SEO Value + Easy Implementation

1. **Text Summarizer** 📝
   - **Endpoint**: `POST /api/text-summarizer/summarize`
   - **Input**: Text (max 50,000 chars), length (short/medium/long)
   - **Output**: Summarized text
   - **Complexity**: Low
   - **SEO Value**: Very High
   - **API Calls**: 1 per request

2. **Article Rewriter/Paraphrase Tool** ✍️
   - **Endpoint**: `POST /api/article-rewriter/rewrite`
   - **Input**: Text, style (formal/casual/creative)
   - **Output**: Rewritten text
   - **Complexity**: Low
   - **SEO Value**: Very High
   - **API Calls**: 1 per request

3. **Grammar Checker & Corrector** ✅
   - **Endpoint**: `POST /api/grammar-checker/check`
   - **Input**: Text
   - **Output**: Corrected text + suggestions
   - **Complexity**: Low-Medium
   - **SEO Value**: Very High
   - **API Calls**: 1 per request

4. **Language Translator** 🌐
   - **Endpoint**: `POST /api/translator/translate`
   - **Input**: Text, source language, target language
   - **Output**: Translated text
   - **Complexity**: Low
   - **SEO Value**: High
   - **API Calls**: 1 per request

5. **Keyword Extractor** 🔑
   - **Endpoint**: `POST /api/keyword-extractor/extract`
   - **Input**: Text
   - **Output**: Keywords array
   - **Complexity**: Low
   - **SEO Value**: High
   - **API Calls**: 1 per request

6. **Sentiment Analyzer** 😊
   - **Endpoint**: `POST /api/sentiment-analyzer/analyze`
   - **Input**: Text
   - **Output**: Sentiment (positive/negative/neutral) + score
   - **Complexity**: Low
   - **SEO Value**: Medium
   - **API Calls**: 1 per request

7. **Plagiarism Checker** 🔍
   - **Endpoint**: `POST /api/plagiarism-checker/check`
   - **Input**: Text
   - **Output**: Similarity percentage + sources
   - **Complexity**: Medium
   - **SEO Value**: Very High
   - **API Calls**: 1 per request (may need multiple for accuracy)

### Category 2: Self-Hosted Tools (No API Costs)

#### Priority 1: High Utility + No Backend API Needed

8. **URL Shortener** 🔗
   - **Backend**: Custom Laravel
   - **Database**: Store shortened URLs
   - **Features**: Shorten, analytics, custom aliases, expiration
   - **Complexity**: Low-Medium
   - **SEO Value**: Medium
   - **Cost**: $0 (self-hosted)

9. **PDF Tools** 📄
   - **Backend**: Laravel + PDF libraries
   - **Features**: Merge, split, compress, convert to images
   - **Complexity**: Medium
   - **SEO Value**: High
   - **Cost**: $0 (self-hosted)

10. **Image Compressor** 🗜️
    - **Backend**: Laravel + ImageMagick/GD
    - **Features**: Compress, format conversion, quality adjustment
    - **Complexity**: Medium
    - **SEO Value**: Medium
    - **Cost**: $0 (self-hosted)

11. **Base64 Encoder/Decoder** 🔐
    - **Backend**: Laravel
    - **Features**: Encode/decode, image to base64
    - **Complexity**: Very Low
    - **SEO Value**: Low
    - **Cost**: $0 (self-hosted)

12. **Hash Generator** 🔑
    - **Backend**: Laravel
    - **Features**: MD5, SHA1, SHA256, SHA512 hashes
    - **Complexity**: Very Low
    - **SEO Value**: Low
    - **Cost**: $0 (self-hosted)

13. **Code Formatter** 💻
    - **Backend**: Laravel
    - **Features**: Format JSON, XML, HTML, CSS, JS
    - **Complexity**: Low-Medium
    - **SEO Value**: Medium
    - **Cost**: $0 (self-hosted)

14. **Readability Score Calculator** 📖
    - **Backend**: Laravel (formulas)
    - **Features**: Flesch Reading Ease, Flesch-Kincaid, etc.
    - **Complexity**: Low-Medium
    - **SEO Value**: Medium
    - **Cost**: $0 (self-hosted)

## Implementation Order

### Phase 1: Quick Wins (Week 1)
1. ✅ Text Summarizer
2. ✅ Article Rewriter
3. ✅ Grammar Checker
4. ✅ Language Translator

**Why**: High SEO value, easy to implement, use existing Gemini system

### Phase 2: Self-Hosted Tools (Week 2)
5. ✅ URL Shortener
6. ✅ PDF Tools
7. ✅ Image Compressor
8. ✅ Base64 Encoder/Decoder

**Why**: No API costs, high utility, good for SEO

### Phase 3: Additional AI Tools (Week 3)
9. ✅ Keyword Extractor
10. ✅ Sentiment Analyzer
11. ✅ Plagiarism Checker

**Why**: More AI tools, still using Gemini

### Phase 4: Developer Tools (Week 4)
12. ✅ Hash Generator
13. ✅ Code Formatter
14. ✅ Readability Calculator

**Why**: Developer-focused, self-hosted

## Implementation Template

### For Gemini-Powered Tools:

```php
// backend/app/Http/Controllers/Api/TextSummarizerController.php
<?php

namespace App\Http\Controllers\Api;

use App\Services\CareerAiService;
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
        $request->validate([
            'text' => 'required|string|max:50000',
            'length' => 'sometimes|in:short,medium,long'
        ]);
        
        $apiKey = $this->aiService->getAvailableApiKey();
        
        if (!$apiKey) {
            return response()->json([
                'error' => 'Service temporarily unavailable. Please try again later.'
            ], 503);
        }
        
        $prompt = $this->buildPrompt($request->text, $request->length);
        
        try {
            $response = $this->aiService->callGeminiApi($apiKey, $prompt);
            $this->aiService->incrementApiUsage($apiKey);
            
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
    
    private function buildPrompt($text, $length)
    {
        $lengthMap = [
            'short' => 'in 2-3 sentences',
            'medium' => 'in 1-2 paragraphs',
            'long' => 'in 3-5 paragraphs'
        ];
        
        return "Summarize the following text {$lengthMap[$length ?? 'medium']}:\n\n{$text}";
    }
}
```

### For Self-Hosted Tools:

```php
// backend/app/Http/Controllers/Api/UrlShortenerController.php
<?php

namespace App\Http\Controllers\Api;

use App\Models\ShortUrl;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UrlShortenerController extends Controller
{
    public function shorten(Request $request)
    {
        $request->validate([
            'url' => 'required|url',
            'alias' => 'sometimes|string|max:50|unique:short_urls,alias',
            'expires_at' => 'sometimes|date|after:now'
        ]);
        
        $alias = $request->alias ?? Str::random(6);
        
        $shortUrl = ShortUrl::create([
            'original_url' => $request->url,
            'alias' => $alias,
            'expires_at' => $request->expires_at,
            'clicks' => 0
        ]);
        
        return response()->json([
            'success' => true,
            'short_url' => url("/s/{$alias}"),
            'original_url' => $request->url
        ]);
    }
}
```

## Database Migrations Needed

### For Self-Hosted Tools:

1. **URL Shortener**:
```php
Schema::create('short_urls', function (Blueprint $table) {
    $table->id();
    $table->string('original_url');
    $table->string('alias')->unique();
    $table->integer('clicks')->default(0);
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
});
```

2. **Usage Logs** (Optional - for analytics):
```php
Schema::create('api_usage_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('api_key_id')->nullable();
    $table->foreignId('user_id')->nullable();
    $table->string('endpoint');
    $table->string('tool_name');
    $table->integer('request_count')->default(1);
    $table->timestamps();
});
```

## Frontend Integration

### Create New Tools Page:
- Similar to `UtilityTools.tsx`
- Add route: `/resources/ai-tools`
- Include all Gemini-powered tools
- Add self-hosted tools to existing utility tools or separate page

## Next Steps

1. ✅ **Review this plan** - Understand system and tools
2. ⏳ **Start Phase 1** - Implement first 4 Gemini tools
3. ⏳ **Test API limits** - Monitor usage with existing system
4. ⏳ **Add routes** - Update `routes/api.php`
5. ⏳ **Create frontend** - Build tool components
6. ⏳ **Add to Resources page** - Update Resources.tsx

## Estimated API Usage

### Per Tool (Average):
- **Text Summarizer**: 1 API call per request
- **Article Rewriter**: 1 API call per request
- **Grammar Checker**: 1 API call per request
- **Language Translator**: 1 API call per request

### Daily Capacity (Example):
- **3 Admin Keys**: 300 requests/day
- **10 User Keys**: 1,000 requests/day
- **Total**: 1,300 requests/day

### Recommendation:
- Start with 4 tools
- Monitor usage for 1 week
- Add more keys if needed (each = 100 more requests/day)
- Consider usage logging for analytics

