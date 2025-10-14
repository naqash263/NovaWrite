# 🔧 Production Environment Setup Guide

## 📋 Environment Variable Configuration

### **Critical Configuration for Asset URLs**

The system uses `APP_URL` to generate all storage URLs (images, files, uploads). This MUST be set correctly!

---

## 🖥️ Backend Environment (`backend/.env`)

### **Production Configuration:**

```bash
# ==========================================
# APP CONFIGURATION
# ==========================================
APP_NAME=NovaWrite
APP_ENV=production
APP_DEBUG=false
APP_URL=https://naqashthaheem.com  # ⚠️ NO trailing slash!
APP_KEY=base64:your_generated_app_key_here

# ==========================================
# DATABASE
# ==========================================
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=novawrite_production
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_db_password

# ==========================================
# JWT AUTHENTICATION
# ==========================================
JWT_SECRET=your_jwt_secret_key_here
JWT_TTL=60
JWT_REFRESH_TTL=20160
JWT_ALGO=HS256

# ==========================================
# MAIL CONFIGURATION
# ==========================================
MAIL_MAILER=smtp
MAIL_HOST=naqashthaheem.com
MAIL_PORT=465
MAIL_USERNAME=contact@naqashthaheem.com
MAIL_PASSWORD=your_email_password_here
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=contact@naqashthaheem.com
MAIL_FROM_NAME="NovaWrite"

# ==========================================
# GOOGLE OAUTH
# ==========================================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback

# ==========================================
# SESSION & CACHE
# ==========================================
SESSION_DRIVER=file
SESSION_LIFETIME=120
CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# ==========================================
# FILESYSTEM
# ==========================================
FILESYSTEM_DISK=public

# ==========================================
# SECURITY
# ==========================================
CORS_ALLOWED_ORIGINS=https://naqashthaheem.com
```

---

## 🌐 Frontend Environment (`frontend/.env`)

### **Production Configuration:**

```bash
# ==========================================
# API CONFIGURATION
# ==========================================
VITE_API_URL=https://naqashthaheem.com/api

# ==========================================
# APP CONFIGURATION
# ==========================================
VITE_APP_NAME=NovaWrite
VITE_APP_URL=https://naqashthaheem.com

# ==========================================
# GOOGLE OAUTH (if needed in frontend)
# ==========================================
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 📁 Production Directory Structure

Based on your production setup, the structure should be:

```
/home/username/naqashthaheem.com/
├── public_html/              # Document root (accessible via domain)
│   ├── index.html            # React frontend build
│   ├── assets/               # Frontend compiled assets
│   ├── storage/              # Symlink to backend storage
│   │   ├── home-images/      # Home page images
│   │   ├── uploads/          # General uploads
│   │   └── ...
│   └── api/                  # Laravel backend public folder
│       └── index.php         # Laravel entry point
├── backend/                  # Laravel source code
│   ├── .env                  # Backend environment
│   ├── storage/              # Storage folder (symlinked to public_html/storage)
│   └── ...
├── frontend/                 # React source code
│   ├── .env                  # Frontend environment
│   └── dist/                 # Build output (copied to public_html)
└── ...
```

---

## 🔗 Storage Symlink Setup

**IMPORTANT:** Create a symlink from `public_html/storage` to `backend/storage/app/public`:

```bash
# Navigate to your public_html directory
cd /home/username/naqashthaheem.com/public_html

# Create storage symlink
ln -s ../backend/storage/app/public storage

# Verify
ls -la storage
# Should show: storage -> ../backend/storage/app/public
```

**Or use Laravel command:**
```bash
cd /home/username/naqashthaheem.com/backend
php artisan storage:link
# This creates: public/storage -> storage/app/public
```

Then ensure your web server serves the symlinked files correctly.

---

## ⚙️ URL Generation Flow

### **How Storage URLs Work:**

1. **File Upload:**
   ```php
   $path = $file->storeAs('home-images', $filename, 'public');
   // Stores in: backend/storage/app/public/home-images/
   ```

2. **URL Generation:**
   ```php
   $url = Storage::disk('public')->url($path);
   // Uses: APP_URL + '/storage/' + $path
   // Result: https://naqashthaheem.com/storage/home-images/filename.jpg
   ```

3. **Web Server Serves:**
   ```
   https://naqashthaheem.com/storage/home-images/filename.jpg
   ↓ (via symlink)
   /home/username/naqashthaheem.com/public_html/storage/home-images/filename.jpg
   ↓ (actual location)
   /home/username/naqashthaheem.com/backend/storage/app/public/home-images/filename.jpg
   ```

---

## 🔒 Permissions Setup

Ensure correct permissions on production:

```bash
# Storage directories
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache

# Ownership (assuming www-data is web server user)
chown -R www-data:www-data backend/storage
chown -R www-data:www-data backend/bootstrap/cache
chown -R www-data:www-data public_html/storage
```

---

## ✅ Verification Steps

After setting environment variables:

```bash
# 1. Clear config cache
cd backend
php artisan config:clear

# 2. Check APP_URL
php artisan tinker
>>> config('app.url')
// Should output: "https://naqashthaheem.com"

>>> Storage::disk('public')->url('test.jpg')
// Should output: "https://naqashthaheem.com/storage/test.jpg"

# 3. Test file upload
curl -X POST "https://naqashthaheem.com/api/files" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.png"

# Check the response - path should be:
# "path": "uploads/1760411843_test.png"
# Full URL should be:
# "https://naqashthaheem.com/storage/uploads/1760411843_test.png"
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Images Still Show localhost URLs

**Cause:** Config cache not cleared after changing APP_URL

**Solution:**
```bash
cd backend
php artisan config:clear
php artisan config:cache
# Restart web server/PHP-FPM if needed
```

### Issue 2: 404 on Storage URLs

**Cause:** Symlink not created or broken

**Solution:**
```bash
cd backend
php artisan storage:link
# Or manually:
cd public_html
ln -sf ../backend/storage/app/public storage
```

### Issue 3: 403 Forbidden on Storage Files

**Cause:** Incorrect permissions

**Solution:**
```bash
chmod -R 775 backend/storage
chown -R www-data:www-data backend/storage
chown -R www-data:www-data public_html/storage
```

### Issue 4: Mixed Content (HTTP in HTTPS site)

**Cause:** APP_URL is http instead of https

**Solution:**
```bash
# Update .env
APP_URL=https://naqashthaheem.com  # NOT http!

# Clear cache
php artisan config:clear
php artisan config:cache
```

---

## 📝 Production Deployment Checklist

Before deploying:

- [ ] Set `APP_URL=https://naqashthaheem.com` in backend `.env`
- [ ] Set `VITE_API_URL=https://naqashthaheem.com/api` in frontend `.env`
- [ ] Update Google OAuth redirect URI to production URL
- [ ] Create storage symlink
- [ ] Set correct file permissions
- [ ] Test APP_URL in tinker
- [ ] Clear all caches
- [ ] Build frontend with production env
- [ ] Test file upload returns correct URLs

After deploying:

- [ ] Verify storage URLs use https://naqashthaheem.com
- [ ] Test image upload
- [ ] Test workflow file attachment
- [ ] Check email verification links
- [ ] Test Google OAuth flow

---

## 🎯 Quick Setup Script

```bash
#!/bin/bash

# Production environment setup script

echo "Setting up production environment..."

# 1. Backend .env
cd /home/username/naqashthaheem.com/backend
cp .env.example .env

# Update APP_URL (use sed or manually edit)
sed -i 's|APP_URL=.*|APP_URL=https://naqashthaheem.com|' .env
sed -i 's|APP_ENV=.*|APP_ENV=production|' .env
sed -i 's|APP_DEBUG=.*|APP_DEBUG=false|' .env

# Generate keys
php artisan key:generate
php artisan jwt:secret

# 2. Frontend .env
cd ../frontend
echo "VITE_API_URL=https://naqashthaheem.com/api" > .env
echo "VITE_APP_URL=https://naqashthaheem.com" >> .env

# 3. Create storage symlink
cd /home/username/naqashthaheem.com/public_html
ln -sf ../backend/storage/app/public storage

# 4. Set permissions
chmod -R 775 ../backend/storage
chmod -R 775 ../backend/bootstrap/cache

echo "✅ Environment setup complete!"
echo "⚠️  Remember to manually set database credentials and secrets!"
```

---

## 📊 Environment Summary

| Variable | Development | Production |
|----------|-------------|------------|
| **Backend APP_URL** | `http://localhost:8001` | `https://naqashthaheem.com` |
| **Frontend VITE_API_URL** | `http://localhost:8001/api` | `https://naqashthaheem.com/api` |
| **Google Redirect** | `http://localhost:8001/auth/google/callback` | `https://naqashthaheem.com/auth/google/callback` |
| **Storage URLs** | `http://localhost:8001/storage/...` | `https://naqashthaheem.com/storage/...` |

**All URLs will automatically use the correct domain based on APP_URL!** ✅

