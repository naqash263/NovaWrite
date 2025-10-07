# 🔄 Development Workflow - Step by Step

## 🎯 **Your Current Setup**
- ✅ Git repository initialized
- ✅ GitHub repository connected
- ✅ All changes committed and pushed
- ✅ Deployment scripts ready

## 🚀 **Daily Development Process**

### **Step 1: Start Development**
```bash
# In Cursor terminal - Backend
cd backend
php artisan serve --host=0.0.0.0 --port=8000

# In Cursor terminal - Frontend (new terminal)
cd frontend
npm start
```

### **Step 2: Make Changes**
- Edit files in Cursor
- Test your changes locally
- Fix any issues

### **Step 3: Quick Update (Recommended)**
```bash
# Run this script from project root
./quick-update.sh
```

**What this script does:**
1. Checks for uncommitted changes
2. Asks for commit message
3. Commits and pushes to GitHub
4. Shows you the next steps for production

### **Step 4: Update Production (Manual)**
```bash
# SSH into your Namecheap server
ssh your-username@your-server-ip

# Navigate to app directory
cd /path/to/your/app

# Pull latest changes
git pull origin main

# Update backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Update frontend
cd frontend
npm ci
npm run build
cd ..

# Copy to web root
cp -r frontend/dist/* /path/to/web/root/
```

## 🔧 **Alternative: Manual Git Commands**

If you prefer manual control:

```bash
# 1. Add changes
git add .

# 2. Commit with message
git commit -m "Add new feature"

# 3. Push to GitHub
git push origin main

# 4. Update production (SSH into server)
git pull origin main
composer install --no-dev
cd frontend && npm ci && npm run build
php artisan config:cache
```

## 📁 **File Organization**

### **Always Commit These:**
- ✅ Source code changes
- ✅ Configuration updates
- ✅ Documentation changes
- ✅ New features and fixes

### **Never Commit These:**
- ❌ `.env` files (contain secrets)
- ❌ `node_modules/` (can be reinstalled)
- ❌ `vendor/` (can be reinstalled)
- ❌ Log files
- ❌ Cache files

## 🚨 **Emergency Procedures**

### **If Something Goes Wrong:**
```bash
# 1. Check what went wrong
git log --oneline -5

# 2. Rollback to previous commit
git checkout previous-commit-hash

# 3. Force push (be careful!)
git push origin main --force
```

### **If Production Site is Down:**
1. SSH into server
2. Check logs: `tail -f storage/logs/laravel.log`
3. Rollback: `git checkout previous-working-commit`
4. Restart services

## 💡 **Pro Tips**

1. **Always test locally first**
2. **Write descriptive commit messages**
3. **Keep production backups**
4. **Monitor your live site after updates**
5. **Use the quick-update script for speed**

## 📞 **Need Help?**

- **Git Issues**: Check `git status` and `git log`
- **Deployment Issues**: Check server logs
- **Code Issues**: Test locally first
- **Database Issues**: Check migrations

---

**Remember**: The `./quick-update.sh` script is your best friend for daily updates! 🚀
