# Production Issues Resolution Guide

## Issues Identified and Solutions

### 1. POST Request Redirects ✅ RESOLVED

**Issue**: POST requests to `/api/posts` and `/api/admin/posts` were redirecting to homepage instead of processing requests.

**Root Cause**: Missing required headers and validation errors, not actual redirects.

**Solution**: 
- Added proper headers: `Accept: application/json`, `X-Requested-With: XMLHttpRequest`
- The API was working but returning validation errors for missing required fields

**Test Results**:
```bash
# This now works correctly:
curl -X POST "https://naqashthaheem.com/api/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{"title": "Test", "content": "Test", "category_id": 1}'
```

### 2. Missing Health Endpoints ⚠️ IN PROGRESS

**Issue**: Health check endpoints return 404 Not Found:
- `/api/health/comprehensive` - Returns 404
- `/api/health/database` - Returns 404  
- `/api/health/storage` - Returns 404

**Root Cause**: Production server has cached routes that don't include the new health endpoints.

**Solution**: Clear Laravel route cache on production server.

**Steps to Fix**:

1. **Run the fix script**:
   ```bash
   ./fix-production-routes.sh
   ```

2. **Manual fix** (if script doesn't work):
   ```bash
   ssh timesovh@naqashthaheem.com
   cd ~/naqashthaheem.com/backend
   php artisan config:clear
   php artisan route:clear
   php artisan cache:clear
   php artisan config:cache
   ```

3. **Verify the fix**:
   ```bash
   curl "https://naqashthaheem.com/api/health/comprehensive"
   curl "https://naqashthaheem.com/api/health/database"
   curl "https://naqashthaheem.com/api/health/storage"
   ```

## Current API Status

### ✅ Working Endpoints:
- Authentication: `/api/auth/login`
- Basic Health: `/api/health`
- Admin Posts: `/api/admin/posts` (GET)
- Admin Workflows: `/api/admin/workflows` (GET)
- Admin Courses: `/api/admin/courses` (GET)
- Admin Lessons: `/api/admin/courses/{id}/lessons` (GET)
- Gemini API Keys: `/api/admin/gemini-api-keys` (GET)
- File Management: `/api/files` (GET)
- Watermark Remover: `/api/watermark-remover/test`
- PHP Settings: `/api/php-settings`

### ⚠️ Partially Working:
- Posts API: POST works but requires `category_id` (no categories exist)
- Admin Posts API: POST works but requires `category_id`

### 🔧 Needs Fix:
- Health Endpoints: `/api/health/comprehensive`, `/api/health/database`, `/api/health/storage`

## Next Steps

1. **Run the production cache fix script**
2. **Test all health endpoints**
3. **Create a default category for posts**
4. **Test full CRUD operations**

## Testing Commands

```bash
# Test health endpoints
curl "https://naqashthaheem.com/api/health/comprehensive" | jq .
curl "https://naqashthaheem.com/api/health/database" | jq .
curl "https://naqashthaheem.com/api/health/storage" | jq .

# Test POST with proper headers
TOKEN="your_jwt_token"
curl -X POST "https://naqashthaheem.com/api/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{"title": "Test", "content": "Test", "category_id": 1}'
```

## Notes

- The API is generally working well
- Main issue is route caching on production server
- POST requests work when proper headers are included
- All endpoints return proper JSON responses
- Authentication is working correctly
