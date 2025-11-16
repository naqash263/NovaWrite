# AdSense Settings Fix - Active Settings Issue

## Problem
Ads were not showing even though settings were configured because:
1. Settings were not being marked as `is_active = true` when saved
2. Frontend cache wasn't being invalidated after saving
3. The `getActive()` API endpoint only returns settings with `is_active = true`

## Fixes Applied

### 1. Cache Invalidation ✅
- Added `queryClient.invalidateQueries({ queryKey: ['adsense-settings-active'] })` to all mutation success handlers
- This ensures the frontend refreshes settings immediately after saving

### 2. Auto-Activate Settings with Values ✅
- Updated `handleSave()` to automatically mark settings as active if they have values
- Exception: The `enabled` setting is controlled separately (via toggle)

### 3. Debug Logging ✅
- Added console logging in `AdPlacement` component to help diagnose issues
- Logs show: `isEnabled`, `isLoading`, `adSlot`, `clientId`, and full `settings` object

## What You Need to Do

### Step 1: Re-save Your Settings
1. Go to Admin → AdSense Settings
2. Verify your settings:
   - **Publisher ID**: `ca-pub-7546164915439451` ✅
   - **Header Ad Slot**: `1378859993` ✅
   - **Enable AdSense**: Toggle should be ON ✅
3. Click **"Save Settings"** button
   - This will now automatically mark settings with values as active

### Step 2: Verify Settings Are Active
After saving, check the browser console (F12) for debug logs:
```
[AdPlacement:content-top] {
  isEnabled: true,
  isLoading: false,
  adSlot: "1378859993",
  clientId: "ca-pub-7546164915439451",
  hasClientId: true,
  settings: { ... }
}
```

### Step 3: Check API Response
Test the API endpoint:
```bash
curl https://naqashthaheem.com/api/adsense-settings/active
```

Expected response:
```json
{
  "success": true,
  "data": {
    "client_id": "ca-pub-7546164915439451",
    "slot_header": "1378859993",
    "enabled": "true",
    ...
  }
}
```

### Step 4: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear cache in browser settings

## Troubleshooting

### If ads still don't show:

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for `[AdPlacement:...]` logs
   - Check for any errors

2. **Verify Settings in Database**
   - Settings must have `is_active = true` AND a `value`
   - The `enabled` setting must have `value = 'true'`

3. **Check AdSense Account**
   - Ensure your AdSense account is approved
   - Verify the Publisher ID is correct
   - Check if ad units are active in AdSense dashboard

4. **Production vs Development**
   - Ads only show in production (`import.meta.env.PROD`)
   - Check if you're testing on production URL

5. **AdSense Approval**
   - New sites can take 24-48 hours for approval
   - Ads won't show until Google approves your site

## Files Changed

1. `frontend/src/pages/admin/AdSenseSettings.tsx`
   - Added cache invalidation for `adsense-settings-active`
   - Auto-activate settings with values on save

2. `frontend/src/components/AdPlacement.tsx`
   - Added debug logging
   - Better error visibility

## Next Steps

After deploying these changes:
1. Re-save your AdSense settings in the admin panel
2. Wait 2-3 minutes for deployment
3. Clear browser cache
4. Check browser console for debug logs
5. Verify ads appear on pages

---

**Last Updated**: November 3, 2025

