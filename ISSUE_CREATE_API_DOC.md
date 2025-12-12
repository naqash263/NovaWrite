# Issue Creation API Documentation

## Endpoint
```
POST https://naqashthaheem.com/api/issues
```

## Authentication
You can use either:
1. **API Token** (Recommended for admin): Bearer token from Admin Dashboard → API Tokens
2. **JWT Token**: From `/api/auth/login` endpoint

### Headers
```
Authorization: Bearer YOUR_API_TOKEN_HERE
Content-Type: application/json
```

## Request Body

### Required Fields
- `title` (string, 5-255 characters): Issue title
- `description` (string, 10-10000 characters): Issue description

### Optional Fields
- `category_id` (integer): ID of the issue category (must exist in `issue_categories` table). **Either `category_id` OR `category_name` can be provided, but not both.**
- `category_name` (string): Name of the issue category (must exist in `issue_categories` table). **Either `category_id` OR `category_name` can be provided, but not both.**
- `priority` (string): One of: `low`, `medium`, `high`, `critical` (default: `medium`)
- `labels` (array of strings): Array of label strings, max 50 chars each
- `guest_name` (string, max 255): Required only if not authenticated
- `guest_email` (email, max 255): Required only if not authenticated

### Example Request (Authenticated with Admin Token - Using category_id)
```json
{
  "title": "How to fix database connection timeout?",
  "description": "I'm experiencing database connection timeouts in my Laravel application. The connection works fine initially but after a few minutes, queries start timing out. I've checked my database configuration and connection pool settings, but the issue persists.",
  "category_id": 1,
  "priority": "high",
  "labels": ["database", "laravel", "timeout"]
}
```

### Example Request (Authenticated with Admin Token - Using category_name)
```json
{
  "title": "How to fix database connection timeout?",
  "description": "I'm experiencing database connection timeouts in my Laravel application. The connection works fine initially but after a few minutes, queries start timing out. I've checked my database configuration and connection pool settings, but the issue persists.",
  "category_name": "Database Questions",
  "priority": "high",
  "labels": ["database", "laravel", "timeout"]
}
```

### Example Request (Unauthenticated - Guest)
```json
{
  "title": "How to fix database connection timeout?",
  "description": "I'm experiencing database connection timeouts...",
  "category_name": "Database Questions",
  "priority": "high",
  "labels": ["database", "laravel"],
  "guest_name": "John Doe",
  "guest_email": "john@example.com"
}
```

## Response

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": 123,
    "title": "How to fix database connection timeout?",
    "description": "I'm experiencing database connection timeouts...",
    "slug": "how-to-fix-database-connection-timeout",
    "status": "open",
    "priority": "high",
    "category_id": 1,
    "user_id": 1,
    "guest_name": null,
    "guest_email": null,
    "labels": ["database", "laravel", "timeout"],
    "upvotes_count": 0,
    "comments_count": 0,
    "is_pinned": false,
    "created_at": "2025-01-15T10:30:00.000000Z",
    "updated_at": "2025-01-15T10:30:00.000000Z",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "category": {
      "id": 1,
      "name": "Database",
      "slug": "database"
    }
  }
}
```

### Error Responses

#### Validation Error (422 Unprocessable Entity)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required."],
    "description": ["The description must be at least 10 characters."]
  }
}
```

#### Rate Limit Exceeded (429 Too Many Requests)
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please wait before creating another issue."
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Failed to create issue"
}
```

## cURL Examples

### Using Admin API Token (with category_name)
```bash
curl -X POST https://naqashthaheem.com/api/issues \
  -H "Authorization: Bearer YOUR_API_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to fix database connection timeout?",
    "description": "I am experiencing database connection timeouts in my Laravel application. The connection works fine initially but after a few minutes, queries start timing out.",
    "category_name": "Database Questions",
    "priority": "high",
    "labels": ["database", "laravel", "timeout"]
  }'
```

### Using Admin API Token (with category_id)
```bash
curl -X POST https://naqashthaheem.com/api/issues \
  -H "Authorization: Bearer YOUR_API_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to fix database connection timeout?",
    "description": "I am experiencing database connection timeouts in my Laravel application. The connection works fine initially but after a few minutes, queries start timing out.",
    "category_id": 1,
    "priority": "high",
    "labels": ["database", "laravel", "timeout"]
  }'
```

### Using JWT Token
```bash
curl -X POST https://naqashthaheem.com/api/issues \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to fix database connection timeout?",
    "description": "I am experiencing database connection timeouts...",
    "category_id": 1,
    "priority": "high"
  }'
```

### Without Authentication (Guest)
```bash
curl -X POST https://naqashthaheem.com/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to fix database connection timeout?",
    "description": "I am experiencing database connection timeouts...",
    "category_name": "Database Questions",
    "priority": "high",
    "guest_name": "John Doe",
    "guest_email": "john@example.com"
  }'
```

## JavaScript/Fetch Example

```javascript
const createIssue = async (apiToken, issueData) => {
  try {
    const response = await fetch('https://naqashthaheem.com/api/issues', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(issueData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Issue created:', result.data);
      return result.data;
    } else {
      console.error('Error creating issue:', result);
      throw new Error(result.message || 'Failed to create issue');
    }
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Usage (with category_name)
const issueData = {
  title: "How to fix database connection timeout?",
  description: "I am experiencing database connection timeouts...",
  category_name: "Database Questions",
  priority: "high",
  labels: ["database", "laravel"]
};

createIssue('YOUR_API_TOKEN_HERE', issueData);

// Usage (with category_id - also supported)
const issueDataWithId = {
  title: "How to fix database connection timeout?",
  description: "I am experiencing database connection timeouts...",
  category_id: 1,
  priority: "high",
  labels: ["database", "laravel"]
};

createIssue('YOUR_API_TOKEN_HERE', issueDataWithId);
```

## Python Example

```python
import requests

def create_issue(api_token, issue_data):
    url = "https://naqashthaheem.com/api/issues"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=issue_data, headers=headers)
    
    if response.status_code == 201:
        return response.json()["data"]
    else:
        raise Exception(f"Error: {response.json()}")

# Usage (with category_name)
issue_data = {
    "title": "How to fix database connection timeout?",
    "description": "I am experiencing database connection timeouts...",
    "category_name": "Database Questions",
    "priority": "high",
    "labels": ["database", "laravel"]
}

issue = create_issue("YOUR_API_TOKEN_HERE", issue_data)
print(f"Issue created: {issue['id']}")

# Usage (with category_id - also supported)
issue_data_with_id = {
    "title": "How to fix database connection timeout?",
    "description": "I am experiencing database connection timeouts...",
    "category_id": 1,
    "priority": "high",
    "labels": ["database", "laravel"]
}

issue = create_issue("YOUR_API_TOKEN_HERE", issue_data_with_id)
print(f"Issue created: {issue['id']}")
```

## Rate Limiting
- Maximum 5 issues per hour per IP address
- If rate limit is exceeded, you'll receive a 429 status code

## Notes
- If authenticated, the issue will be associated with your user account
- If not authenticated, you must provide `guest_name` and `guest_email`
- The issue will automatically be set to `status: "open"`
- An email notification will be sent to the creator (if email service is configured)
- The issue will be accessible at: `https://naqashthaheem.com/community/issues/{slug}`

## Getting Available Categories
To get a list of available categories (for `category_id` or `category_name`):
```
GET https://naqashthaheem.com/api/issue-categories
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Database Questions",
      "slug": "database-questions",
      "description": "Database design, queries, optimization, and database-related issues",
      "is_active": true
    },
    ...
  ]
}
```

**Note:** You can use either:
- `category_id`: The numeric ID from the response (e.g., `1`)
- `category_name`: The exact name from the response (e.g., `"Database Questions"`)

Both methods work identically. Use `category_name` if you don't want to look up the ID first.

---

# Issue Comments API

## Add Comment to Issue

**Endpoint:** `POST https://naqashthaheem.com/api/comments`

**Authentication:** Optional (but recommended with admin token)

### Request Body

**Required Fields:**
- `commentable_type` (string): Must be `"Issue"`
- `commentable_id` (integer): The ID of the issue
- `content` (string, 3-5000 characters): Comment content

**Optional Fields:**
- `parent_id` (integer): ID of parent comment (for replies/nested comments)
- `guest_name` (string, max 255): Required only if not authenticated
- `guest_email` (email, max 255): Required only if not authenticated

### Example Request (Authenticated with Admin Token)
```json
{
  "commentable_type": "Issue",
  "commentable_id": 123,
  "content": "This issue can be resolved by checking the database connection pool settings. Make sure your connection timeout is set correctly in the .env file."
}
```

### Example Request (Reply to Comment)
```json
{
  "commentable_type": "Issue",
  "commentable_id": 123,
  "parent_id": 456,
  "content": "Thanks for the suggestion! I'll try that."
}
```

### Example Request (Unauthenticated - Guest)
```json
{
  "commentable_type": "Issue",
  "commentable_id": 123,
  "content": "I'm experiencing the same issue.",
  "guest_name": "John Doe",
  "guest_email": "john@example.com"
}
```

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Comment posted successfully",
  "data": {
    "id": 789,
    "commentable_type": "Issue",
    "commentable_id": 123,
    "parent_id": null,
    "content": "This issue can be resolved by...",
    "user_id": 1,
    "guest_name": null,
    "guest_email": null,
    "is_approved": true,
    "likes_count": 0,
    "replies_count": 0,
    "created_at": "2025-01-15T10:30:00.000000Z",
    "updated_at": "2025-01-15T10:30:00.000000Z",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

### cURL Example
```bash
curl -X POST https://naqashthaheem.com/api/comments \
  -H "Authorization: Bearer YOUR_API_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "commentable_type": "Issue",
    "commentable_id": 123,
    "content": "This issue can be resolved by checking the database connection pool settings."
  }'
```

### Get Comments for an Issue
**Endpoint:** `GET https://naqashthaheem.com/api/comments?commentable_type=Issue&commentable_id=123`

**Query Parameters:**
- `commentable_type` (required): `"Issue"`
- `commentable_id` (required): Issue ID
- `parent_id` (optional): Get replies to a specific comment
- `approved_only` (optional): `true` or `false` (default: `true`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "content": "This issue can be resolved by...",
      "user": {
        "id": 1,
        "name": "Admin User"
      },
      "likes_count": 5,
      "replies_count": 2,
      "is_liked": false,
      "created_at": "2025-01-15T10:30:00.000000Z"
    }
  ],
  "count": 1
}
```

---

# Issue Resolution API

There are two ways to mark an issue as resolved:

## 1. Admin Resolution (Recommended for Admin API)

**Endpoint:** `POST https://naqashthaheem.com/api/issues/{id}/status`

**Authentication:** Required (Admin API Token)

**Note:** This endpoint requires admin authentication and allows you to set any status with resolution notes.

### Request Body

**Required Fields:**
- `status` (string): One of: `open`, `in_progress`, `resolved`, `closed`, `duplicate`

**Optional Fields:**
- `resolution_notes` (string, max 2000): Detailed resolution notes (recommended when status is `resolved`)

### Example Request
```json
{
  "status": "resolved",
  "resolution_notes": "The issue was caused by incorrect database connection pool settings. Updated the max_connections parameter in the .env file from 10 to 50. Also increased the connection timeout from 30s to 60s. The issue should now be resolved."
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Issue status updated successfully",
  "data": {
    "id": 123,
    "title": "How to fix database connection timeout?",
    "status": "resolved",
    "resolved_at": "2025-01-15T11:00:00.000000Z",
    "resolved_by": 1,
    "resolution_notes": "The issue was caused by incorrect database connection pool settings...",
    "resolver": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

### cURL Example
```bash
curl -X POST https://naqashthaheem.com/api/issues/123/status \
  -H "Authorization: Bearer YOUR_ADMIN_API_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "resolution_notes": "The issue was caused by incorrect database connection pool settings. Updated the max_connections parameter in the .env file from 10 to 50."
  }'
```

### JavaScript Example
```javascript
const resolveIssue = async (apiToken, issueId, resolutionNotes) => {
  try {
    const response = await fetch(`https://naqashthaheem.com/api/issues/${issueId}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'resolved',
        resolution_notes: resolutionNotes
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Issue resolved:', result.data);
      return result.data;
    } else {
      console.error('Error resolving issue:', result);
      throw new Error(result.message || 'Failed to resolve issue');
    }
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Usage
resolveIssue('YOUR_ADMIN_API_TOKEN_HERE', 123, 'The issue was resolved by updating database connection settings.');
```

## 2. Creator Resolution (For Issue Creator)

**Endpoint:** `POST https://naqashthaheem.com/api/issues/{id}/mark-solved`

**Authentication:** Optional (but requires ownership verification)

**Note:** This endpoint is for the issue creator to mark their own issue as solved. It requires ownership verification.

### Request Body

**Required Fields:**
- `solution` (string, 10-2000 characters): Solution description

**Optional Fields:**
- `guest_email` (email): Required if issue was created by a guest user (for ownership verification)

### Example Request (Authenticated User)
```json
{
  "solution": "I found the solution! The issue was caused by incorrect database connection pool settings. I updated the max_connections parameter in the .env file from 10 to 50, and the problem was resolved."
}
```

### Example Request (Guest User)
```json
{
  "solution": "I found the solution! The issue was caused by...",
  "guest_email": "john@example.com"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Issue marked as solved successfully",
  "data": {
    "id": 123,
    "title": "How to fix database connection timeout?",
    "status": "resolved",
    "resolved_at": "2025-01-15T11:00:00.000000Z",
    "resolved_by": 1,
    "resolution_notes": "I found the solution! The issue was caused by..."
  }
}
```

### cURL Example (Authenticated)
```bash
curl -X POST https://naqashthaheem.com/api/issues/123/mark-solved \
  -H "Authorization: Bearer YOUR_API_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "I found the solution! The issue was caused by incorrect database connection pool settings."
  }'
```

---

## Complete Workflow Example

Here's a complete example of creating an issue, adding a resolution comment, and marking it as resolved:

### Step 1: Create Issue
```bash
curl -X POST https://naqashthaheem.com/api/issues \
  -H "Authorization: Bearer YOUR_ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database connection timeout issue",
    "description": "Experiencing connection timeouts after a few minutes.",
    "category_name": "Database Questions",
    "priority": "high"
  }'
```

### Step 2: Add Resolution Comment
```bash
curl -X POST https://naqashthaheem.com/api/comments \
  -H "Authorization: Bearer YOUR_ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commentable_type": "Issue",
    "commentable_id": 123,
    "content": "Solution: Update database connection pool settings. Set max_connections to 50 and increase timeout to 60s."
  }'
```

### Step 3: Mark Issue as Resolved
```bash
curl -X POST https://naqashthaheem.com/api/issues/123/status \
  -H "Authorization: Bearer YOUR_ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "resolution_notes": "Resolved by updating database connection pool settings. The max_connections parameter was increased from 10 to 50, and the connection timeout was increased from 30s to 60s. This should prevent connection timeouts."
  }'
```

---

## Error Responses

### Authentication Error (401)
```json
{
  "message": "Token not provided.",
  "error": "Authentication required"
}
```

### Permission Error (403)
```json
{
  "success": false,
  "message": "Only administrators can update issue status"
}
```

### Validation Error (422)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "status": ["The status field is required."],
    "resolution_notes": ["The resolution notes must not be greater than 2000 characters."]
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Issue not found"
}
```

---

## Notes

- **Admin Resolution** (`POST /api/issues/{id}/status`): 
  - Requires admin authentication
  - Can set any status (`open`, `in_progress`, `resolved`, `closed`, `duplicate`)
  - Automatically sets `resolved_at` and `resolved_by` when status is `resolved`
  - Recommended for admin API usage

- **Creator Resolution** (`POST /api/issues/{id}/mark-solved`):
  - Only the issue creator can use this
  - Requires ownership verification (user ID or guest email)
  - Always sets status to `resolved`
  - Good for self-service resolution

- **Comments**:
  - Can be added by anyone (authenticated or guest)
  - Authenticated users' comments are auto-approved
  - Guest comments require approval
  - Supports nested replies via `parent_id`
  - Rate limit: 10 comments per hour per IP

- **Email Notifications**:
  - Comments trigger email notifications to issue creator and parent comment authors
  - Status changes trigger email notifications to issue creator

