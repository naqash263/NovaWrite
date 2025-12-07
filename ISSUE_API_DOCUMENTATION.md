# Issue API Documentation

## Authentication Status

**Both GET and POST endpoints work WITHOUT authentication tokens** - they are public endpoints that support both authenticated users and guests.

---

## GET API - List Issues

### Endpoint
```
GET /api/issues
```

### Authentication
- **No token required** - Public endpoint
- Works with or without authentication
- If authenticated, can filter by `my_issues=true`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search in title and description |
| `status` | string | No | Filter by status: `open`, `in_progress`, `resolved`, `closed`, `duplicate` |
| `priority` | string | No | Filter by priority: `low`, `medium`, `high`, `critical` |
| `category_id` | integer | No | Filter by category ID |
| `assigned_to` | integer | No | Filter by assigned user ID |
| `label` | string | No | Filter by label name |
| `pinned` | boolean | No | Filter pinned issues (`true`/`false`) |
| `my_issues` | boolean | No | Show only user's issues (requires authentication) |
| `sort_by` | string | No | Sort by: `created_at`, `updated_at`, `upvotes_count`, `comments_count`, `priority` |
| `sort_order` | string | No | Sort order: `asc` or `desc` (default: `desc`) |
| `page` | integer | No | Page number (default: 1) |
| `per_page` | integer | No | Items per page (default: 15, max: 50) |

### Example Request (No Token)
```bash
curl -X GET "https://naqashthaheem.com/api/issues?status=open&priority=high&sort_by=upvotes_count&per_page=20"
```

### Example Request (With Token - Optional)
```bash
curl -X GET "https://naqashthaheem.com/api/issues?my_issues=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Bug in login form",
      "slug": "bug-in-login-form",
      "description": "The login form is not working properly...",
      "status": "open",
      "priority": "high",
      "upvotes_count": 5,
      "comments_count": 3,
      "views_count": 12,
      "is_upvoted": false,
      "is_pinned": false,
      "created_at": "2025-12-02T10:00:00.000000Z",
      "user": {
        "id": 1,
        "name": "John Doe"
      },
      "category": {
        "id": 1,
        "name": "Bug",
        "color": "#EF4444"
      },
      "labels": ["bug", "critical"]
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 72
  }
}
```

---

## GET API - Get Single Issue

### Endpoint
```
GET /api/issues/{id}
```
or
```
GET /api/issues/{slug}
```

### Authentication
- **No token required** - Public endpoint

### Example Request
```bash
curl -X GET "https://naqashthaheem.com/api/issues/1"
# or
curl -X GET "https://naqashthaheem.com/api/issues/bug-in-login-form"
```

### Example Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Bug in login form",
    "slug": "bug-in-login-form",
    "description": "Full issue description...",
    "status": "open",
    "priority": "high",
    "upvotes_count": 5,
    "comments_count": 3,
    "views_count": 12,
    "is_upvoted": false,
    "is_pinned": false,
    "labels": ["bug", "critical"],
    "created_at": "2025-12-02T10:00:00.000000Z",
    "updated_at": "2025-12-02T10:00:00.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe"
    },
    "category": {
      "id": 1,
      "name": "Bug",
      "color": "#EF4444"
    },
    "assignee": null,
    "resolver": null
  }
}
```

---

## POST API - Create Issue

### Endpoint
```
POST /api/issues
```

### Authentication
- **No token required** - Public endpoint
- Works with or without authentication
- **If not authenticated**: Must provide `guest_name` and `guest_email`
- **If authenticated**: Uses logged-in user automatically

### Request Body

#### For Authenticated Users (with token):
```json
{
  "title": "Feature Request: Add dark mode",
  "description": "It would be great to have a dark mode option...",
  "category_id": 2,
  "priority": "medium",
  "labels": ["feature", "ui"]
}
```

#### For Guest Users (without token):
```json
{
  "title": "Feature Request: Add dark mode",
  "description": "It would be great to have a dark mode option...",
  "guest_name": "Jane Doe",
  "guest_email": "jane@example.com",
  "category_id": 2,
  "priority": "medium",
  "labels": ["feature", "ui"]
}
```

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Issue title (min: 5, max: 255 characters) |
| `description` | string | Yes | Issue description (min: 10, max: 10000 characters) |
| `guest_name` | string | Conditional | Required if not authenticated |
| `guest_email` | string | Conditional | Required if not authenticated (must be valid email) |
| `category_id` | integer | No | Category ID |
| `priority` | string | No | Priority: `low`, `medium`, `high`, `critical` (default: `medium`) |
| `labels` | array | No | Array of label strings (max 50 chars each) |

### Example Request (Without Token - Guest)
```bash
curl -X POST "https://naqashthaheem.com/api/issues" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bug in login form",
    "description": "The login form is not working properly when I try to log in.",
    "guest_name": "John Doe",
    "guest_email": "john@example.com",
    "priority": "high",
    "labels": ["bug", "critical"]
  }'
```

### Example Request (With Token - Authenticated)
```bash
curl -X POST "https://naqashthaheem.com/api/issues" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Bug in login form",
    "description": "The login form is not working properly when I try to log in.",
    "priority": "high",
    "labels": ["bug", "critical"]
  }'
```

### Example Response
```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": 1,
    "title": "Bug in login form",
    "slug": "bug-in-login-form",
    "description": "The login form is not working properly...",
    "status": "open",
    "priority": "high",
    "user_id": 1,
    "guest_name": null,
    "guest_email": null,
    "created_at": "2025-12-02T10:00:00.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe"
    },
    "category": null
  }
}
```

---

## Authentication Methods

### 1. JWT Token (User Login)
- Get token by logging in: `POST /api/auth/login`
- Use in header: `Authorization: Bearer YOUR_JWT_TOKEN`
- Token expires (default: 60 minutes)

### 2. API Token (Admin Generated)
- Generated from admin panel: `/admin/api-tokens`
- Use in header: `Authorization: Bearer YOUR_API_TOKEN`
- Can have expiration date
- Supports permissions

### 3. No Token (Guest)
- Works for GET and POST endpoints
- For POST, must provide `guest_name` and `guest_email`

---

## Rate Limiting

- **POST /api/issues**: Max 5 issues per hour per IP address
- Applies to both authenticated and guest users

---

## Error Responses

### 422 Validation Error
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

### 429 Rate Limit Error
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please wait before creating another issue."
}
```

### 401 Authentication Error (for protected endpoints)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

---

## Summary

✅ **GET /api/issues** - Works WITHOUT token (public)  
✅ **GET /api/issues/{id}** - Works WITHOUT token (public)  
✅ **POST /api/issues** - Works WITHOUT token (public, supports guests)  
✅ **POST /api/issues/{id}/upvote** - Works WITHOUT token (public)  
✅ **POST /api/issues/{id}/mark-solved** - Works WITHOUT token (public, creator only)  

🔒 **PUT /api/issues/{id}** - Requires token (authenticated, owner only)  
🔒 **DELETE /api/issues/{id}** - Requires token (authenticated, admin only)  
🔒 **POST /api/issues/{id}/status** - Requires token (authenticated, admin only)  
🔒 **POST /api/issues/{id}/assign** - Requires token (authenticated, admin only)




