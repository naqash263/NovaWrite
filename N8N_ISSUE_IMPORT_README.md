# N8N Issue Import Guide

This guide explains how to use the N8N agent prompt to scrape viral IT issues and import them into your Issues system.

## Overview

1. **N8N Agent** searches for popular IT issues from various platforms
2. **Agent returns JSON** with issue data, resolutions, and comments
3. **Import script** processes JSON and creates issues via API

## Files

- `N8N_AGENT_PROMPT_ISSUE_SCRAPER.md` - Detailed prompt for N8N agent
- `N8N_AGENT_PROMPT_CONCISE.md` - Concise version for quick reference
- `scripts/import_issues_from_n8n.py` - Python import script
- `scripts/import_issues_from_n8n.js` - Node.js import script
- `ISSUE_CREATE_API_DOC.md` - Complete API documentation

## Step 1: Configure N8N Agent

### Option A: Use Detailed Prompt
Copy the content from `N8N_AGENT_PROMPT_ISSUE_SCRAPER.md` and use it as your agent prompt.

### Option B: Use Concise Prompt
Copy the content from `N8N_AGENT_PROMPT_CONCISE.md` for a shorter, focused prompt.

### N8N Workflow Setup

1. **Create an AI Agent Node** (or use HTTP Request to call an AI API)
2. **Set the prompt** from one of the prompt files
3. **Configure search parameters**:
   - Number of issues to find: 5-10
   - Platforms: Stack Overflow, GitHub, Reddit, Dev.to
   - Topics: Database, API, DevOps, Security, etc.
4. **Set output format**: JSON
5. **Save response** to a file or pass to next node

## Step 2: Get Your API Token

1. Log in to your admin dashboard
2. Go to **API Tokens**
3. Create a new token with `admin` permissions
4. Copy the token (you'll only see it once!)

## Step 3: Run Import Script

### Python Version

**Prerequisites:**
```bash
pip install requests
```

**Usage:**
```bash
python scripts/import_issues_from_n8n.py <json_file> <api_token>
```

**Example:**
```bash
python scripts/import_issues_from_n8n.py n8n_output.json your_api_token_here
```

### Node.js Version

**Prerequisites:**
- Node.js installed (no additional packages needed)

**Usage:**
```bash
node scripts/import_issues_from_n8n.js <json_file> <api_token>
```

**Example:**
```bash
node scripts/import_issues_from_n8n.js n8n_output.json your_api_token_here
```

## Expected JSON Format

The N8N agent should return JSON in this format:

```json
{
  "issues": [
    {
      "issue": {
        "title": "How to fix PostgreSQL connection refused error?",
        "description": "Detailed problem description...",
        "category_name": "Database Questions",
        "priority": "high",
        "labels": ["postgresql", "database-connection"],
        "status": "resolved"
      },
      "resolution": {
        "resolution_notes": "Step-by-step solution..."
      },
      "comments": [
        {
          "content": "Helpful comment...",
          "is_solution": false
        }
      ]
    }
  ]
}
```

## What the Script Does

1. **Fetches categories** from API and maps names to IDs
2. **Creates each issue** via `POST /api/issues`
3. **Adds resolution** via `POST /api/issues/{id}/status`
4. **Adds comments** via `POST /api/comments`
5. **Handles rate limiting** (1 second between issues, 0.5 seconds between comments)
6. **Reports results** (success/failure counts)

## Category Mapping

The script automatically maps category names to IDs. Available categories:

- Technical Support
- Programming Help
- System Administration
- Database Questions
- Networking & Security
- DevOps & CI/CD
- Frontend Development
- General IT Discussion
- Other

If a category name doesn't match, the issue will be created without a category.

## Troubleshooting

### Error: "Category not found"
- Check that category names in JSON match exactly (case-sensitive)
- Verify categories exist in your database: `GET /api/issue-categories`

### Error: "Authentication required"
- Verify your API token is correct
- Check token hasn't expired
- Ensure token has `admin` permissions

### Error: "Rate limit exceeded"
- The script includes rate limiting, but if you see this:
  - Increase delays in the script
  - Run import in smaller batches
  - Wait before retrying

### Error: "Validation failed"
- Check that:
  - Title is 5-255 characters
  - Description is 10-10000 characters
  - Resolution notes are max 2000 characters
  - Comments are 3-5000 characters
  - Priority is one of: low, medium, high, critical

## Example N8N Workflow

```
1. HTTP Request (Search Stack Overflow)
   ↓
2. AI Agent (Extract Issues)
   ↓
3. Code Node (Format as JSON)
   ↓
4. Write Binary File (Save JSON)
   ↓
5. Execute Command (Run import script)
```

## Manual Testing

You can test the import with a sample JSON file:

```json
{
  "issues": [
    {
      "issue": {
        "title": "Test Issue: Database Connection Problem",
        "description": "This is a test issue to verify the import process works correctly. It includes a detailed description of a database connection problem.",
        "category_name": "Database Questions",
        "priority": "medium",
        "labels": ["test", "database"],
        "status": "resolved"
      },
      "resolution": {
        "resolution_notes": "This is a test resolution. The issue was resolved by updating the connection settings."
      },
      "comments": [
        {
          "content": "This is a test comment to verify comments are imported correctly.",
          "is_solution": false
        }
      ]
    }
  ]
}
```

Save this as `test_issues.json` and run:
```bash
python scripts/import_issues_from_n8n.py test_issues.json YOUR_API_TOKEN
```

## Best Practices

1. **Start Small**: Test with 1-2 issues first
2. **Review Output**: Check the imported issues in the admin panel
3. **Verify Quality**: Ensure issues are helpful and accurate
4. **Monitor Rate Limits**: Don't import too many issues at once
5. **Backup First**: Consider backing up your database before bulk imports

## Next Steps

After importing issues:
1. Review them in the admin panel
2. Check that categories are assigned correctly
3. Verify resolutions are complete
4. Ensure comments are helpful
5. Pin important issues if needed

## Support

If you encounter issues:
1. Check the API documentation: `ISSUE_CREATE_API_DOC.md`
2. Verify your API token is valid
3. Test with a single issue first
4. Check server logs for detailed error messages




