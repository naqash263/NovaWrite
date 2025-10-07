# Namecheap Deployment Fix Guide

## 🚨 **Issue:** Permission denied error when running migrations

The error occurs because Laravel is trying to access storage directories that don't exist or have wrong permissions.

## 🔧 **Quick Fix - Run these commands on your Namecheap server:**

### **Step 1: Navigate to your API directory**
```bash
cd naqashthaheem.com/api
```

### **Step 2: Create storage directories**
```bash
mkdir -p storage/logs
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/app/public
```

### **Step 3: Set proper permissions**
```bash
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

### **Step 4: Clear Laravel caches**
```bash
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### **Step 5: Generate application key**
```bash
php artisan key:generate --force
```

### **Step 6: Run migrations**
```bash
php artisan migrate --force
```

### **Step 7: Seed database**
```bash
php artisan db:seed --force
```

### **Step 8: Optimize for production**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### **Step 9: Create storage link**
```bash
php artisan storage:link
```

## 🎯 **Alternative: Use the Fix Script**

I've created a fix script for you. Upload `fix-namecheap-deployment.sh` to your server and run:

```bash
chmod +x fix-namecheap-deployment.sh
./fix-namecheap-deployment.sh
```

## 🔍 **If you still have issues:**

### **Check error logs:**
```bash
tail -f storage/logs/laravel.log
```

### **Check file permissions:**
```bash
ls -la storage/
ls -la bootstrap/cache/
```

### **Verify .env file:**
```bash
cat .env | grep APP_KEY
cat .env | grep DB_
```

## ✅ **After fixing, test your application:**

1. **Frontend:** https://naqashthaheem.com
2. **API:** https://naqashthaheem.com/api
3. **Test script:** https://naqashthaheem.com/test-deployment.php

## 🆘 **Need Help?**

If you're still having issues, check:
- File permissions (should be 755 for directories, 644 for files)
- Storage directory exists and is writable
- .env file has correct database credentials
- PHP version is 8.1 or higher
- All required PHP extensions are installed
