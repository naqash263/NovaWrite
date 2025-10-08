# 🚀 Namecheap cPanel Git Deployment Guide

## 🎯 **Overview**
Namecheap cPanel has built-in Git version control, making deployment much easier! This guide shows you how to set up automated deployment from your GitHub repository.

## 📋 **Step 1: Set Up Git in cPanel**

### **In Namecheap cPanel:**
1. **Login to cPanel**
2. **Find "Git Version Control"** (usually in Files section)
3. **Click "Create"** to create a new repository
4. **Repository Name**: `novawrite`
5. **Repository Path**: `/naqashthaheem.com`
6. **Clone URL**: `https://github.com/naqash263/NovaWrite.git`
7. **Click "Create"**

## 🔧 **Step 2: Configure Repository**

### **After creating the repository:**
1. **Go to your repository** in cPanel Git
2. **Click "Manage"** next to your repository
3. **Set up the following:**

**Repository Settings:**
- **Remote Origin**: `https://github.com/naqash263/NovaWrite.git`
- **Branch**: `main`
- **Auto Deploy**: ✅ **Enable this!**

## 🚀 **Step 3: Set Up Auto-Deployment**

### **Option A: Webhook Auto-Deploy (Recommended)**

1. **In cPanel Git, enable "Auto Deploy"**
2. **Copy the webhook URL** provided by cPanel
3. **Go to your GitHub repository**
4. **Settings → Webhooks → Add webhook**
5. **Paste the webhook URL**
6. **Select "Just the push event"**
7. **Save webhook**

### **Option B: Manual Pull (Backup method)**

If auto-deploy doesn't work, you can manually pull:

1. **SSH into your server** (if available)
2. **Or use cPanel Terminal**
3. **Navigate to your repository**:
   ```bash
   cd /naqashthaheem.com
   git pull origin main
   ```

## 📁 **Step 4: Configure File Structure**

### **Your cPanel file structure should be:**
```
/naqashthaheem.com/
├── backend/          # Laravel backend
├── frontend/         # React frontend
├── public_html/      # Web root (where built files go)
└── .git/            # Git repository
```

### **Set up the deployment process:**
1. **Backend files** go to `/naqashthaheem.com/backend/`
2. **Frontend build** goes to `/naqashthaheem.com/public_html/`
3. **Laravel public** files go to `/naqashthaheem.com/public_html/`

## 🔄 **Step 5: Create Deployment Script**

Create a `deploy.sh` script in your repository root:

```bash
#!/bin/bash
# cPanel Deployment Script

echo "🚀 Starting cPanel deployment..."

# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Copy frontend build to public_html
cp -r frontend/dist/* public_html/

# Copy Laravel public files
cp -r backend/public/* public_html/

# Set up Laravel environment
cd backend
cp .env.production .env
php artisan config:cache
php artisan route:cache
php artisan view:cache
cd ..

echo "✅ Deployment complete!"
```

## 🎯 **Step 6: Update Your Workflow**

### **Now your workflow becomes:**

1. **Develop in Cursor** (localhost)
2. **Test your changes**
3. **Run quick update**:
   ```bash
   ./quick-update.sh
   ```
4. **cPanel automatically pulls** from GitHub
5. **Deployment script runs** (if configured)
6. **Your live site updates!**

## 🔧 **Step 7: Environment Configuration**

### **Create `.env.production` in your repository:**
```env
APP_NAME="Naqash Thaheem"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://naqashthaheem.com

# Database (use cPanel database credentials)
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_DATABASE=naqashthaheem_production
DB_USERNAME=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password

# Email (use cPanel email settings)
MAIL_MAILER=smtp
MAIL_HOST=mail.naqashthaheem.com
MAIL_PORT=587
MAIL_USERNAME=contact@naqashthaheem.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS="contact@naqashthaheem.com"
MAIL_FROM_NAME="Naqash Thaheem"
```

## 🚨 **Troubleshooting**

### **If auto-deploy doesn't work:**
1. **Check webhook URL** in GitHub
2. **Verify repository path** in cPanel
3. **Check file permissions**
4. **Use manual pull** as backup

### **If files don't update:**
1. **Check Git status** in cPanel
2. **Verify branch** is set to `main`
3. **Check deployment script** permissions
4. **Review error logs**

## 💡 **Pro Tips**

1. **Always test locally first**
2. **Keep `.env.production` in your repository**
3. **Use descriptive commit messages**
4. **Monitor your live site after updates**
5. **Keep backups of important files**

## 🎉 **Benefits of cPanel Git**

- ✅ **Automatic deployment** from GitHub
- ✅ **No SSH required** (usually)
- ✅ **Easy to manage** through cPanel interface
- ✅ **Version control** built-in
- ✅ **Rollback capability** if needed

---

**Your workflow is now: Code in Cursor → Push to GitHub → Auto-deploy to cPanel → Live site updates!** 🚀

