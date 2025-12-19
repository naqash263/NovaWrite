# N8N Webhook Setup for Gemini Fallback

## Quick Setup Guide

### 1. Create Webhook Node in N8N

1. Add **Webhook** node to your workflow
2. Set method to **POST**
3. Set path (e.g., `/webhook/gemini-fallback`)
4. Activate workflow to get webhook URL

### 2. Process Request

Add nodes to:
1. Extract `tool_type` from request body
2. Extract `prompt` from request body
3. Extract `options` (if needed)

### 3. Call Gemini API (or Alternative AI)

Use **HTTP Request** node to call Gemini API:
- URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY`
- Method: POST
- Body: Use the `prompt` from request

### 4. Format Response

Use **Code** node or **Set** node to format response according to tool type.

### 5. Return Response

Use **Respond to Webhook** node to return formatted JSON.

## Response Format Summary

### For LinkedIn Analysis

```json
{
  "headlineScore": 85,
  "summaryScore": 70,
  "skillsScore": 90,
  "overallScore": 82,
  "recommendations": [
    {
      "category": "Headline",
      "priority": "High",
      "suggestion": "Improved headline",
      "example": "Example headline"
    }
  ],
  "strengths": ["Strong technical skills"],
  "weaknesses": ["Missing keywords"],
  "keywordSuggestions": ["React", "Node.js"],
  "industryKeywords": ["Technology Sales"]
}
```

### For CV Extract

```json
{
  "fullName": "John Doe",
  "jobTitle": "Software Engineer",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "address": "123 Main St",
  "professionalSummary": "Experienced engineer...",
  "workExperience": [
    {
      "jobTitle": "Senior Engineer",
      "company": "Tech Corp",
      "startDate": "2020-01",
      "endDate": "2023-12",
      "description": "Developed applications..."
    }
  ],
  "education": [
    {
      "degree": "BS Computer Science",
      "institution": "University",
      "graduationYear": "2018"
    }
  ],
  "skills": "JavaScript, React, Node.js",
  "projects": [],
  "certificates": [],
  "languages": [],
  "achievements": [],
  "references": []
}
```

### For Cover Letter

```json
{
  "content": "Dear Hiring Manager,\n\n[Cover letter text]\n\nSincerely,\n[Name]",
  "atsScore": 92,
  "keywordDensity": {
    "technical": 15,
    "leadership": 8
  },
  "suggestions": ["Add more metrics"],
  "tone": "Professional",
  "length": "Appropriate"
}
```

### For Other Career Tools

Return the structure shown in the prompts. The system will accept the response as-is if it matches the expected format.

## Important Points

1. **Response can be wrapped or direct:**
   ```json
   // Option 1: Wrapped
   {"success": true, "data": {...}}
   
   // Option 2: Direct
   {...}
   ```

2. **HTTP Status**: Return `200 OK` for success

3. **Content-Type**: `application/json`

4. **Field Names**: Use camelCase (e.g., `fullName`, not `full_name`)

5. **Arrays**: Use arrays for lists (workExperience, education, etc.)

6. **Missing Fields**: Will be filled with defaults, but include all fields when possible

## Example N8N Workflow Structure

```
Webhook (POST)
  ↓
Extract tool_type, prompt, options
  ↓
Switch (by tool_type)
  ↓
HTTP Request (Call Gemini API)
  ↓
Parse JSON Response
  ↓
Format Response (Code/Set node)
  ↓
Respond to Webhook (Return JSON)
```

## Testing

Test your webhook with:
```bash
curl -X POST https://your-n8n-server.com/webhook/gemini-fallback \
  -H "Content-Type: application/json" \
  -d '{
    "action": "gemini_fallback",
    "tool_type": "linkedin_analysis",
    "prompt": "Analyze this LinkedIn profile...",
    "options": {}
  }'
```

Expected response: JSON matching the tool type format.
