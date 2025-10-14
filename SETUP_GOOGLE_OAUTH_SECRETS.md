# 🔐 Setup Google OAuth with GitHub Secrets

## Overview

Google OAuth credentials are stored securely as GitHub Secrets and automatically deployed to production.

---

## 🚀 Quick Setup

### **Step 1: Add GitHub Secrets**

1. **Go to GitHub Repository Settings:**
   - Navigate to: `https://github.com/YOUR_USERNAME/NovaWrite/settings/secrets/actions`
   - Or: Repository → Settings → Secrets and variables → Actions

2. **Add These Two Secrets:**

   **Secret #1:**
   - Name: `GOOGLE_CLIENT_ID`
   - Value: Your Google OAuth Client ID (from Google Cloud Console)
   - Format: `xxxxxxxxx-yyyyyyyy.apps.googleusercontent.com`

   **Secret #2:**
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: Your Google OAuth Client Secret (from Google Cloud Console)
   - Format: `GOCSPX-xxxxxxxxxxxxx`

---

### **Step 2: Get Google OAuth Credentials**

If you don't have Google OAuth credentials yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Application type: **Web application**
7. Add Authorized redirect URI: `https://naqashthaheem.com/auth/google/callback`
8. Copy your **Client ID** and **Client Secret**

---

### **Step 3: Verify & Deploy**

After adding GitHub Secrets:

1. **Push any change to `main` branch**
2. **GitHub Actions will automatically:**
   - ✅ Configure `GOOGLE_CLIENT_ID` in production `.env`
   - ✅ Configure `GOOGLE_CLIENT_SECRET` in production `.env`
   - ✅ Set `GOOGLE_REDIRECT_URI` to production URL
   - ✅ Clear and rebuild Laravel config cache
   - ✅ Enable Google Sign-In functionality

---

## 🧪 Testing

### **Test Locally (Development):**

1. Add to `backend/.env`:
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8001/auth/google/callback
```

2. Clear config cache:
```bash
cd backend
php artisan config:clear
php artisan config:cache
```

3. Test:
   - Go to: `http://localhost:3000/login`
   - Click "Sign in with Google"
   - Should redirect to Google OAuth page

### **Test Production:**

1. **After deployment, verify API endpoint:**
```bash
curl https://naqashthaheem.com/api/auth/google/url
```

2. **Should return JSON with Google OAuth URL:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/auth?client_id=...",
  "state": "..."
}
```

3. **Test in browser:**
   - Go to: `https://naqashthaheem.com/login`
   - Click "Sign in with Google"
   - Should redirect to Google, then back after auth

---

## 🔍 Troubleshooting

### **Issue: "redirect_uri_mismatch"**

**Solution:**
- In Google Cloud Console, add: `https://naqashthaheem.com/auth/google/callback`
- Make sure there are no typos or extra spaces

### **Issue: "Client ID is null"**

**Solution:**
1. Verify GitHub Secrets are set correctly
2. Re-deploy by pushing a change
3. SSH to server and check:
```bash
cd /home/timesovh/naqashthaheem.com/backend
grep "^GOOGLE_" .env
php artisan config:clear && php artisan config:cache
```

### **Issue: "Invalid client"**

**Solution:**
- Double-check Client ID matches Google Cloud Console exactly
- Verify you're using the correct Google Cloud project

---

## 📋 Current GitHub Secrets

Your repository should have these secrets:

- ✅ `HOST` - SSH host
- ✅ `USERNAME` - SSH username
- ✅ `SSH_KEY` - SSH private key
- ✅ `SSH_PASSPHRASE` - SSH key passphrase
- ✅ `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- ✅ `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret

---

## 🎯 How It Works

1. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
   - Uses `${{ secrets.GOOGLE_CLIENT_ID }}` and `${{ secrets.GOOGLE_CLIENT_SECRET }}`
   - Writes to production `.env` file during deployment
   - Automatically sets production redirect URI

2. **Laravel Backend** (`config/services.php`):
   - Reads from `.env` file
   - Uses for Google OAuth API calls

3. **Frontend** (`src/components/GoogleLoginButton.tsx`):
   - Calls `/api/auth/google/url`
   - Redirects user to Google OAuth page

---

## ✅ Success Checklist

After setup, verify:

- [ ] GitHub Secrets added: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Google Cloud Console has correct redirect URI
- [ ] Pushed code to trigger deployment
- [ ] Deployment completed successfully (green checkmark)
- [ ] API endpoint `/api/auth/google/url` returns valid URL
- [ ] Google login button works on `https://naqashthaheem.com/login`
- [ ] Can successfully authenticate with Google
- [ ] User created in database with `google_id`

---

## 🔒 Security Notes

- ✅ Credentials stored as GitHub Secrets (encrypted)
- ✅ Never committed to repository
- ✅ Only accessible in GitHub Actions during deployment
- ✅ Production `.env` not in version control
- ✅ Secrets not exposed in logs or frontend

---

**For detailed setup instructions, see: `GOOGLE_OAUTH_SETUP.md`**

**The deployment workflow automatically handles everything!** 🚀

