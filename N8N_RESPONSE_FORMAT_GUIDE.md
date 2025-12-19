# N8N Response Format Guide for Gemini Fallback

## Overview

When your N8N workflow receives a Gemini fallback request, it must return a response in a specific format that matches what the Laravel application expects. This guide shows the exact response format for each tool type.

## Request Format (What N8N Receives)

```json
{
  "action": "gemini_fallback",
  "tool_type": "linkedin_analysis|cv_extract|cv_tailor|cover_letter|...",
  "prompt": "Full prompt text that was sent to Gemini",
  "options": {
    "profile_data": {...},
    "file_type": "pdf",
    "fallback_reason": "quota_exceeded"
  },
  "metadata": {
    "request_id": "req_1234567890",
    "timestamp": "2025-01-15T10:00:00Z",
    "fallback_reason": "quota_exceeded"
  }
}
```

## Response Format Options

N8N can return responses in **two formats**:

### Option 1: Wrapped Format (Recommended)
```json
{
  "success": true,
  "data": {
    // Tool-specific response structure (see below)
  },
  "metadata": {
    "provider": "n8n",
    "processing_time": 2.5,
    "model_used": "gemini-2.0-flash"
  }
}
```

### Option 2: Direct Format
```json
{
  // Tool-specific response structure directly (no wrapper)
  // See examples below for each tool type
}
```

## Response Formats by Tool Type

### 1. LinkedIn Analysis (`linkedin_analysis`)

**Expected Response:**
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
      "current": "Current headline text",
      "suggestion": "Improved headline text",
      "reason": "Why this change will help"
    }
  ],
  "strengths": [
    "Strong technical skills",
    "Good experience diversity"
  ],
  "weaknesses": [
    "Missing keywords",
    "Unclear value proposition"
  ],
  "keywordSuggestions": [
    "React",
    "Node.js",
    "Leadership"
  ],
  "industryKeywords": [
    "Technology Sales",
    "SaaS Solutions"
  ]
}
```

### 2. CV Extract (`cv_extract`)

**Expected Response:**
```json
{
  "fullName": "John Doe",
  "jobTitle": "Software Engineer",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "address": "123 Main St, City, Country",
  "professionalSummary": "Experienced software engineer...",
  "workExperience": [
    {
      "jobTitle": "Senior Software Engineer",
      "company": "Tech Company Inc",
      "startDate": "2020-01",
      "endDate": "2023-12",
      "description": "Developed web applications using React and Node.js..."
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of Technology",
      "graduationYear": "2018"
    }
  ],
  "skills": "JavaScript, React, Node.js, Python, SQL, Git, AWS",
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": "Technologies used",
      "url": "Project URL (optional)",
      "startDate": "2020-01",
      "endDate": "2020-06"
    }
  ],
  "certificates": [
    {
      "name": "Certificate Name",
      "issuer": "Issuing Organization",
      "date": "2020-01",
      "credentialId": "Credential ID",
      "url": "Certificate URL"
    }
  ],
  "languages": [
    {
      "language": "English",
      "proficiency": "Native"
    }
  ],
  "achievements": [
    {
      "title": "Achievement Title",
      "description": "Achievement description",
      "date": "2020-01"
    }
  ],
  "references": [
    {
      "name": "Reference Name",
      "position": "Position",
      "company": "Company",
      "email": "email@example.com",
      "phone": "+1234567890"
    }
  ]
}
```

### 3. CV Tailor (`cv_tailor`)

**Expected Response:**
Same structure as `cv_extract` above. The response should be a tailored version of the CV data optimized for the job description.

### 4. Cover Letter (`cover_letter`)

**Expected Response:**
```json
{
  "content": "Dear Hiring Manager,\n\n[Generated cover letter content]\n\nSincerely,\n[Name]",
  "atsScore": 92,
  "keywordDensity": {
    "technical": 15,
    "leadership": 8,
    "achievement": 12
  },
  "suggestions": [
    "Consider adding more specific metrics",
    "Include relevant industry keywords"
  ],
  "tone": "Professional and confident",
  "length": "Appropriate for the role"
}
```

### 5. Interview Prep (`interview_prep`)

**Expected Response:**
```json
{
  "practiceQuestions": [
    {
      "category": "Behavioral",
      "question": "Tell me about a time when you had to work under pressure.",
      "difficulty": "Medium",
      "tips": "Use the STAR method: Situation, Task, Action, Result",
      "sampleAnswer": "In my previous role as a software engineer..."
    }
  ],
  "companyResearch": {
    "keyPoints": [
      "Founded in 2010, 500+ employees",
      "Focus on AI and machine learning"
    ],
    "culture": "Innovative and collaborative",
    "recentNews": "Recent funding round of $50M"
  },
  "technicalPrep": [
    {
      "topic": "Data Structures",
      "importance": "High",
      "resources": ["LeetCode problems", "System design basics"]
    }
  ],
  "questionsToAsk": [
    "What does success look like in this role?",
    "How do you measure team performance?"
  ],
  "confidenceTips": [
    "Practice your elevator pitch",
    "Prepare specific examples"
  ]
}
```

### 6. Salary Negotiation (`salary_negotiation`)

**Expected Response:**
```json
{
  "marketSalary": {
    "min": 75000,
    "max": 95000,
    "median": 85000,
    "source": "Based on industry data and location"
  },
  "negotiationRange": {
    "minimum": 80000,
    "target": 90000,
    "maximum": 100000
  },
  "strategy": {
    "approach": "Collaborative",
    "timing": "After offer is made",
    "keyPoints": [
      "Highlight unique value proposition",
      "Reference market research"
    ]
  },
  "scripts": [
    {
      "situation": "Initial offer is below target",
      "script": "I'm excited about this opportunity. Based on my research and experience..."
    }
  ],
  "benefits": [
    "Flexible working hours",
    "Professional development budget"
  ],
  "fallbackOptions": [
    "Signing bonus",
    "Additional vacation days"
  ]
}
```

### 7. Skills Assessment (`skills_assessment`)

**Expected Response:**
```json
{
  "overallScore": 78,
  "categoryScores": {
    "Technical Skills": 85,
    "Soft Skills": 70,
    "Industry-Specific Skills": 75,
    "Leadership & Management": 80,
    "Communication": 85,
    "Problem Solving": 75,
    "Adaptability": 70
  },
  "strengths": [
    {
      "skill": "Project Management",
      "level": "Advanced",
      "score": 90,
      "evidence": "Led 5+ successful projects, certified in PMP"
    }
  ],
  "weaknesses": [
    {
      "skill": "Public Speaking",
      "currentLevel": "Beginner",
      "score": 30,
      "improvement": "Join Toastmasters, practice presentations"
    }
  ],
  "recommendations": [
    {
      "category": "Technical Skills",
      "skills": [
        {
          "name": "Data Analysis",
          "priority": "High",
          "currentLevel": "Intermediate",
          "targetLevel": "Advanced",
          "action": "Complete advanced Excel and SQL courses",
          "timeline": "3 months",
          "resources": ["Coursera Data Analysis course", "Practice with real datasets"]
        }
      ]
    }
  ],
  "learningPath": [
    {
      "phase": "Immediate (1-3 months)",
      "title": "Foundation Building",
      "focus": "Strengthen core competencies",
      "skills": ["Data Analysis", "Presentation Skills"],
      "activities": [
        "Complete online courses",
        "Practice skills through real-world projects"
      ],
      "resources": ["Online courses", "Professional workshops"],
      "timeline": "3 months"
    }
  ],
  "careerAlignment": {
    "overallMatch": 85,
    "recommendedRoles": [
      {
        "title": "Senior Project Manager",
        "match": 90,
        "requiredSkills": ["Project Management", "Leadership"],
        "missingSkills": ["Advanced Analytics"],
        "salaryRange": "$80,000 - $120,000",
        "nextSteps": ["Get PMP certification", "Lead cross-functional projects"]
      }
    ],
    "skillGaps": ["Advanced Analytics", "Strategic Planning"],
    "suggestions": ["Learn data visualization tools", "Study business strategy"]
  },
  "industryInsights": {
    "trendingSkills": ["Digital Literacy", "Remote Work Management"],
    "emergingRoles": ["Digital Transformation Specialist"],
    "salaryGrowth": "Project management roles show 15-20% salary growth potential",
    "jobMarket": "Strong demand across healthcare, finance, technology sectors"
  }
}
```

### 8. Career Path (`career_path`)

**Expected Response:**
```json
{
  "careerPaths": [
    {
      "title": "Technical Leadership Track",
      "description": "Progress from Senior Developer to Tech Lead, Engineering Manager, and CTO",
      "timeline": "3-5 years",
      "probability": "High",
      "skills": ["Leadership", "System Architecture", "Team Management"],
      "nextSteps": [
        "Take on team lead responsibilities",
        "Complete leadership training"
      ],
      "salary": {
        "current": 95000,
        "next": 120000,
        "future": 180000
      }
    }
  ],
  "skillGaps": [
    {
      "skill": "Project Management",
      "importance": "High",
      "action": "Get PMP certification",
      "timeline": "6 months"
    }
  ],
  "networking": [
    {
      "activity": "Join professional associations",
      "timeline": "Immediate",
      "benefit": "Industry connections"
    }
  ],
  "education": [
    {
      "type": "Certification",
      "name": "AWS Solutions Architect",
      "timeline": "3 months",
      "cost": "$300"
    }
  ],
  "milestones": [
    {
      "milestone": "Lead first major project",
      "timeline": "6 months",
      "success": "Project delivered on time and budget"
    }
  ]
}
```

### 9. Job Search (`job_search`)

**Expected Response:**
```json
{
  "jobRecommendations": [
    {
      "title": "Senior Software Engineer",
      "company": "TechCorp Inc.",
      "location": "San Francisco, CA",
      "salary": "$120,000 - $150,000",
      "match": "95%",
      "description": "Full-stack development role with React and Node.js",
      "whyMatch": "Strong match for your React and JavaScript skills",
      "applicationTips": [
        "Highlight your 5+ years of experience",
        "Emphasize your leadership experience"
      ]
    }
  ],
  "searchStrategy": {
    "keywords": ["React", "Node.js", "Full-stack"],
    "jobBoards": ["LinkedIn", "Indeed", "AngelList"],
    "networking": ["Tech meetups", "Industry conferences"]
  },
  "applicationOptimization": {
    "resumeTips": [
      "Use ATS-friendly format",
      "Include relevant keywords"
    ],
    "coverLetterTips": [
      "Customize for each application",
      "Highlight specific achievements"
    ]
  },
  "interviewPrep": {
    "commonQuestions": [
      "Tell me about yourself",
      "Why do you want to work here?"
    ],
    "technicalFocus": ["System design", "Coding challenges"]
  },
  "networkingStrategy": {
    "online": ["LinkedIn outreach", "Professional groups"],
    "offline": ["Industry events", "Coffee meetings"]
  }
}
```

### 10. Grammar Check (`grammar_check`)

**Expected Response:**
```json
{
  "corrected_text": "The corrected version of the text",
  "suggestions": [
    {
      "original": "incorrect text",
      "correction": "correct text",
      "explanation": "Grammar rule explanation"
    }
  ],
  "errors": [
    {
      "type": "grammar",
      "position": 10,
      "message": "Subject-verb agreement error"
    }
  ],
  "score": 85
}
```

### 11. Text Summarize (`text_summarize`)

**Expected Response:**
```json
{
  "summary": "The summarized text content",
  "length": 250,
  "original_length": 1500
}
```

**OR** (if returning just a string):
```json
"The summarized text content"
```

### 12. Article Rewrite (`article_rewrite`)

**Expected Response:**
```json
{
  "rewritten_text": "The rewritten article content",
  "original_text": "Original text (optional)",
  "changes_made": [
    {
      "type": "paraphrase",
      "original": "original phrase",
      "rewritten": "rewritten phrase"
    }
  ]
}
```

**OR** (if returning just a string):
```json
"The rewritten article content"
```

### 13. Language Translate (`language_translate`)

**Expected Response:**
```json
{
  "translated_text": "Translated text content",
  "source_language": "English",
  "target_language": "Spanish",
  "confidence": 0.95
}
```

**OR** (if returning just a string):
```json
"Translated text content"
```

## HTTP Response Requirements

### Success Response
- **Status Code**: `200 OK` or any `2xx` status
- **Content-Type**: `application/json`
- **Body**: JSON format as shown above

### Error Response
If N8N workflow fails, return:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

**Status Code**: `400`, `500`, or other error codes

## Response Processing

The Laravel application will:
1. Accept responses in either format (wrapped or direct)
2. Extract the data from `data` key if present, or use response directly
3. Validate and format the response based on tool type
4. Return to user in the expected format

## Important Notes

1. **JSON Only**: Response must be valid JSON
2. **UTF-8 Encoding**: All text must be UTF-8 encoded
3. **Field Names**: Use exact field names as shown (camelCase)
4. **Arrays**: Use arrays for lists (workExperience, education, etc.)
5. **Optional Fields**: Missing fields will be filled with defaults
6. **Nested Objects**: Maintain nested structure for complex data

## Example N8N Workflow Response

### Simple Response (Direct)
```json
{
  "headlineScore": 85,
  "summaryScore": 70,
  "overallScore": 82,
  "recommendations": [...]
}
```

### Wrapped Response (Recommended)
```json
{
  "success": true,
  "data": {
    "headlineScore": 85,
    "summaryScore": 70,
    "overallScore": 82,
    "recommendations": [...]
  },
  "metadata": {
    "provider": "n8n",
    "processing_time": 2.5
  }
}
```

## Testing Your N8N Response

You can test your N8N workflow by:
1. Sending a test request with the expected payload format
2. Verifying the response matches one of the formats above
3. Checking that all required fields are present
4. Ensuring JSON is valid and properly formatted

## Common Issues

### Issue 1: Missing Fields
**Problem**: Response missing required fields
**Solution**: Use the default structure shown above and fill all fields

### Issue 2: Wrong Field Names
**Problem**: Using snake_case instead of camelCase
**Solution**: Use exact field names as shown (camelCase)

### Issue 3: Invalid JSON
**Problem**: Response contains invalid JSON
**Solution**: Validate JSON before returning, ensure proper escaping

### Issue 4: Wrong Structure
**Problem**: Response structure doesn't match expected format
**Solution**: Follow the exact structure for your tool type

## Quick Reference

| Tool Type | Key Fields | Response Type |
|-----------|-----------|--------------|
| `linkedin_analysis` | headlineScore, recommendations, strengths | Object |
| `cv_extract` | fullName, workExperience, education | Object |
| `cv_tailor` | Same as cv_extract | Object |
| `cover_letter` | content, atsScore, suggestions | Object |
| `interview_prep` | practiceQuestions, companyResearch | Object |
| `salary_negotiation` | marketSalary, strategy, scripts | Object |
| `skills_assessment` | overallScore, strengths, learningPath | Object |
| `career_path` | careerPaths, skillGaps, milestones | Object |
| `job_search` | jobRecommendations, searchStrategy | Object |
| `grammar_check` | corrected_text, suggestions | Object |
| `text_summarize` | summary (or string) | Object/String |
| `article_rewrite` | rewritten_text (or string) | Object/String |
| `language_translate` | translated_text (or string) | Object/String |
