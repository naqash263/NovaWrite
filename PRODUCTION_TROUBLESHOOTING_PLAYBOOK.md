# 🚨 Production Troubleshooting Playbook

**Quick Reference Guide for Common Production Issues**

---

## 📋 Table of Contents

1. [Images Showing localhost URLs](#1-images-showing-localhost-urls)
2. [Storage Files Return 404](#2-storage-files-return-404)
3. [Storage Files Return 403 Forbidden](#3-storage-files-return-403-forbidden)
4. [Migration Errors](#4-migration-errors)
5. [API Returns 500 Errors](#5-api-returns-500-errors)
6. [File Upload Fails](#6-file-upload-fails)
7. [Authentication Issues](#7-authentication-issues)
8. [Frontend Not Updating](#8-frontend-not-updating)
9. [API Keys Not Showing in List](#9-api-keys-not-showing-in-list)

---

## 1. Images Showing localhost URLs

### **Symptoms:**
- Browser requests: `http://localhost:8001/storage/...`
- Images fail to load (403/404)
- Mixed content warnings on HTTPS site

### **Root Cause:**
Backend `APP_URL` is not set correctly or config cache wasn't cleared

### **Quick Fix:**
```bash
# On production server
cd /home/timesovh/naqashthaheem.com/backend

# Check current APP_URL
grep "^APP_URL" .env

# If it shows localhost, fix it:
sed -i 's|^APP_URL=.*|APP_URL=https://naqashthaheem.com|' .env

# Clear and rebuild cache (CRITICAL!)
php artisan config:clear
php artisan config:cache

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
# or
/scripts/restartsrv_httpd

# Verify fix
php artisan tinker --execute="echo config('app.url');"
# Should output: https://naqashthaheem.com
```

### **Prevention:**
- ✅ Always set APP_URL in .env before deploying
- ✅ GitHub Actions now sets this automatically
- ✅ Always clear config cache after changing APP_URL

---

## 2. Storage Files Return 404

### **Symptoms:**
- API returns correct URLs
- But accessing URL gives 404 Not Found
- Files exist in backend/storage/app/public/

### **Root Cause:**
Storage symlinks don't exist or are broken

### **Quick Fix:**
```bash
cd /home/timesovh/naqashthaheem.com

# Check if symlinks exist
ls -la public_html/storage
ls -la public_html/api/public/storage

# If missing or broken, create them:

# Symlink 1: In api/public (for Laravel)
cd public_html/api/public
rm storage 2>/dev/null  # Remove if broken
ln -sf ../../../backend/storage/app/public storage

# Symlink 2: In public_html (for direct access)
cd /home/timesovh/naqashthaheem.com/public_html
rm storage 2>/dev/null  # Remove if broken
ln -sf ../backend/storage/app/public storage

# Verify
ls storage/home-images/
# Should list your files

# Test URL
curl -I "https://naqashthaheem.com/storage/home-images/test.jpg"
# Should return 200 OK
```

### **Prevention:**
- ✅ GitHub Actions now creates symlinks automatically
- ✅ Always verify symlinks after deployment
- ✅ Run: `./scripts/verify-filesystem.sh`

---

## 3. Storage Files Return 403 Forbidden

### **Symptoms:**
- Symlinks exist
- Files exist
- But accessing gives 403 Forbidden

### **Root Cause:**
Incorrect file permissions

### **Quick Fix:**
```bash
cd /home/timesovh/naqashthaheem.com

# Set correct permissions
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache

# Set correct ownership (if needed)
# Find your web server user first:
ps aux | grep -E 'nginx|apache|httpd|lsws' | head -1

# Then set ownership (replace nobody with your web server user)
chown -R nobody:nobody backend/storage
chown -R nobody:nobody public_html/storage

# Test
curl -I "https://naqashthaheem.com/storage/home-images/test.jpg"
```

### **Prevention:**
- ✅ GitHub Actions sets permissions to 775 automatically
- ✅ Always check permissions after manual file operations

---

## 4. Migration Errors

### **Symptom A: "Column already exists"**

**Quick Fix:**
```bash
# The migration should have Schema::hasColumn() check
# If it doesn't, update the migration:

if (!Schema::hasColumn('table_name', 'column_name')) {
    $table->string('column_name');
}
```

### **Symptom B: "Table already exists"**

**Quick Fix:**
```bash
# Add table existence check:

if (!Schema::hasTable('table_name')) {
    Schema::create('table_name', function (Blueprint $table) {
        // ...
    });
}
```

### **Symptom C: "Column does not exist"**

**Quick Fix:**
```bash
# Check database schema
cd backend
php artisan tinker
>>> Schema::getColumnListing('table_name');

# If column is missing, create migration:
php artisan make:migration add_missing_column_to_table
```

### **Prevention:**
- ✅ ALL migrations now have safety checks
- ✅ Always test migrations locally first
- ✅ Use: `php artisan migrate --pretend` to preview

---

## 5. API Returns 500 Errors

### **Symptoms:**
- API endpoint returns 500 Internal Server Error
- Frontend shows "Server error"

### **Diagnosis:**
```bash
cd /home/timesovh/naqashthaheem.com/backend

# Check Laravel logs
tail -50 storage/logs/laravel.log

# Common causes:
# - Missing database column
# - Null constraint violation
# - Missing relationship
# - Configuration error
```

### **Quick Fixes:**

**If "Undefined column":**
```bash
# Create migration to add missing column
php artisan make:migration add_column_to_table
```

**If "Null constraint violation":**
```bash
# Make column nullable or provide default value
# In migration:
$table->string('column')->nullable()->change();
```

**If config error:**
```bash
php artisan config:clear
php artisan config:cache
```

### **Prevention:**
- ✅ Always check database schema before deploying
- ✅ Test all API endpoints before pushing
- ✅ Use proper validation in controllers

---

## 6. File Upload Fails

### **Symptom A: "file id field is required"**

**Cause:** Frontend sending wrong field name

**Quick Fix:**
```javascript
// ❌ WRONG
formData.append('file', file);

// ✅ CORRECT - Two-step process
// Step 1: Upload file
const uploadResponse = await apiClient.post('/files', formData);
const fileId = uploadResponse.data.file.id;

// Step 2: Attach to resource
await apiClient.post(`/admin/workflows/${id}/files`, {
  file_id: fileId,  // ← underscore, not space!
  display_name: file.name,
  description: '',
  sort_order: 0
});
```

### **Symptom B: "Column 'is_public' does not exist"**

**Cause:** Missing migration

**Quick Fix:**
```bash
# Run pending migrations
cd backend
php artisan migrate --force
```

### **Prevention:**
- ✅ Always use two-step file upload process
- ✅ Test file uploads before deploying
- ✅ Check field names match API expectations

---

## 7. Authentication Issues

### **Symptom A: "Unauthorized" on admin endpoints**

**Diagnosis:**
```bash
# Check if user is admin
cd backend
php artisan tinker
>>> $user = User::where('email', 'admin@example.com')->first();
>>> $user->role;
# Should be: 'admin'
```

**Quick Fix:**
```bash
# If role is not admin:
php artisan tinker
>>> $user = User::find(1);
>>> $user->role = 'admin';
>>> $user->save();
```

### **Symptom B: "Token is invalid"**

**Cause:** JWT secret changed or token expired

**Quick Fix:**
```bash
# Generate new JWT secret
php artisan jwt:secret --force

# Clear config
php artisan config:clear
php artisan config:cache

# User needs to login again to get new token
```

### **Prevention:**
- ✅ Don't regenerate JWT secret on production
- ✅ API tokens now work as alternative
- ✅ Set longer TTL for JWT if needed

---

## 8. Frontend Not Updating

### **Symptoms:**
- Deployed new code
- But browser shows old version
- Changes not visible

### **Root Causes & Fixes:**

**A. Browser Cache:**
```
Fix: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
Or: Open in incognito/private window
Or: Clear browser cache completely
```

**B. Service Worker Cache (PWA):**
```bash
# In browser console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
location.reload(true);
```

**C. Old Build Deployed:**
```bash
# Verify deployment timestamp
ls -la /home/timesovh/naqashthaheem.com/public_html/index.html

# Check if assets are new
ls -la /home/timesovh/naqashthaheem.com/public_html/assets/js/ | head -5

# If old, redeploy:
cd /home/timesovh/naqashthaheem.com/frontend
npm run build
cp -r dist/* ../public_html/
```

**D. CDN/Proxy Cache:**
```
If using Cloudflare or similar:
- Go to Cloudflare dashboard
- Purge cache
- Or add cache-busting query params
```

### **Prevention:**
- ✅ GitHub Actions always deploys fresh build
- ✅ Use versioned asset filenames (Vite does this)
- ✅ Set proper cache headers

---

## 9. API Keys Not Showing in List

### **Symptoms:**
- Stats show correct count (e.g., "Total Keys: 3")
- But API keys table is empty
- Table headers visible but no rows
- Console might show errors about decryption

### **Root Cause:**
API key decryption failing during JSON serialization, causing the entire model to fail loading

### **Diagnosis:**
```bash
# Check Laravel logs
cd /home/timesovh/naqashthaheem.com/backend
tail -50 storage/logs/laravel.log | grep -i "decrypt\|api_key"

# Check browser console
# Look for API response errors or empty arrays
```

### **Quick Fix:**

**Option A: Clear and Rebuild Encryption Cache**
```bash
cd /home/timesovh/naqashthaheem.com/backend

# Check current APP_KEY
grep "^APP_KEY" .env

# If APP_KEY is missing or changed, this is the issue
# Regenerate APP_KEY (WARNING: This will break existing encrypted data!)
php artisan key:generate

# Or restore the original APP_KEY from backup
```

**Option B: Fix Model to Handle Decryption Errors**
```bash
# The fix is already in the model (GeminiApiKey.php)
# Just make sure you have the latest code

# Check if api_key is hidden in model
grep "protected \$hidden" backend/app/Models/GeminiApiKey.php
# Should show: protected $hidden = ['api_key'];

# Verify the model handles decryption errors
grep -A 5 "function apiKey" backend/app/Models/GeminiApiKey.php
# Should have try-catch block
```

**Option C: Re-encrypt All API Keys**
```bash
# If APP_KEY changed and you have the keys elsewhere, re-add them
cd backend
php artisan tinker

# List all keys with decryption issues
>>> GeminiApiKey::all()->each(function($key) { 
...   try { 
...     decrypt($key->api_key); 
...     echo "✅ {$key->name} OK\n"; 
...   } catch (\Exception $e) { 
...     echo "❌ {$key->name} FAILED\n"; 
...   } 
... });

# If keys failed, you'll need to re-add them manually through the UI
```

### **Prevention:**
- ✅ NEVER change APP_KEY in production without backing up
- ✅ Model now hides `api_key` from JSON responses
- ✅ Model handles decryption errors gracefully
- ✅ Frontend shows empty state when no keys found
- ✅ Console logging helps debug API response issues

### **Verification:**
```bash
# Test the API endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://naqashthaheem.com/api/admin/gemini-api-keys

# Should return:
# {
#   "success": true,
#   "data": {
#     "api_keys": [...],
#     "statistics": {...}
#   }
# }

# Check browser console
# Should see: "API Response:", "API Keys:", "Stats:"
```

---

## 🔧 Emergency Commands

### **Complete Cache Clear:**
```bash
cd /home/timesovh/naqashthaheem.com/backend

# Clear everything
php artisan optimize:clear

# This clears:
# - Config cache
# - Route cache
# - View cache
# - Application cache
# - Compiled classes

# Rebuild
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### **Restart All Services:**
```bash
# PHP-FPM
sudo systemctl restart php8.2-fpm

# Web server (LiteSpeed)
sudo systemctl restart lsws

# Or use cPanel script
/scripts/restartsrv_httpd
```

### **Check System Status:**
```bash
# Check disk space
df -h

# Check memory
free -h

# Check PHP-FPM status
sudo systemctl status php8.2-fpm

# Check web server
sudo systemctl status lsws

# Check recent errors
tail -100 /home/timesovh/naqashthaheem.com/backend/storage/logs/laravel.log
```

---

## 📊 Verification Checklist

After fixing any issue, verify:

```bash
# 1. Backend config
cd /home/timesovh/naqashthaheem.com/backend
php artisan tinker --execute="
echo 'APP_URL: ' . config('app.url') . PHP_EOL;
echo 'Storage URL: ' . \Illuminate\Support\Facades\Storage::disk('public')->url('test.jpg') . PHP_EOL;
"

# 2. Symlinks
ls -la public_html/storage
ls -la public_html/api/public/storage

# 3. Permissions
ls -la backend/storage/app/public/

# 4. API response
curl -s "https://naqashthaheem.com/api/home-settings" | grep "image_url" | head -1

# 5. File access
curl -I "https://naqashthaheem.com/storage/home-images/test.jpg"

# 6. Frontend
# Open browser, check Network tab for localhost URLs
```

---

## 🆘 Emergency Rollback

If deployment breaks production:

```bash
cd /home/timesovh/naqashthaheem.com

# 1. Rollback code
git reset --hard HEAD~1

# 2. Rollback migrations (if needed)
cd backend
php artisan migrate:rollback

# 3. Redeploy previous version
cd ../frontend
npm run build
cp -r dist/* ../public_html/

# 4. Clear caches
cd ../backend
php artisan optimize:clear
php artisan config:cache

# 5. Restart services
sudo systemctl restart php8.2-fpm
```

---

## 📞 Quick Diagnostic Script

Save this as `diagnose.sh` and run when issues occur:

```bash
#!/bin/bash
echo "=== PRODUCTION DIAGNOSTICS ==="
echo ""
echo "1. APP_URL:"
cd /home/timesovh/naqashthaheem.com/backend
grep "^APP_URL" .env
php artisan tinker --execute="echo config('app.url');" 2>/dev/null
echo ""

echo "2. Storage Symlinks:"
ls -la /home/timesovh/naqashthaheem.com/public_html/storage 2>/dev/null || echo "Missing!"
ls -la /home/timesovh/naqashthaheem.com/public_html/api/public/storage 2>/dev/null || echo "Missing!"
echo ""

echo "3. Permissions:"
ls -ld /home/timesovh/naqashthaheem.com/backend/storage
echo ""

echo "4. Recent Errors:"
tail -20 storage/logs/laravel.log 2>/dev/null || echo "No log file"
echo ""

echo "5. Services:"
systemctl is-active php8.2-fpm 2>/dev/null || echo "PHP-FPM status unknown"
systemctl is-active lsws 2>/dev/null || echo "LiteSpeed status unknown"
```

---

## 🎯 Prevention Best Practices

### **Before Every Deployment:**

1. ✅ Test locally with production URLs
2. ✅ Run: `grep -r "localhost" frontend/dist/`
3. ✅ Verify migrations with: `php artisan migrate --pretend`
4. ✅ Check .env files have production values
5. ✅ Test all CRUD operations
6. ✅ Test file uploads

### **After Every Deployment:**

1. ✅ Verify GitHub Actions completed successfully
2. ✅ Check site loads: `curl -I https://naqashthaheem.com`
3. ✅ Check API works: `curl https://naqashthaheem.com/api/workflows`
4. ✅ Check storage URLs: `curl https://naqashthaheem.com/api/home-settings | grep image_url`
5. ✅ Test in browser (hard refresh)
6. ✅ Check browser console for errors

---

## 📝 Lessons Learned

### **What We Fixed:**

1. **localhost URLs in production**
   - Cause: Hardcoded URLs and wrong .env
   - Fix: Use environment variables everywhere
   - Prevention: Verify build before deploying

2. **Missing storage symlinks**
   - Cause: Manual deployment didn't create them
   - Fix: Created in both required locations
   - Prevention: GitHub Actions now creates automatically

3. **Config cache issues**
   - Cause: Changed APP_URL but didn't clear cache
   - Fix: Always clear and rebuild cache
   - Prevention: Deployment script does this automatically

4. **Migration errors**
   - Cause: Direct SQL commands, no safety checks
   - Fix: Created proper migrations with checks
   - Prevention: Never use direct SQL, always migrate

5. **File upload issues**
   - Cause: Wrong API usage (one-step instead of two-step)
   - Fix: Upload file first, then attach file_id
   - Prevention: Follow API documentation

---

## 🔍 Monitoring Tools

### **Check Site Health:**
```bash
# Response time
curl -w "@-" -o /dev/null -s "https://naqashthaheem.com" <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF

# Check SSL
openssl s_client -connect naqashthaheem.com:443 -servername naqashthaheem.com < /dev/null

# Check DNS
dig naqashthaheem.com
```

### **Monitor Logs:**
```bash
# Watch Laravel logs in real-time
tail -f /home/timesovh/naqashthaheem.com/backend/storage/logs/laravel.log

# Watch web server logs
tail -f /usr/local/lsws/logs/error.log

# Check PHP errors
tail -f /home/timesovh/naqashthaheem.com/backend/storage/logs/php_errors.log
```

---

## 📚 Reference Documents

- **`GITHUB_DEPLOYMENT_GUIDE.md`** - How to deploy via GitHub
- **`PRODUCTION_QUICK_FIX.md`** - Immediate fixes for common issues
- **`FILESYSTEM_SETUP.md`** - Storage configuration guide
- **`PRODUCTION_ENV_SETUP.md`** - Environment variables reference
- **`DEPLOYMENT_CHECKLIST.md`** - Complete deployment guide
- **`MIGRATION_SUMMARY.md`** - All migrations documented
- **`.cursor/rules/rules.mdc`** - Development rules and best practices

---

## 🎯 Quick Reference Card

**Print this and keep handy:**

```
┌─────────────────────────────────────────────────┐
│         PRODUCTION QUICK REFERENCE              │
├─────────────────────────────────────────────────┤
│ Fix localhost URLs:                             │
│   sed -i 's|APP_URL=.*|APP_URL=https://...│' .env│
│   php artisan config:clear && config:cache     │
│                                                 │
│ Fix 404 on storage:                             │
│   ln -sf ../../../backend/storage/app/public storage│
│                                                 │
│ Fix 403 forbidden:                              │
│   chmod -R 775 backend/storage                  │
│                                                 │
│ Clear all caches:                               │
│   php artisan optimize:clear                    │
│   php artisan config:cache                      │
│                                                 │
│ Restart services:                               │
│   sudo systemctl restart php8.2-fpm             │
│   /scripts/restartsrv_httpd                     │
│                                                 │
│ Check logs:                                     │
│   tail -50 backend/storage/logs/laravel.log    │
│                                                 │
│ Verify deployment:                              │
│   ./scripts/verify-production-config.sh         │
└─────────────────────────────────────────────────┘
```

---

## ✅ Success Indicators

**Everything is working when:**

- ✅ `curl https://naqashthaheem.com` returns 200
- ✅ `curl https://naqashthaheem.com/api/workflows` returns JSON
- ✅ API responses contain `https://naqashthaheem.com/storage/...`
- ✅ `curl -I https://naqashthaheem.com/storage/...` returns 200
- ✅ No errors in Laravel logs
- ✅ No console errors in browser
- ✅ Images load correctly
- ✅ File uploads work

---

**Keep this playbook handy for quick troubleshooting!** 🚀

**Most issues can be fixed in under 5 minutes using these commands.**

