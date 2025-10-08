# 🔄 Live Site Update Workflow

## Overview
This document explains how to manage updates to your live production site hosted on Namecheap while continuing to develop in your Cursor environment.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor IDE    │    │   GitHub Repo   │    │  Namecheap Host │
│  (Development)  │───▶│  (Version Ctrl) │───▶│  (Production)   │
│                 │    │                 │    │                 │
│ • Local changes │    │ • Code storage  │    │ • Live website  │
│ • Testing       │    │ • CI/CD         │    │ • User traffic  │
│ • Debugging     │    │ • Deployment    │    │ • Production DB │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Deployment Options

### Option 1: Manual Deployment (Recommended for Start)

**When to use:** Initial deployment, major updates, or when you want full control

**Steps:**
1. **Make changes in Cursor**
   ```bash
   # Develop your features
   # Test locally
   # Commit changes
   git add .
   git commit -m "Add new feature"
   git push origin main
   ```

2. **Deploy to production**
   ```bash
   # Run deployment script
   ./deploy.sh
   
   # Or manually:
   # 1. SSH into Namecheap server
   # 2. Pull latest code
   # 3. Install dependencies
   # 4. Build frontend
   # 5. Run migrations
   # 6. Clear caches
   ```

### Option 2: Automated Deployment (Advanced)

**When to use:** Regular updates, minor changes, or when you want streamlined process

**Setup:**
1. **Configure GitHub Actions** (see `.github/workflows/deploy.yml`)
2. **Set up SSH keys** on Namecheap server
3. **Configure secrets** in GitHub repository

**Process:**
1. Make changes in Cursor
2. Commit and push to GitHub
3. GitHub Actions automatically deploys to production

### Option 3: Git-Based Updates (Most Common)

**When to use:** Regular development workflow

**Steps:**
1. **Develop in Cursor**
   ```bash
   # Make your changes
   # Test locally
   git add .
   git commit -m "Update feature X"
   git push origin main
   ```

2. **Update production**
   ```bash
   # SSH into server
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
   
   # Copy built files to web root
   cp -r frontend/dist/* /path/to/web/root/
   ```

## 🔧 Development Workflow

### Daily Development Process

1. **Start development**
   ```bash
   # In Cursor terminal
   cd backend && php artisan serve --host=0.0.0.0 --port=8000
   cd frontend && npm start
   ```

2. **Make changes**
   - Edit code in Cursor
   - Test locally
   - Fix any issues

3. **Commit changes**
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   git push origin main
   ```

4. **Deploy to production** (when ready)
   ```bash
   ./update-live.sh
   ```

### Testing Before Deployment

**Local Testing:**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Email functionality works
- [ ] Database operations work
- [ ] Admin panel functions properly

**Staging Testing (if available):**
- [ ] Deploy to staging environment
- [ ] Test all user flows
- [ ] Verify email sending
- [ ] Check performance

## 🛠️ Tools & Commands

### Essential Commands

**Backend:**
```bash
# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan cache:clear

# Check status
php artisan about
```

**Frontend:**
```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Check build
ls -la dist/
```

**Database:**
```bash
# Backup database
pg_dump your_database > backup.sql

# Restore database
psql your_database < backup.sql

# Run migrations
php artisan migrate --force
```

### Useful Scripts

**Quick Update Script:**
```bash
#!/bin/bash
# Quick update for minor changes
git pull origin main
composer install --no-dev
cd frontend && npm ci && npm run build && cd ..
php artisan config:cache
echo "✅ Update complete!"
```

**Rollback Script:**
```bash
#!/bin/bash
# Rollback to previous version
git log --oneline -5
read -p "Enter commit hash to rollback to: " commit
git checkout $commit
composer install --no-dev
cd frontend && npm ci && npm run build && cd ..
php artisan config:cache
echo "✅ Rollback complete!"
```

## 🚨 Emergency Procedures

### Site Down - Quick Fix
1. **Check server status**
   ```bash
   ssh your-username@your-server-ip
   systemctl status apache2  # or nginx
   ```

2. **Check logs**
   ```bash
   tail -f /path/to/your/app/storage/logs/laravel.log
   ```

3. **Quick rollback**
   ```bash
   git checkout previous-working-commit
   composer install --no-dev
   php artisan config:cache
   ```

### Database Issues
1. **Check database connection**
   ```bash
   php artisan tinker
   DB::connection()->getPdo();
   ```

2. **Restore from backup**
   ```bash
   psql your_database < backup.sql
   ```

### Email Issues
1. **Check email configuration**
   ```bash
   php artisan tinker
   Mail::raw('Test', function($msg) { $msg->to('test@example.com'); });
   ```

2. **Check SMTP settings**
   - Verify credentials
   - Check port settings
   - Test with different providers

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Site is accessible
- [ ] No error logs
- [ ] Email sending works
- [ ] Database performance

### Weekly Checks
- [ ] Backup database
- [ ] Check disk space
- [ ] Review error logs
- [ ] Update dependencies

### Monthly Checks
- [ ] Security updates
- [ ] Performance optimization
- [ ] Backup verification
- [ ] SSL certificate status

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use different keys for production
   - Rotate secrets regularly

2. **File Permissions**
   ```bash
   chmod -R 755 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

3. **Database Security**
   - Use strong passwords
   - Limit database access
   - Regular backups

4. **Code Security**
   - Keep dependencies updated
   - Use HTTPS only
   - Implement proper authentication

## 📞 Support Resources

- **Namecheap Support**: For hosting issues
- **Laravel Documentation**: For framework help
- **GitHub Issues**: For code problems
- **Stack Overflow**: For technical questions

## 🎯 Pro Tips

1. **Use feature flags** for gradual rollouts
2. **Test in staging** before production
3. **Keep backups** of everything
4. **Monitor performance** regularly
5. **Document changes** for team members

---

**Remember**: Always test changes locally before deploying to production!

