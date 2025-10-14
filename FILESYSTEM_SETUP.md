# 📁 Filesystem Setup & Configuration Guide

## ✅ Current Status

**Development Environment:** ✅ All checks passed  
**Production Ready:** ✅ With configuration changes below

---

## 📊 Filesystem Audit Results

### **Storage Structure:**
```
backend/storage/app/
├── private/           # Local disk (not web-accessible)
└── public/            # Public disk (web-accessible via symlink)
    ├── home-images/   # Home page images (4 files)
    ├── uploads/       # General file uploads (26 files)
    ├── images/        # Other images (1 file)
    └── watermark-removal/  # Watermark removal processed files
```

### **Symlink Status:**
```
✅ backend/public/storage → backend/storage/app/public
✅ Symlink is valid and working
```

### **Permissions:**
```
✅ backend/storage/app/public - Writable
✅ backend/bootstrap/cache - Writable
```

### **Configuration:**
```
Default Disk: local (files use 'public' explicitly)
Public Disk Root: backend/storage/app/public
Public Disk URL: APP_URL + '/storage'
```

---

## 🔧 Production Configuration

### **1. Backend Environment Variables**

**File:** `backend/.env`

```bash
# Storage Configuration
FILESYSTEM_DISK=public  # Optional: makes 'public' the default
APP_URL=https://naqashthaheem.com  # ⚠️ CRITICAL!

# This affects ALL storage URLs:
# - Home page images
# - File uploads
# - Workflow attachments
# - CV templates
# - Watermark removal files
```

### **2. Storage Directory Structure in Production**

Based on your production structure:
```
/home/username/naqashthaheem.com/
├── public_html/              # Document root (web-accessible)
│   ├── index.html            # React frontend
│   ├── assets/               # Frontend assets
│   ├── storage/              # ⚠️ SYMLINK to backend/storage/app/public
│   │   ├── home-images/
│   │   ├── uploads/
│   │   └── images/
│   └── api/                  # Laravel public folder
│       ├── index.php         # Laravel entry point
│       └── storage/          # ⚠️ SYMLINK to backend/storage/app/public
├── backend/
│   ├── storage/
│   │   └── app/
│   │       └── public/       # Actual storage location
│   └── public/
│       └── storage/          # Symlink (created by storage:link)
└── frontend/
```

**Two symlinks needed:**
1. `backend/public/storage` → `backend/storage/app/public` (Laravel default)
2. `public_html/storage` → `backend/storage/app/public` (For direct access)

---

## 🔗 Creating Symlinks on Production

### **Method 1: Using Laravel Command (Recommended)**

```bash
cd /home/username/naqashthaheem.com/backend
php artisan storage:link
```

This creates: `backend/public/storage` → `backend/storage/app/public`

### **Method 2: Manual Symlink (For public_html)**

```bash
cd /home/username/naqashthaheem.com/public_html
ln -sf ../backend/storage/app/public storage
```

This creates: `public_html/storage` → `backend/storage/app/public`

### **Verify Symlinks:**

```bash
# Check backend symlink
ls -la backend/public/storage
# Should show: storage -> /full/path/to/backend/storage/app/public

# Check public_html symlink (if created)
ls -la public_html/storage
# Should show: storage -> ../backend/storage/app/public

# Test access
ls backend/public/storage/home-images/
ls public_html/storage/home-images/
# Both should show the same files
```

---

## 🔐 Production Permissions

### **Set Correct Permissions:**

```bash
cd /home/username/naqashthaheem.com

# Storage directories
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache

# Ownership (replace www-data with your web server user)
chown -R www-data:www-data backend/storage
chown -R www-data:www-data backend/bootstrap/cache

# Ensure symlinks are accessible
chown -R www-data:www-data public_html/storage
```

### **Check Web Server User:**

```bash
# Find web server user
ps aux | grep nginx  # or apache2/httpd
# Look for user in the process list (usually www-data, nginx, or apache)
```

---

## 📤 File Upload Flow

### **How Files Are Stored:**

1. **Upload Request:**
   ```
   POST /api/files
   File: image.png
   ```

2. **Laravel Stores:**
   ```php
   $path = $file->store('uploads', 'public');
   // Stores in: backend/storage/app/public/uploads/1760413099_image.png
   ```

3. **URL Generated:**
   ```php
   $url = Storage::disk('public')->url($path);
   // Returns: https://naqashthaheem.com/storage/uploads/1760413099_image.png
   ```

4. **Web Server Serves:**
   ```
   Request: https://naqashthaheem.com/storage/uploads/1760413099_image.png
   ↓ (via symlink)
   Serves: /home/.../public_html/storage/uploads/1760413099_image.png
   ↓ (actual file)
   File at: /home/.../backend/storage/app/public/uploads/1760413099_image.png
   ```

---

## 🌐 URL Generation Examples

### **Development:**
```bash
APP_URL=http://localhost:8001

Storage::url('home-images/photo.jpg')
→ http://localhost:8001/storage/home-images/photo.jpg
```

### **Production:**
```bash
APP_URL=https://naqashthaheem.com

Storage::url('home-images/photo.jpg')
→ https://naqashthaheem.com/storage/home-images/photo.jpg
```

---

## 🧪 Testing Storage on Production

### **Test 1: Upload a File**

```bash
# Upload test file
curl -X POST "https://naqashthaheem.com/api/files" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.png"

# Expected response:
{
  "message": "File uploaded successfully.",
  "file": {
    "id": 1,
    "path": "uploads/1760413099_test.png",
    ...
  }
}
```

### **Test 2: Verify URL in Response**

The response should include a path, and when you construct the URL:
```
https://naqashthaheem.com/storage/uploads/1760413099_test.png
```

It should be accessible (not 404, not 403).

### **Test 3: Check Symlink**

```bash
# On production server
curl -I https://naqashthaheem.com/storage/test.jpg
# Should return 200 OK or 404 (if file doesn't exist)
# Should NOT return 403 Forbidden
```

---

## 🚨 Common Production Issues

### Issue 1: Storage URLs Return 404

**Symptoms:**
- Files upload successfully
- URLs generated correctly
- But accessing URL returns 404

**Diagnosis:**
```bash
# Check if symlink exists
ls -la public_html/storage
ls -la backend/public/storage

# Check if actual file exists
ls backend/storage/app/public/uploads/
```

**Solution:**
```bash
# Recreate symlink
cd backend
php artisan storage:link

# Or manually
cd public_html
ln -sf ../backend/storage/app/public storage
```

### Issue 2: Storage URLs Return 403 Forbidden

**Symptoms:**
- URLs are correct
- Files exist
- But returns 403 Forbidden

**Diagnosis:**
```bash
# Check permissions
ls -la backend/storage/app/public/
ls -la public_html/storage/
```

**Solution:**
```bash
# Fix permissions
chmod -R 775 backend/storage
chown -R www-data:www-data backend/storage
chown -R www-data:www-data public_html/storage

# Check SELinux (if enabled)
getenforce
# If Enforcing, may need to set context:
chcon -R -t httpd_sys_rw_content_t backend/storage
```

### Issue 3: URLs Still Show localhost

**Symptoms:**
- Uploaded files work
- But URLs in responses show `http://localhost...`

**Diagnosis:**
```bash
# Check APP_URL
php artisan tinker
>>> config('app.url')
```

**Solution:**
```bash
# Update .env
APP_URL=https://naqashthaheem.com

# Clear config cache
php artisan config:clear
php artisan config:cache

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

### Issue 4: Mixed Content Warning (HTTPS site loading HTTP images)

**Symptoms:**
- Site is HTTPS
- But images are HTTP
- Browser blocks mixed content

**Cause:** APP_URL is set to `http://` instead of `https://`

**Solution:**
```bash
# Ensure APP_URL uses https
APP_URL=https://naqashthaheem.com  # NOT http!

php artisan config:clear
php artisan config:cache
```

---

## 📝 Production Setup Checklist

### Before Deployment:

- [ ] Set `APP_URL=https://naqashthaheem.com` in backend `.env`
- [ ] Set `VITE_API_URL=https://naqashthaheem.com/api` in frontend `.env`
- [ ] Build frontend: `npm run build`
- [ ] Copy frontend build to `public_html/`
- [ ] Create storage symlinks (both locations)
- [ ] Set correct permissions (775 for storage)
- [ ] Set correct ownership (www-data or web server user)
- [ ] Test symlink: `ls -la public_html/storage`

### After Deployment:

- [ ] Run: `php artisan storage:link`
- [ ] Run: `php artisan config:clear && php artisan config:cache`
- [ ] Upload test file via API
- [ ] Verify URL in response uses `https://naqashthaheem.com`
- [ ] Access the URL directly in browser
- [ ] Check browser console for mixed content warnings
- [ ] Verify home page images load correctly

---

## 🛠️ Quick Production Setup Script

```bash
#!/bin/bash

# Run on production server

PROJECT_ROOT="/home/username/naqashthaheem.com"
WEB_USER="www-data"  # Change if different

echo "Setting up production filesystem..."

# 1. Navigate to project
cd $PROJECT_ROOT

# 2. Create storage symlinks
echo "Creating symlinks..."
cd backend
php artisan storage:link

cd ../public_html
ln -sf ../backend/storage/app/public storage

# 3. Set permissions
echo "Setting permissions..."
chmod -R 775 $PROJECT_ROOT/backend/storage
chmod -R 775 $PROJECT_ROOT/backend/bootstrap/cache

# 4. Set ownership
echo "Setting ownership..."
chown -R $WEB_USER:$WEB_USER $PROJECT_ROOT/backend/storage
chown -R $WEB_USER:$WEB_USER $PROJECT_ROOT/backend/bootstrap/cache
chown -R $WEB_USER:$WEB_USER $PROJECT_ROOT/public_html/storage

# 5. Clear caches
cd $PROJECT_ROOT/backend
php artisan config:clear
php artisan cache:clear
php artisan config:cache

echo ""
echo "✅ Filesystem setup complete!"
echo ""
echo "Verify:"
echo "1. Check symlink: ls -la public_html/storage"
echo "2. Test URL generation: php artisan tinker"
echo "   >>> Storage::disk('public')->url('test.jpg')"
echo "3. Upload a test file and verify URL"
```

---

## 📊 Environment Configuration Summary

### **Development:**
```bash
# backend/.env
APP_URL=http://localhost:8001
FILESYSTEM_DISK=local

# frontend/.env
VITE_API_URL=http://localhost:8001/api
```

### **Production:**
```bash
# backend/.env
APP_URL=https://naqashthaheem.com
FILESYSTEM_DISK=public  # Optional

# frontend/.env
VITE_API_URL=https://naqashthaheem.com/api
```

---

## ✅ Verification Script

Run this on production after setup:

```bash
cd /path/to/project
./scripts/verify-filesystem.sh
```

Expected output:
- ✅ All storage directories exist
- ✅ Symlinks are valid
- ✅ Permissions are correct
- ✅ APP_URL is set to production domain
- ✅ Storage URLs use production domain

---

## 🎯 Key Takeaways

1. **APP_URL is CRITICAL** - All storage URLs depend on it
2. **Symlinks must exist** - Both in backend/public and public_html
3. **Permissions matter** - 775 for storage, www-data ownership
4. **Always cache config** - After changing APP_URL
5. **Test thoroughly** - Upload file, check URL, access in browser

---

**Your filesystem is production-ready!** 🚀

All files will be stored in `backend/storage/app/public/` and accessible via `https://naqashthaheem.com/storage/...` when APP_URL is set correctly.

