# Push Notification Testing Guide

## Why Test Notification Returns 0 Subscribers

If you see `"total_sent": 0` when testing notifications, it means **no active subscriptions were found**. This is normal if:

1. **No users have subscribed yet** - Users need to enable notifications first
2. **Current user hasn't subscribed** - Test notification only sends to current user by default
3. **Subscriptions are inactive** - Subscriptions may have been deactivated

## How to Test Notifications

### Step 1: Subscribe to Notifications (As a User)

1. **Login to the website**
2. **Open Notification Settings** (click your profile → Notification Settings)
3. **Click "Enable Notifications"**
4. **Grant browser permission** when prompted
5. **Verify subscription** - You should see "Notifications enabled"

### Step 2: Check Subscription Status (Admin)

```bash
# Get statistics with debug info
curl -X GET https://naqashthaheem.com/api/admin/push-notifications/stats \
  -H "Authorization: Bearer {admin_token}"
```

**Response includes:**
- `total_subscribers` - Total subscriptions in database
- `active_subscribers` - Active subscriptions
- `notification_types` - Count by type (blogPosts, issues, workflows, careerTools)
- `debug` - Detailed debugging information:
  - Current user subscription status
  - List of recent subscriptions
  - User preferences

### Step 3: Send Test Notification

#### Option A: Test to Current User Only (Default)
```bash
curl -X POST https://naqashthaheem.com/api/admin/push-notifications/test \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

**If returns 0 subscribers:**
- Check `debug.has_subscription` in response
- If `false`, you need to subscribe first (see Step 1)

#### Option B: Test to All Subscribers
```bash
curl -X POST https://naqashthaheem.com/api/admin/push-notifications/test \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"send_to_all": true}'
```

This sends to **all active subscribers**, not just the current user.

### Step 4: Send Custom Notification (Admin Panel)

1. Go to **Admin Dashboard → Push Notifications**
2. Fill in the form:
   - **Title**: Test Notification
   - **Body**: This is a test message
   - **Type**: Select "All Subscribers" or specific type
   - **URL**: Optional link (e.g., `/community/issues`)
3. Click **"Send Notification"**

## Troubleshooting

### Issue: "total_sent": 0

**Possible Causes:**
1. **No subscriptions exist**
   - Solution: Have users subscribe to notifications first
   - Check: `GET /api/admin/push-notifications/stats` → `total_subscribers`

2. **Current user hasn't subscribed**
   - Solution: Subscribe as the current user
   - Or: Use `send_to_all: true` to test with all subscribers

3. **Subscriptions are inactive**
   - Check: `is_active = true` in database
   - Solution: Reactivate subscriptions or have users re-subscribe

### Issue: Notifications not received

**Checklist:**
1. ✅ User has subscribed (check database)
2. ✅ Browser permission granted (check browser settings)
3. ✅ Service worker registered (DevTools → Application → Service Workers)
4. ✅ VAPID keys configured (check environment variables)
5. ✅ HTTPS enabled (required for push notifications)
6. ✅ User preferences include the notification type

### Issue: "VAPID keys are not configured"

**Solution:**
1. Verify VAPID keys in GitHub Secrets:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
2. Check backend `.env` has these keys
3. Check frontend build has `VITE_VAPID_PUBLIC_KEY`
4. Clear config cache: `php artisan config:clear && php artisan config:cache`

## Database Queries for Debugging

### Check Subscriptions
```sql
-- All subscriptions
SELECT id, user_id, is_active, preferences, created_at 
FROM push_subscriptions 
ORDER BY created_at DESC;

-- Active subscriptions
SELECT COUNT(*) FROM push_subscriptions WHERE is_active = true;

-- Subscriptions by notification type
SELECT 
  COUNT(*) FILTER (WHERE preferences->>'issues' = 'true') as issues_count,
  COUNT(*) FILTER (WHERE preferences->>'blogPosts' = 'true') as blog_posts_count,
  COUNT(*) FILTER (WHERE preferences->>'workflows' = 'true') as workflows_count
FROM push_subscriptions 
WHERE is_active = true;
```

### Check User Subscription
```sql
-- Check specific user's subscription
SELECT * FROM push_subscriptions 
WHERE user_id = {user_id} AND is_active = true;
```

## Testing Workflow

### Complete Test Flow:

1. **As Regular User:**
   ```
   - Login
   - Enable notifications in settings
   - Verify subscription created in database
   ```

2. **As Admin:**
   ```
   - Check stats: GET /api/admin/push-notifications/stats
   - Verify total_subscribers > 0
   - Send test: POST /api/admin/push-notifications/test (with send_to_all: true)
   - Verify notification received
   ```

3. **Test Real Notification:**
   ```
   - Create new issue (or blog post, workflow)
   - Verify event fired
   - Check logs for notification sent
   - Verify users receive notification
   ```

## Expected Behavior

### When Working Correctly:

1. **User Subscribes:**
   - Subscription created in database
   - `is_active = true`
   - Preferences set (e.g., `{"issues": true, "blogPosts": true}`)

2. **Test Notification Sent:**
   ```json
   {
     "message": "Test notification sent successfully",
     "result": {
       "success_count": 1,
       "failure_count": 0,
       "total_sent": 1
     }
   }
   ```

3. **User Receives Notification:**
   - Browser shows notification
   - Clicking opens the URL
   - Notification appears in system tray

### When Not Working:

1. **No Subscriptions:**
   ```json
   {
     "result": {
       "success_count": 0,
       "failure_count": 0,
       "total_sent": 0
     },
     "debug": {
       "has_subscription": false,
       "hint": "Please subscribe to notifications first..."
     }
   }
   ```

2. **Check Debug Info:**
   - Look at `debug` object in response
   - Check `total_active_subscriptions`
   - Verify user has subscription

## Quick Test Commands

```bash
# 1. Check if you're subscribed
curl -X GET https://naqashthaheem.com/api/push/status \
  -H "Authorization: Bearer {your_token}"

# 2. Check statistics
curl -X GET https://naqashthaheem.com/api/admin/push-notifications/stats \
  -H "Authorization: Bearer {admin_token}"

# 3. Test to current user
curl -X POST https://naqashthaheem.com/api/admin/push-notifications/test \
  -H "Authorization: Bearer {admin_token}"

# 4. Test to all subscribers
curl -X POST https://naqashthaheem.com/api/admin/push-notifications/test \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"send_to_all": true}'
```

## Next Steps

If you're still getting 0 subscribers:

1. **Verify users have subscribed:**
   - Check database: `SELECT * FROM push_subscriptions WHERE is_active = true;`
   - If empty, users need to enable notifications

2. **Test with send_to_all:**
   - Use `{"send_to_all": true}` parameter
   - This tests the system even if current user hasn't subscribed

3. **Check browser console:**
   - Open DevTools → Console
   - Look for subscription errors
   - Check service worker registration

4. **Verify VAPID keys:**
   - Check GitHub Secrets are set
   - Verify keys are injected during deployment
   - Test with: `php artisan tinker` → `config('push.vapid.public_key')`

