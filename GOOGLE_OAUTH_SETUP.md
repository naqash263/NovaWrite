# 🔐 Google OAuth Setup Guide

## 🐛 Current Issue

**Symptom:**
- Google login button doesn't work
- Getting errors about missing client_id or client_secret
- OAuth redirect fails

**Root Cause:**
Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) are not configured on the production server.

---

## ✅ Solution

### **Step 1: Get Google OAuth Credentials**

If you don't have Google OAuth credentials yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if not done already
6. For Application type, select **Web application**
7. Add Authorized redirect URIs:
   - `https://naqashthaheem.com/auth/google/callback`
   - `http://localhost:8001/auth/google/callback` (for local testing)
8. Copy your **Client ID** and **Client Secret**

---

### **Step 2: Update Production .env File**

SSH to your production server and update the `.env` file:

```bash
# SSH to production server
ssh your-server

# Navigate to backend directory
cd /home/timesovh/naqashthaheem.com/backend

# Edit .env file
nano .env
# OR
vi .env
```

**Add or update these lines:**

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback
```

**Example:**
```bash
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YourSecretKeyHere
GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback
```

**Save and exit** (Ctrl+X, then Y, then Enter for nano)

---

### **Step 3: Clear Config Cache**

After updating `.env`, clear Laravel's config cache:

```bash
cd /home/timesovh/naqashthaheem.com/backend

# Clear config cache
php artisan config:clear

# Rebuild config cache
php artisan config:cache

# Verify the config is loaded
php artisan tinker --execute="echo config('services.google.client_id');"
# Should output your client ID

php artisan tinker --execute="echo config('services.google.redirect');"
# Should output: https://naqashthaheem.com/auth/google/callback
```

---

### **Step 4: Restart Services**

```bash
# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# OR restart web server
/scripts/restartsrv_httpd
```

---

### **Step 5: Update Google Cloud Console**

Make sure your Google OAuth credentials have the correct redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure you have:
   - `https://naqashthaheem.com/auth/google/callback`
5. Save changes

---

## 🔧 For GitHub Actions Automation

To automate this in future deployments, add to `.github/workflows/deploy.yml`:

```yaml
- name: Configure Google OAuth
  run: |
    ssh ${{ secrets.USERNAME }}@${{ secrets.HOST }} << 'EOF'
      cd ~/naqashthaheem.com/backend
      
      # Update Google OAuth settings if not already set
      if ! grep -q "^GOOGLE_CLIENT_ID=" .env; then
        echo "GOOGLE_CLIENT_ID=${{ secrets.GOOGLE_CLIENT_ID }}" >> .env
      else
        sed -i 's|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=${{ secrets.GOOGLE_CLIENT_ID }}|' .env
      fi
      
      if ! grep -q "^GOOGLE_CLIENT_SECRET=" .env; then
        echo "GOOGLE_CLIENT_SECRET=${{ secrets.GOOGLE_CLIENT_SECRET }}" >> .env
      else
        sed -i 's|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=${{ secrets.GOOGLE_CLIENT_SECRET }}|' .env
      fi
      
      if ! grep -q "^GOOGLE_REDIRECT_URI=" .env; then
        echo "GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback" >> .env
      else
        sed -i 's|^GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback|' .env
      fi
      
      # Clear and rebuild config cache
      php artisan config:clear
      php artisan config:cache
    EOF
```

**Then add GitHub Secrets:**
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add new repository secrets:
   - `GOOGLE_CLIENT_ID` = your Google client ID
   - `GOOGLE_CLIENT_SECRET` = your Google client secret

---

## 🧪 Testing

### **Test Locally:**

1. **Check Backend Config:**
```bash
cd backend
php artisan tinker
>>> config('services.google.client_id')
# Should output your client ID

>>> config('services.google.redirect')
# Should output: http://localhost:8001/auth/google/callback (locally)
```

2. **Test Frontend:**
   - Go to: http://localhost:3000/login
   - Click "Sign in with Google"
   - Should redirect to Google OAuth page
   - After authorizing, should redirect back to your app

### **Test on Production:**

1. **Check Backend Config:**
```bash
ssh your-server
cd /home/timesovh/naqashthaheem.com/backend
php artisan tinker --execute="echo config('services.google.client_id');"
# Should output your client ID

php artisan tinker --execute="echo config('services.google.redirect');"
# Should output: https://naqashthaheem.com/auth/google/callback
```

2. **Test API Endpoint:**
```bash
# Test the Google URL endpoint
curl -H "Accept: application/json" \
  https://naqashthaheem.com/api/auth/google/url

# Should return JSON with:
# {
#   "url": "https://accounts.google.com/o/oauth2/auth?client_id=...",
#   "state": "..."
# }
```

3. **Test in Browser:**
   - Go to: https://naqashthaheem.com/login
   - Open browser console (F12)
   - Click "Sign in with Google"
   - Check console for any errors
   - Should redirect to Google OAuth page
   - After authorizing, should redirect back and log you in

---

## 🚨 Common Issues

### **Issue 1: "redirect_uri_mismatch" Error**

**Error Message:**
```
Error 400: redirect_uri_mismatch
The redirect URI in the request: https://naqashthaheem.com/auth/google/callback
does not match the ones authorized for the OAuth client.
```

**Solution:**
1. Go to Google Cloud Console
2. Update Authorized redirect URIs to include: `https://naqashthaheem.com/auth/google/callback`
3. Save and wait a few minutes for changes to propagate

---

### **Issue 2: Client ID is null or undefined**

**Error in console:**
```
client_id: null
```

**Solution:**
```bash
# Check if environment variables are set
grep "^GOOGLE_" /home/timesovh/naqashthaheem.com/backend/.env

# If missing, add them
echo "GOOGLE_CLIENT_ID=your-id-here" >> .env
echo "GOOGLE_CLIENT_SECRET=your-secret-here" >> .env
echo "GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback" >> .env

# Clear and rebuild config
php artisan config:clear
php artisan config:cache
```

---

### **Issue 3: "Invalid client" Error**

**Error Message:**
```
Error: invalid_client
The OAuth client was not found.
```

**Solution:**
- Double-check your `GOOGLE_CLIENT_ID` matches exactly what's in Google Cloud Console
- Make sure there are no extra spaces or line breaks
- Verify the credentials are for the correct Google Cloud project

---

### **Issue 4: Frontend Shows "Failed to initialize Google login"**

**Check Backend Logs:**
```bash
tail -50 /home/timesovh/naqashthaheem.com/backend/storage/logs/laravel.log | grep -i google
```

**Common causes:**
- Config cache not cleared
- Environment variables not set
- Wrong redirect URI

---

## 📋 Environment Variables Summary

### **Local Development** (`.env`):
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8001/auth/google/callback
```

### **Production** (`.env`):
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback
```

### **Google Cloud Console** (Authorized redirect URIs):
```
https://naqashthaheem.com/auth/google/callback
http://localhost:8001/auth/google/callback
```

---

## 🔒 Security Notes

1. **Never commit credentials to Git:**
   - ✅ `.env` is in `.gitignore`
   - ✅ Use GitHub Secrets for CI/CD

2. **Use different credentials for production and development:**
   - Recommended but optional
   - Helps with security and debugging

3. **Restrict OAuth consent screen:**
   - In Google Cloud Console, configure who can use your OAuth app
   - For production, you might want to verify your app with Google

---

## 📊 Verification Checklist

After setup, verify:

- [ ] `GOOGLE_CLIENT_ID` set in production `.env`
- [ ] `GOOGLE_CLIENT_SECRET` set in production `.env`
- [ ] `GOOGLE_REDIRECT_URI` set to `https://naqashthaheem.com/auth/google/callback`
- [ ] Config cache cleared and rebuilt
- [ ] PHP-FPM restarted
- [ ] Google Cloud Console has correct redirect URI
- [ ] API endpoint `/api/auth/google/url` returns valid URL
- [ ] Frontend Google login button works
- [ ] Can successfully log in with Google account
- [ ] User created in database with `google_id`
- [ ] JWT token returned and stored

---

## 🎯 Quick Fix Commands

```bash
# SSH to production
ssh your-server

# Navigate to backend
cd /home/timesovh/naqashthaheem.com/backend

# Add Google OAuth credentials (replace with your actual values)
echo "GOOGLE_CLIENT_ID=your-client-id-here" >> .env
echo "GOOGLE_CLIENT_SECRET=your-secret-here" >> .env
echo "GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback" >> .env

# Clear and rebuild config
php artisan config:clear && php artisan config:cache

# Restart services
sudo systemctl restart php8.2-fpm

# Verify
php artisan tinker --execute="echo 'Client ID: ' . config('services.google.client_id') . PHP_EOL; echo 'Redirect: ' . config('services.google.redirect') . PHP_EOL;"
```

---

## 🎉 Success Indicators

**Everything is working when:**

- ✅ `/api/auth/google/url` returns URL with client_id
- ✅ Google login button redirects to Google OAuth page
- ✅ After authorizing, redirects back to your app
- ✅ User is logged in successfully
- ✅ No errors in browser console
- ✅ No errors in Laravel logs

---

**Follow these steps and your Google OAuth will be fully functional!** 🚀
