# 🔍 AdSense Troubleshooting Guide
## Why Ads Are Not Displaying & How to Fix

**Created:** November 3, 2025

---

## ✅ What We Fixed

### 1. Added AdPlacement Components to Pages
- ✅ **BlogPost page:** Added sidebar, content-top, content-middle, content-bottom ads
- ✅ **Blog listing page:** Added content-top, between-posts, content-bottom ads
- ✅ **Layout:** Ready for header/footer ads

### 2. Improved AdSense Component
- ✅ Added debug logging to track ad initialization
- ✅ Fixed script loading with proper error handling
- ✅ Improved ad initialization timing
- ✅ Added timeout protection

### 3. Enhanced Debugging
- ✅ Console logs show ad loading status
- ✅ Error messages are more descriptive
- ✅ Production vs development detection

---

## 🔍 Common Issues & Solutions

### Issue 1: Ads Not Showing at All

**Symptoms:**
- No ads visible on pages
- Console shows no AdSense errors

**Checklist:**
1. ✅ **AdSense Account Approved?**
   - Go to AdSense dashboard
   - Check account status
   - Must be "Active" not "Pending"

2. ✅ **Publisher ID Correct?**
   - Admin → AdSense Settings
   - Publisher ID format: `ca-pub-XXXXXXXXXX`
   - No extra spaces or characters

3. ✅ **Ad Units Created?**
   - Go to AdSense → Ads → Ad units
   - Create ad units for each position
   - Copy the ad unit IDs (not the Publisher ID)

4. ✅ **Settings Enabled?**
   - Admin → AdSense Settings
   - Toggle "Enable AdSense" to ON
   - Each ad slot must have a value AND be active

5. ✅ **Production Environment?**
   - Ads only show in production (not localhost)
   - Check: `https://naqashthaheem.com`
   - Not: `http://localhost:3000`

6. ✅ **Browser Console Check:**
   - Open browser DevTools (F12)
   - Check Console tab
   - Look for `[AdSense]` messages
   - Should see: "Script loaded successfully" and "Initializing ad"

---

### Issue 2: Ads Show "Empty" or Placeholder

**Symptoms:**
- Ad containers visible but empty
- Shows blank space where ads should be

**Solutions:**

1. **Wait for AdSense to Index**
   - New sites: 24-48 hours after approval
   - New ad units: 1-2 hours
   - Google needs to crawl and index your site

2. **Check Ad Unit Status**
   - AdSense → Ads → Ad units
   - Status should be "Active"
   - If "Needs attention" → fix issues

3. **Verify ads.txt**
   - Visit: `https://naqashthaheem.com/ads.txt`
   - Should show: `google.com, pub-XXXXXXXXXX, DIRECT, f08c47fec0942fa0`
   - Publisher ID must match your AdSense account

4. **Check Site Traffic**
   - AdSense needs real traffic
   - Test with real visitors (not just you)
   - Google may not serve ads to same IP repeatedly

---

### Issue 3: Console Errors

**Error: "adsbygoogle.push() error: No slot size for availableWidth=0"**

**Solution:**
- Ad container has no width
- Check CSS: `min-width: 320px` should be set
- Ensure parent container has width

**Error: "Failed to load resource: the server responded with a status of 403"**

**Solution:**
- AdSense account not fully approved
- Site not verified in AdSense
- Check AdSense dashboard for issues

**Error: "adsbygoogle is not defined"**

**Solution:**
- Script not loading
- Check network tab for script request
- Verify script URL is correct
- Check for ad blockers

---

### Issue 4: Ads Show in Some Places But Not Others

**Symptoms:**
- Sidebar ads work, content ads don't
- Some pages show ads, others don't

**Solutions:**

1. **Check Ad Slot IDs**
   - Each position needs unique ad unit ID
   - Verify in Admin → AdSense Settings
   - Each slot must be active (toggle ON)

2. **Check Page Structure**
   - Ads need proper HTML structure
   - Container must have width/height
   - No CSS hiding the ads (`display: none`)

3. **Check Ad Placement**
   - Some positions may not have ad units configured
   - Verify all positions have ad slot IDs

---

## 🧪 Testing Checklist

### Step 1: Verify Settings
- [ ] Publisher ID is correct (`ca-pub-XXXXXXXXXX`)
- [ ] At least one ad unit ID is configured
- [ ] "Enable AdSense" toggle is ON
- [ ] Ad slot is active (toggle ON)

### Step 2: Check Browser Console
Open DevTools (F12) → Console tab:
- [ ] See `[AdSense] Script loaded successfully`
- [ ] See `[AdSense] Initializing ad: {adSlot: "...", dataAdClient: "..."}`
- [ ] No red error messages

### Step 3: Check Network Tab
Open DevTools (F12) → Network tab:
- [ ] Filter by "adsbygoogle"
- [ ] See request to `pagead2.googlesyndication.com`
- [ ] Status should be 200 (not 403 or 404)

### Step 4: Check ads.txt
- [ ] Visit: `https://naqashthaheem.com/ads.txt`
- [ ] Should show your Publisher ID
- [ ] Format: `google.com, pub-XXXXXXXXXX, DIRECT, f08c47fec0942fa0`

### Step 5: Check AdSense Dashboard
- [ ] Go to AdSense → Ads → Ad units
- [ ] Ad units are "Active"
- [ ] No warnings or errors
- [ ] Check "Sites" → Your site is verified

---

## 🔧 Debug Mode

### Enable Debug Logging

The AdSense component now includes debug logging. Check browser console for:

```
[AdSense] Skipping ad load: {isProduction: false, hasClientId: false, dataAdClient: ""}
[AdSense] Script loaded successfully
[AdSense] Initializing ad: {adSlot: "1234567890", dataAdClient: "ca-pub-XXXXXXXXXX"}
[AdSense] Ad already initialized
```

### What Each Message Means

- **"Skipping ad load"**: AdSense is disabled or not configured
- **"Script loaded successfully"**: AdSense script loaded from Google
- **"Initializing ad"**: Attempting to show ad
- **"Ad already initialized"**: Ad was already loaded (normal)

---

## 📋 Configuration Checklist

### In Admin Panel (AdSense Settings)

1. **Publisher ID**
   - [ ] Format: `ca-pub-XXXXXXXXXX`
   - [ ] No spaces or extra characters
   - [ ] Matches your AdSense account

2. **Ad Unit Slots**
   - [ ] Create ad units in AdSense dashboard first
   - [ ] Copy ad unit IDs (not Publisher ID)
   - [ ] Enter in Admin → AdSense Settings
   - [ ] Toggle each slot to "Active"

3. **Master Toggle**
   - [ ] "Enable AdSense" must be ON
   - [ ] This is the master switch

### In AdSense Dashboard

1. **Ad Units**
   - [ ] Create ad units for each position:
     - Header/Banner
     - Sidebar
     - Content Top
     - Content Middle
     - Content Bottom
     - Footer
     - Between Posts
   - [ ] Copy the ad unit ID (format: `1234567890`)
   - [ ] Status should be "Active"

2. **Site Verification**
   - [ ] Site is added to AdSense
   - [ ] Site is verified
   - [ ] No warnings or errors

---

## 🚀 Quick Fixes

### Fix 1: Ads Not Showing After Adding Ad Units

1. **Wait 1-2 hours** for Google to index new ad units
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Check in incognito mode** (no extensions)
4. **Verify ad unit IDs** are correct in admin panel

### Fix 2: Ads Show Then Disappear

1. **Check AdSense dashboard** for account issues
2. **Verify site traffic** (needs real visitors)
3. **Check for policy violations** in AdSense
4. **Wait 24 hours** for system to stabilize

### Fix 3: Only Some Ads Show

1. **Check each ad slot** is configured
2. **Verify each slot is active** (toggle ON)
3. **Check ad unit IDs** are unique
4. **Ensure ad units exist** in AdSense dashboard

---

## 📞 Still Not Working?

### Check These:

1. **AdSense Account Status**
   - Dashboard → Account → Account status
   - Must be "Active"

2. **Site Verification**
   - AdSense → Sites
   - Your site must be verified
   - No errors or warnings

3. **Policy Compliance**
   - AdSense → Policy center
   - No violations
   - Site follows AdSense policies

4. **Traffic Requirements**
   - AdSense needs real traffic
   - Test with multiple visitors
   - Google may not serve ads to same IP

5. **Browser Extensions**
   - Disable ad blockers
   - Test in incognito mode
   - Try different browser

---

## 🎯 Expected Behavior

### When Everything Works:

1. **Console Shows:**
   ```
   [AdSense] Script loaded successfully
   [AdSense] Initializing ad: {adSlot: "...", dataAdClient: "..."}
   ```

2. **Network Tab Shows:**
   - Request to `pagead2.googlesyndication.com` (Status: 200)
   - Ad content loaded

3. **Page Shows:**
   - Ad containers with actual ads
   - Ads match configured positions
   - Ads are responsive

4. **AdSense Dashboard Shows:**
   - Impressions increasing
   - Ad units are "Active"
   - No errors

---

## 📝 Notes

- **First 24-48 hours:** Ads may not show immediately after approval
- **New ad units:** May take 1-2 hours to start serving
- **Traffic:** Google needs real traffic to serve ads
- **Testing:** Use incognito mode to avoid ad blockers
- **Cache:** Clear browser cache if ads don't update

---

**Last Updated:** November 3, 2025

