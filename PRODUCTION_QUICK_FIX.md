# 🚨 Production Quick Fix - localhost URLs Issue

## Problem

**Issue:** Images on production showing `http://localhost:8001/storage/...` instead of `https://naqashthaheem.com/storage/...`

**Request URL:** `http://localhost:8001/storage/home-images/1760415771_Pi7_Passport_Photo.jpeg`  
**Status:** 403 Forbidden

---

## Root Cause

The production server is still using cached configuration with `APP_URL=http://localhost` from before deployment.

---

## 🔧 IMMEDIATE FIX (Run on Production Server)

### Step 1: Verify Current Configuration

```bash
# SSH to production server
ssh username@naqashthaheem.com

# Navigate to backend
cd /home/username/naqashthaheem.com/backend

# Check current APP_URL in .env
grep "^APP_URL" .env

# Check if config is cached
ls -la bootstrap/cache/config.php

# Check runtime config
php artisan tinker --execute="echo config('app.url');"
```

**If it shows `localhost`, proceed to Step 2.**

---

### Step 2: Update Configuration

```bash
# Still in backend directory

# Update APP_URL in .env
sed -i.bak 's|^APP_URL=.*|APP_URL=https://naqashthaheem.com|' .env

# Verify the change
grep "^APP_URL" .env
# Should show: APP_URL=https://naqashthaheem.com
```

---

### Step 3: Clear ALL Caches

```bash
# Clear configuration cache (CRITICAL!)
php artisan config:clear

# Clear other caches
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Rebuild config cache
php artisan config:cache

# Verify it worked
php artisan tinker --execute="echo config('app.url');"
# Should now show: https://naqashthaheem.com
```

---

### Step 4: Verify Storage URL Generation

```bash
# Test storage URL generation
php artisan tinker --execute="use Illuminate\Support\Facades\Storage; echo Storage::disk('public')->url('test.jpg');"

# Should output: https://naqashthaheem.com/storage/test.jpg
# NOT: http://localhost:8001/storage/test.jpg
```

---

### Step 5: Restart Services

```bash
# Restart PHP-FPM (adjust version as needed)
sudo systemctl restart php8.2-fpm
# or
sudo service php8.2-fpm restart

# Restart web server
sudo systemctl restart nginx
# or
sudo systemctl restart apache2
```

---

### Step 6: Verify Frontend

```bash
# Check frontend .env
cd ../frontend
cat .env

# Should show:
# VITE_API_URL=https://naqashthaheem.com/api

# If it shows localhost, update it:
echo "VITE_API_URL=https://naqashthaheem.com/api" > .env
echo "VITE_APP_URL=https://naqashthaheem.com" >> .env

# Rebuild frontend
npm run build

# Copy build to public_html (adjust path as needed)
rm -rf ../public_html/assets/
cp -r dist/* ../public_html/
```

---

## 🧪 Testing After Fix

### Test 1: Check API Response

```bash
# Get a home setting and check the URL
curl -s "https://naqashthaheem.com/api/home-settings" | grep "image_url"

# Should show URLs like:
# "image_url": "https://naqashthaheem.com/storage/home-images/..."
# NOT:
# "image_url": "http://localhost:8001/storage/..."
```

### Test 2: Upload New File

```bash
# Upload a test file
curl -X POST "https://naqashthaheem.com/api/files" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.png"

# Check the response - should contain production URLs
```

### Test 3: Access Image Directly

```bash
# Try to access an image directly
curl -I "https://naqashthaheem.com/storage/home-images/1760415771_Pi7_Passport_Photo.jpeg"

# Should return:
# HTTP/2 200 OK
# NOT: 403 Forbidden or 404 Not Found
```

---

## 🔍 Verification Checklist

Run these commands on production and verify outputs:

```bash
cd /home/username/naqashthaheem.com/backend

# 1. Check .env
grep "^APP_URL" .env
# Expected: APP_URL=https://naqashthaheem.com
# NOT: APP_URL=http://localhost

# 2. Check runtime config
php artisan tinker --execute="echo config('app.url');"
# Expected: https://naqashthaheem.com
# NOT: http://localhost:8001

# 3. Check config cache exists
ls -la bootstrap/cache/config.php
# If exists: Config is cached (good for production performance)
# Ensure it has correct values after clearing and rebuilding

# 4. Test storage URL
php artisan tinker --execute="use Illuminate\Support\Facades\Storage; echo Storage::disk('public')->url('home-images/test.jpg');"
# Expected: https://naqashthaheem.com/storage/home-images/test.jpg
# NOT: http://localhost:8001/storage/home-images/test.jpg

# 5. Check storage symlink
ls -la public/storage
# Expected: storage -> /full/path/to/storage/app/public

# 6. Test actual file access
curl -I "https://naqashthaheem.com/storage/home-images/1760415771_Pi7_Passport_Photo.jpeg"
# Expected: HTTP/2 200 OK
# NOT: 403 Forbidden
```

---

## 🎯 Most Common Issue: Config Cache Not Cleared

**The #1 reason for localhost URLs in production:**

The config cache was built with the old `APP_URL` and wasn't cleared after updating.

**Solution:**
```bash
cd backend

# Method 1: Quick fix
php artisan config:clear && php artisan config:cache

# Method 2: Complete cache clear
php artisan optimize:clear  # Clears all caches
php artisan config:cache    # Rebuild config cache

# Method 3: Manual
rm -f bootstrap/cache/config.php
php artisan config:cache
```

**Then restart PHP-FPM:**
```bash
sudo systemctl restart php8.2-fpm
```

---

## 📊 Expected vs Actual

### What You Should See After Fix:

| Check | Expected (Production) | Current (Problem) |
|-------|----------------------|-------------------|
| **APP_URL in .env** | `https://naqashthaheem.com` | `http://localhost` ❌ |
| **Runtime config** | `https://naqashthaheem.com` | `http://localhost:8001` ❌ |
| **Storage URLs** | `https://naqashthaheem.com/storage/...` | `http://localhost:8001/storage/...` ❌ |
| **API Response** | Production URLs | localhost URLs ❌ |
| **Image Access** | 200 OK | 403 Forbidden ❌ |

---

## 🚀 Complete Fix (Copy-Paste on Production)

```bash
# Run these commands on production server

cd /home/username/naqashthaheem.com/backend

# 1. Backup current .env
cp .env .env.backup

# 2. Update APP_URL
sed -i 's|^APP_URL=.*|APP_URL=https://naqashthaheem.com|' .env

# 3. Verify change
grep "^APP_URL" .env

# 4. Clear ALL caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# 5. Rebuild config cache
php artisan config:cache

# 6. Verify runtime config
php artisan tinker --execute="echo config('app.url');"
# Should output: https://naqashthaheem.com

# 7. Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# 8. Test storage URL
php artisan tinker --execute="use Illuminate\Support\Facades\Storage; echo Storage::disk('public')->url('test.jpg');"
# Should output: https://naqashthaheem.com/storage/test.jpg

echo ""
echo "✅ Configuration updated!"
echo "Now test in browser: https://naqashthaheem.com"
```

---

## 🔄 If Still Not Working

### Additional Steps:

1. **Check if there are multiple .env files:**
   ```bash
   find . -name ".env" -type f
   # Ensure you're editing the correct one
   ```

2. **Check web server configuration:**
   ```bash
   # Ensure web server is pointing to correct directory
   # Nginx: /etc/nginx/sites-available/naqashthaheem.com
   # Apache: /etc/apache2/sites-available/naqashthaheem.com
   ```

3. **Check if old frontend build is cached:**
   ```bash
   # Rebuild frontend with correct .env
   cd ../frontend
   echo "VITE_API_URL=https://naqashthaheem.com/api" > .env
   npm run build
   
   # Deploy to public_html
   cp -r dist/* ../public_html/
   ```

4. **Clear browser cache:**
   - Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or open in incognito/private window

---

## 📞 Support Commands

```bash
# Check all environment-related config
php artisan tinker --execute="
echo 'APP_URL: ' . config('app.url') . PHP_EOL;
echo 'APP_ENV: ' . config('app.env') . PHP_EOL;
echo 'APP_DEBUG: ' . (config('app.debug') ? 'true' : 'false') . PHP_EOL;
echo 'Filesystem default: ' . config('filesystems.default') . PHP_EOL;
echo 'Public disk URL: ' . config('filesystems.disks.public.url') . PHP_EOL;
"

# Check recent logs
tail -50 storage/logs/laravel.log

# Check PHP-FPM status
sudo systemctl status php8.2-fpm

# Check web server status  
sudo systemctl status nginx
```

---

## ✅ Success Verification

After applying fixes, verify:

1. ✅ `grep "^APP_URL" .env` shows production URL
2. ✅ `php artisan tinker --execute="echo config('app.url');"` shows production URL
3. ✅ API responses contain production URLs (no localhost)
4. ✅ Images load in browser (200 OK, not 403/404)
5. ✅ No mixed content warnings in browser console

---

**Once all checks pass, your production environment will serve all assets with correct URLs!** 🚀

