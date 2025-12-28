# Push Notifications System - Complete Guide

## Overview

The push notification system allows users to receive real-time browser notifications when new content is created (blog posts, issues, workflows, career tools). Notifications are sent via Web Push API using VAPID keys.

## System Architecture

### 1. Frontend Subscription Flow

#### Step 1: User Enables Notifications
- User clicks "Enable Notifications" in Notification Settings
- Browser requests notification permission
- If granted, frontend creates push subscription

#### Step 2: Subscription Creation
```typescript
// Location: frontend/src/hooks/useNotifications.ts
1. Check if browser supports notifications
2. Request notification permission
3. Get service worker registration
4. Subscribe to push service using VAPID public key
5. Send subscription to backend API
```

#### Step 3: Backend Storage
- Subscription stored in `push_subscriptions` table
- Includes: endpoint, keys (p256dh, auth), user preferences
- Preferences stored as JSON: `{blogPosts: true, issues: true, workflows: true, careerTools: true}`

### 2. Backend Notification Flow

#### Step 1: Content Creation Triggers Event
When new content is created:
```php
// Example: Issue creation
event(new \App\Events\NewIssue($issue));
```

#### Step 2: Event Listener Sends Notifications
```php
// Location: backend/app/Listeners/SendIssueNotification.php
1. Event listener receives NewIssue event
2. Calls PushNotificationService::sendToSubscribersByType('issues', ...)
3. Service queries database for subscribers with 'issues' preference enabled
4. Sends push notification to each subscriber
```

#### Step 3: Push Notification Service
```php
// Location: backend/app/Services/PushNotificationService.php
1. Query active subscriptions with matching notification type preference
2. For each subscription:
   - Create WebPush subscription object
   - Queue notification with title, body, URL, icon
   - Mark subscription as used
3. Flush all queued notifications
4. Return success/failure counts
```

### 3. Service Worker Handles Push

#### Step 1: Push Event Received
```javascript
// Location: frontend/public/sw.js
self.addEventListener('push', (event) => {
  // Parse push data
  // Show browser notification
  // Include action buttons (Open, Dismiss)
});
```

#### Step 2: User Clicks Notification
```javascript
self.addEventListener('notificationclick', (event) => {
  // Close notification
  // Open/focus window with notification URL
  // Navigate to content page
});
```

## Notification Types

### Currently Supported:
1. **Blog Posts** (`blogPosts`)
   - Triggered when: New blog post is published
   - Event: `NewBlogPost`
   - Listener: `SendBlogPostNotification`

2. **Issues** (`issues`) ✅ NEW
   - Triggered when: New issue is created
   - Event: `NewIssue`
   - Listener: `SendIssueNotification`

3. **Workflows** (`workflows`)
   - Triggered when: New workflow is published
   - Event: `NewWorkflow`
   - Listener: `SendWorkflowNotification`

4. **Career Tools** (`careerTools`)
   - Triggered when: Career tool is updated
   - Event: `CareerToolUpdate`
   - Listener: `SendCareerToolNotification`

## Configuration

### VAPID Keys (Required)
VAPID keys are stored in GitHub Secrets and injected during deployment:
- `VAPID_PUBLIC_KEY`: Public key for frontend subscription
- `VAPID_PRIVATE_KEY`: Private key for backend signing
- `VAPID_SUBJECT`: Email subject (e.g., `mailto:naqash263@gmail.com`)

### Environment Variables
**Frontend** (`frontend/.env`):
```
VITE_VAPID_PUBLIC_KEY=BP14D5v2po9EP7s3-FP29FlJhqiWmOhGSHwpduUx-GkBWaXpCpYuaX1fL5YxiPyXmu0B6Lnu5KOqG3LlQd9ZD74
```

**Backend** (`backend/.env`):
```
VAPID_PUBLIC_KEY=BP14D5v2po9EP7s3-FP29FlJhqiWmOhGSHwpduUx-GkBWaXpCpYuaX1fL5YxiPyXmu0B6Lnu5KOqG3LlQd9ZD74
VAPID_PRIVATE_KEY=J2xYDqkuqAn4ck68xyWnpn3LCfbdY4tltbzX6zTmEMw
VAPID_SUBJECT=mailto:naqash263@gmail.com
```

## Database Schema

### `push_subscriptions` Table
```sql
- id (bigint, primary key)
- user_id (bigint, foreign key → users.id, nullable)
- endpoint (string) - Push service endpoint URL
- p256dh (text) - Public encryption key
- auth (text) - Authentication secret
- preferences (json) - Notification type preferences
  Example: {"blogPosts": true, "issues": true, "workflows": true, "careerTools": true}
- is_active (boolean, default: true)
- last_used_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

## API Endpoints

### Subscribe to Push Notifications
```
POST /api/push/subscribe
Headers: Authorization: Bearer {token}
Body: {
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "preferences": {
    "blogPosts": true,
    "issues": true,
    "workflows": true,
    "careerTools": true
  }
}
```

### Unsubscribe from Push Notifications
```
POST /api/push/unsubscribe
Headers: Authorization: Bearer {token}
```

### Update Notification Preferences
```
PUT /api/push/preferences
Headers: Authorization: Bearer {token}
Body: {
  "preferences": {
    "blogPosts": true,
    "issues": false,
    "workflows": true,
    "careerTools": false
  }
}
```

### Get Statistics (Admin Only)
```
GET /api/admin/push-notifications/stats
Headers: Authorization: Bearer {admin_token}
Response: {
  "total_subscribers": 150,
  "active_subscribers": 120,
  "notification_types": {
    "blogPosts": 120,
    "issues": 80,
    "workflows": 100,
    "careerTools": 90
  }
}
```

### Send Test Notification (Admin Only)
```
POST /api/admin/push-notifications/send
Headers: Authorization: Bearer {admin_token}
Body: {
  "title": "Test Notification",
  "body": "This is a test",
  "url": "/",
  "type": "all" | "blogPosts" | "issues" | "workflows" | "careerTools",
  "imageUrl": "https://..."
}
```

## How It Works - Step by Step

### Example: New Issue Created

1. **User Creates Issue**
   - POST `/api/issues` → `IssueController::store()`
   - Issue saved to database

2. **Event Dispatched**
   ```php
   event(new \App\Events\NewIssue($issue));
   ```

3. **Listener Triggered**
   - `SendIssueNotification::handle()` is called
   - Prepares notification: title, body, URL
   - Calls `PushNotificationService::sendToSubscribersByType('issues', ...)`

4. **Service Queries Subscribers**
   ```php
   PushSubscription::where('is_active', true)
     ->whereJsonContains('preferences->issues', true)
     ->get();
   ```

5. **Notifications Queued**
   - For each subscriber, notification is queued
   - Uses WebPush library with VAPID keys
   - Notification payload includes title, body, URL, icon

6. **Notifications Sent**
   - WebPush library sends to browser push service
   - Browser push service delivers to user's device

7. **Service Worker Receives Push**
   - `push` event fired in service worker
   - Notification displayed to user
   - User can click to open issue page

## Testing Notifications

### 1. Test User Subscription
```bash
# Check if user is subscribed
curl -X GET https://naqashthaheem.com/api/push/subscription \
  -H "Authorization: Bearer {token}"
```

### 2. Test Notification Sending (Admin)
```bash
# Send test notification
curl -X POST https://naqashthaheem.com/api/admin/push-notifications/send \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "Testing push notifications",
    "url": "/",
    "type": "all"
  }'
```

### 3. Check Statistics
```bash
curl -X GET https://naqashthaheem.com/api/admin/push-notifications/stats \
  -H "Authorization: Bearer {admin_token}"
```

## Troubleshooting

### Notifications Not Working?

1. **Check VAPID Keys**
   ```bash
   # Backend
   php artisan tinker
   config('push.vapid.public_key')
   config('push.vapid.private_key')
   
   # Frontend
   console.log(import.meta.env.VITE_VAPID_PUBLIC_KEY)
   ```

2. **Check Service Worker**
   - Open DevTools → Application → Service Workers
   - Verify service worker is registered and active
   - Check for errors in console

3. **Check Browser Permissions**
   - Settings → Site Settings → Notifications
   - Verify permission is "Allow"

4. **Check Database**
   ```sql
   SELECT * FROM push_subscriptions WHERE is_active = true;
   SELECT preferences FROM push_subscriptions WHERE user_id = {user_id};
   ```

5. **Check Logs**
   ```bash
   # Backend logs
   tail -f storage/logs/laravel.log | grep -i "notification\|push"
   ```

### Common Issues

**Issue**: "VAPID keys are not configured"
- **Solution**: Verify VAPID keys are set in GitHub Secrets and injected during deployment

**Issue**: "Notifications not received"
- **Solution**: 
  - Check user has subscribed (check database)
  - Check preferences include the notification type
  - Check service worker is active
  - Check browser notification permission

**Issue**: "Subscription fails"
- **Solution**:
  - Verify HTTPS (required for push notifications)
  - Check VAPID public key format
  - Verify service worker is registered

## Security Considerations

1. **VAPID Keys**: Stored securely in GitHub Secrets
2. **User Authentication**: Required for subscription endpoints
3. **Admin Only**: Statistics and sending require admin role
4. **HTTPS Required**: Push notifications only work over HTTPS
5. **User Preferences**: Users control which notification types they receive

## Future Enhancements

- [ ] Notification scheduling
- [ ] Rich notifications with images
- [ ] Notification grouping
- [ ] Notification actions (Reply, Like, etc.)
- [ ] Notification history
- [ ] Notification analytics

