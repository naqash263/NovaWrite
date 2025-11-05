# 🔄 n8n Workflow Templates for Marketing Automation
## Ready-to-Import Workflows for Your Marketing Tasks

**Created:** November 3, 2025  
**Platform:** n8n (self-hosted or cloud)

---

## 📋 Table of Contents

1. [Blog Post Auto-Distribution](#1-blog-post-auto-distribution)
2. [Daily SEO Monitoring](#2-daily-seo-monitoring)
3. [Competitor Content Monitor](#3-competitor-content-monitor)
4. [Outreach Follow-Up Manager](#4-outreach-follow-up-manager)
5. [HARO Query Filter](#5-haro-query-filter)
6. [Backlink Alert System](#6-backlink-alert-system)
7. [Weekly SEO Report](#7-weekly-seo-report)
8. [Content Idea Generator](#8-content-idea-generator)

---

## Prerequisites

### Required n8n Nodes
- **HTTP Request** - For API calls
- **Code** - For data processing
- **Google Sheets** - For data storage
- **Gmail** - For email sending
- **Schedule Trigger** - For time-based triggers
- **Webhook** - For event-based triggers
- **IF** - For conditional logic
- **Switch** - For routing

### Required API Keys
- Google Analytics API
- Google Search Console API
- Ahrefs API (optional, can use free tools)
- Hunter.io API (for email finding)
- Gmail API
- Social Media APIs (LinkedIn, Twitter, Facebook)

---

## 1. Blog Post Auto-Distribution

### Workflow Overview
Automatically distributes new blog posts to all social media platforms when published.

### Trigger
- **Webhook** - When new blog post is published (from your backend)
- **OR Schedule** - Check for new posts every hour

### Workflow Steps

```
1. Webhook Trigger (from your API)
   ↓
2. Extract Post Data (title, excerpt, URL, image)
   ↓
3. Create LinkedIn Post
   ↓
4. Create Twitter Thread (3-5 tweets)
   ↓
5. Create Facebook Post
   ↓
6. Create Medium Draft
   ↓
7. Schedule Posts (optimal times)
   ↓
8. Log to Google Sheets
   ↓
9. Send Confirmation Email
```

### n8n JSON Configuration

```json
{
  "name": "Blog Post Auto-Distribution",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "blog-published",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const postData = $input.first().json;\nconst title = postData.title;\nconst excerpt = postData.excerpt || postData.description;\nconst url = postData.url || `https://naqashthaheem.com/blog/${postData.slug}`;\nconst image = postData.image_url || postData.featured_image;\n\nreturn {\n  title: title,\n  excerpt: excerpt.substring(0, 200),\n  url: url,\n  image: image,\n  hashtags: '#AIautomation #WorkflowAutomation #BusinessAutomation'\n};"
      },
      "name": "Extract Post Data",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "resource": "post",
        "text": "={{ $json.excerpt }}\n\nRead more: {{ $json.url }}\n\n{{ $json.hashtags }}",
        "visibility": "public"
      },
      "name": "Post to LinkedIn",
      "type": "n8n-nodes-base.linkedIn",
      "position": [650, 200]
    },
    {
      "parameters": {
        "text": "={{ $json.title }}\n\n{{ $json.excerpt }}\n\n{{ $json.url }}",
        "additionalFields": {}
      },
      "name": "Post to Twitter",
      "type": "n8n-nodes-base.twitter",
      "position": [650, 300]
    },
    {
      "parameters": {
        "message": "={{ $json.title }}\n\n{{ $json.excerpt }}\n\n{{ $json.url }}",
        "additionalFields": {}
      },
      "name": "Post to Facebook",
      "type": "n8n-nodes-base.facebook",
      "position": [650, 400]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Extract Post Data"}]]
    },
    "Extract Post Data": {
      "main": [[{"node": "Post to LinkedIn"}, {"node": "Post to Twitter"}, {"node": "Post to Facebook"}]]
    }
  }
}
```

### How to Use
1. Import this workflow into n8n
2. Configure API credentials for each social platform
3. Set up webhook endpoint in your backend to trigger this workflow
4. Test with a sample blog post

---

## 2. Daily SEO Monitoring

### Workflow Overview
Daily automated check of SEO metrics and sends email report.

### Trigger
- **Schedule Trigger** - Daily at 9:00 AM

### Workflow Steps

```
1. Schedule Trigger (Daily 9 AM)
   ↓
2. Fetch Google Analytics Data
   ↓
3. Fetch Google Search Console Data
   ↓
4. Check Keyword Rankings (Top 20)
   ↓
5. Check New Backlinks
   ↓
6. Compare to Previous Day
   ↓
7. Generate Report
   ↓
8. Send Email Report
```

### n8n JSON Configuration (Simplified)

```json
{
  "name": "Daily SEO Monitoring",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "hoursInterval": 24}]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "resource": "report",
        "operation": "get",
        "viewId": "YOUR_VIEW_ID",
        "dateRanges": {
          "values": [
            {
              "startDate": "={{ $now.minus({days: 1}).toFormat('yyyy-MM-dd') }}",
              "endDate": "={{ $now.toFormat('yyyy-MM-dd') }}"
            }
          ]
        },
        "metrics": "ga:sessions,ga:users,ga:pageviews",
        "dimensions": "ga:date"
      },
      "name": "Google Analytics",
      "type": "n8n-nodes-base.googleAnalytics",
      "position": [450, 300]
    },
    {
      "parameters": {
        "resource": "searchAnalytics",
        "operation": "query",
        "siteUrl": "https://naqashthaheem.com",
        "startDate": "={{ $now.minus({days: 1}).toFormat('yyyy-MM-dd') }}",
        "endDate": "={{ $now.toFormat('yyyy-MM-dd') }}",
        "dimensions": "query",
        "rowLimit": 20
      },
      "name": "Search Console",
      "type": "n8n-nodes-base.googleSearchConsole",
      "position": [450, 400]
    },
    {
      "parameters": {
        "jsCode": "const analytics = $input.first().json;\nconst searchConsole = $input.all()[1].json;\n\nconst report = `\nDaily SEO Report - ${new Date().toLocaleDateString()}\n\n📊 Traffic:\n- Sessions: ${analytics.sessions || 'N/A'}\n- Users: ${analytics.users || 'N/A'}\n- Pageviews: ${analytics.pageviews || 'N/A'}\n\n🔍 Top Queries:\n${searchConsole.rows?.slice(0, 10).map((row, i) => `${i+1}. ${row.keys[0]} - ${row.clicks} clicks`).join('\\n') || 'No data'}\n`;\n\nreturn { report };\n"
      },
      "name": "Generate Report",
      "type": "n8n-nodes-base.code",
      "position": [650, 350]
    },
    {
      "parameters": {
        "to": "your-email@example.com",
        "subject": "Daily SEO Report - {{ $now.toFormat('yyyy-MM-dd') }}",
        "text": "={{ $json.report }}"
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "position": [850, 350]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{"node": "Google Analytics"}, {"node": "Search Console"}]]
    },
    "Google Analytics": {
      "main": [[{"node": "Generate Report"}]]
    },
    "Search Console": {
      "main": [[{"node": "Generate Report"}]]
    },
    "Generate Report": {
      "main": [[{"node": "Send Email"}]]
    }
  }
}
```

---

## 3. Competitor Content Monitor

### Workflow Overview
Monitors competitor blogs and alerts when they publish new content.

### Trigger
- **Schedule Trigger** - Every 2 hours

### Workflow Steps

```
1. Schedule Trigger (Every 2 hours)
   ↓
2. Fetch Competitor RSS Feeds
   ↓
3. Check for New Posts
   ↓
4. Extract Topics/Keywords
   ↓
5. Compare to Your Content
   ↓
6. Send Alert Email
   ↓
7. Log to Google Sheets
```

### n8n JSON Configuration (Simplified)

```json
{
  "name": "Competitor Content Monitor",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "hoursInterval": 2}]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "https://zapier.com/blog/rss/",
        "options": {}
      },
      "name": "Fetch RSS Feed",
      "type": "n8n-nodes-base.rssFeedRead",
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "const items = $input.all();\nconst lastCheck = $workflow.getStaticData('lastCheckTime') || new Date(Date.now() - 86400000);\n\nconst newPosts = items.filter(item => {\n  const postDate = new Date(item.json.pubDate);\n  return postDate > lastCheck;\n});\n\nif (newPosts.length > 0) {\n  $workflow.setStaticData('lastCheckTime', new Date());\n  return newPosts.map(post => ({\n    title: post.json.title,\n    url: post.json.link,\n    date: post.json.pubDate,\n    excerpt: post.json.contentSnippet\n  }));\n}\n\nreturn [];\n"
      },
      "name": "Check for New Posts",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [{
            "value1": "={{ $json.length }}",
            "operation": "larger",
            "value2": 0
          }]
        }
      },
      "name": "IF New Posts Found",
      "type": "n8n-nodes-base.if",
      "position": [850, 300]
    },
    {
      "parameters": {
        "to": "your-email@example.com",
        "subject": "New Competitor Content Alert",
        "text": "={{ $json.map(post => `${post.title}\\n${post.url}\\n${post.excerpt}`).join('\\n\\n---\\n\\n') }}"
      },
      "name": "Send Alert",
      "type": "n8n-nodes-base.emailSend",
      "position": [1050, 250]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{"node": "Fetch RSS Feed"}]]
    },
    "Fetch RSS Feed": {
      "main": [[{"node": "Check for New Posts"}]]
    },
    "Check for New Posts": {
      "main": [[{"node": "IF New Posts Found"}]]
    },
    "IF New Posts Found": {
      "main": [[{"node": "Send Alert"}]]
    }
  }
}
```

---

## 4. Outreach Follow-Up Manager

### Workflow Overview
Automatically sends follow-up emails for outreach campaigns.

### Trigger
- **Schedule Trigger** - Daily at 10:00 AM

### Workflow Steps

```
1. Schedule Trigger (Daily 10 AM)
   ↓
2. Read Google Sheets (Outreach Tracker)
   ↓
3. Filter: Sent 5+ days ago, No Response
   ↓
4. Check: Not already followed up
   ↓
5. Send Follow-up Email
   ↓
6. Update Google Sheets
   ↓
7. Log Activity
```

### Implementation Notes
- Store outreach data in Google Sheets
- Use Gmail API to send personalized emails
- Track follow-up count (max 2 follow-ups)

---

## 5. HARO Query Filter

### Workflow Overview
Filters HARO emails for relevant queries and sends notifications.

### Trigger
- **Schedule Trigger** - Every 2 hours (during business hours)

### Workflow Steps

```
1. Schedule Trigger (Every 2 hours)
   ↓
2. Check Gmail (HARO folder)
   ↓
3. Filter by Keywords
   ↓
4. Extract Query Details
   ↓
5. Generate Response Template
   ↓
6. Send Notification
   ↓
7. Log to Google Sheets
```

### Keywords to Filter
- automation
- AI
- workflow
- business process
- efficiency
- productivity
- integration
- CRM
- data analytics

---

## 6. Backlink Alert System

### Workflow Overview
Monitors new backlinks and sends alerts.

### Trigger
- **Schedule Trigger** - Daily at 8:00 AM

### Workflow Steps

```
1. Schedule Trigger (Daily 8 AM)
   ↓
2. Check Ahrefs API (or free alternative)
   ↓
3. Compare to Previous Day
   ↓
4. Identify New Backlinks
   ↓
5. Check Domain Authority
   ↓
6. Send Alert Email
   ↓
7. Log to Google Sheets
```

### Free Alternative
If Ahrefs API is not available, use:
- Google Search Console (referring sites)
- Free backlink checkers via web scraping
- Manual monitoring setup

---

## 7. Weekly SEO Report

### Workflow Overview
Generates comprehensive weekly SEO report.

### Trigger
- **Schedule Trigger** - Every Monday at 9:00 AM

### Workflow Steps

```
1. Schedule Trigger (Monday 9 AM)
   ↓
2. Fetch Google Analytics (Week)
   ↓
3. Fetch Search Console (Week)
   ↓
4. Fetch Backlink Data
   ↓
5. Calculate Metrics
   ↓
6. Generate HTML Report
   ↓
7. Send Email
   ↓
8. Save to Google Drive
```

---

## 8. Content Idea Generator

### Workflow Overview
Generates content ideas based on trends and competitor analysis.

### Trigger
- **Schedule Trigger** - Weekly on Monday

### Workflow Steps

```
1. Schedule Trigger (Weekly Monday)
   ↓
2. Analyze Top Performing Content
   ↓
3. Check Google Trends
   ↓
4. Monitor Competitor Content
   ↓
5. Check Search Queries
   ↓
6. Generate Content Ideas
   ↓
7. Prioritize Ideas
   ↓
8. Send to Trello/Email
```

---

## Implementation Guide

### Step 1: Set Up n8n
```bash
# Using Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Or use n8n Cloud (easier)
```

### Step 2: Configure Credentials
1. Go to Settings → Credentials
2. Add credentials for:
   - Google Analytics
   - Google Search Console
   - Gmail
   - Social Media APIs
   - Hunter.io
   - Ahrefs (if available)

### Step 3: Import Workflows
1. Copy workflow JSON
2. Go to n8n → Workflows → Import
3. Paste JSON
4. Configure nodes
5. Activate workflow

### Step 4: Test Workflows
1. Test each workflow manually
2. Verify email notifications
3. Check data in Google Sheets
4. Monitor for errors

### Step 5: Monitor & Optimize
1. Check workflow execution logs
2. Optimize based on performance
3. Add error handling
4. Scale successful workflows

---

## Integration with Your Backend

### Webhook Endpoint Setup
Add to your Laravel backend:

```php
// routes/api.php
Route::post('/webhooks/blog-published', function (Request $request) {
    // Trigger n8n workflow
    Http::post(env('N8N_WEBHOOK_URL'), [
        'title' => $request->title,
        'excerpt' => $request->excerpt,
        'url' => $request->url,
        'slug' => $request->slug,
        'image_url' => $request->image_url,
    ]);
    
    return response()->json(['success' => true]);
});
```

### n8n Webhook URL
Get webhook URL from n8n:
1. Create Webhook node
2. Copy webhook URL
3. Add to `.env`: `N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/blog-published`

---

## Troubleshooting

### Common Issues

**1. API Rate Limits**
- Add delays between requests
- Use batch processing
- Cache responses

**2. Authentication Errors**
- Refresh OAuth tokens
- Check API keys
- Verify permissions

**3. Workflow Not Triggering**
- Check schedule settings
- Verify webhook URL
- Check execution logs

**4. Data Not Processing**
- Verify data format
- Check node configurations
- Test with sample data

---

## Best Practices

1. **Start Small:** Begin with 1-2 workflows
2. **Test Thoroughly:** Test before production
3. **Monitor Regularly:** Check execution logs
4. **Handle Errors:** Add error handling nodes
5. **Document:** Document each workflow
6. **Backup:** Export workflows regularly
7. **Optimize:** Review and optimize monthly

---

## Next Steps

1. ✅ Set up n8n instance
2. ✅ Configure credentials
3. ✅ Import first workflow (Blog Post Distribution)
4. ✅ Test and iterate
5. ✅ Add more workflows gradually
6. ✅ Monitor and optimize

---

**Remember:** Automation should save time, not create more work. Start with workflows that give you the most value.

**Last Updated:** November 3, 2025

