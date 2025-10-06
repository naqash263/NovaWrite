# GitHub Setup & Live Site Management Guide

This guide will help you set up GitHub for your NovaWrite project and manage updates to your live Namecheap site.

## 🚀 Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface
1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `NovaWrite`
3. Description: `AI-Powered Content Management Platform`
4. Set to **Public** or **Private** (your choice)
5. **Don't** initialize with README, .gitignore, or license (we already have them)
6. Click "Create repository"

### Option B: Using GitHub CLI (if installed)
```bash
gh repo create NovaWrite --public --description "AI-Powered Content Management Platform"
```

## 🔗 Step 2: Connect Local Repository to GitHub

### Add Remote Origin
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/NovaWrite.git

# Or if you prefer SSH (recommended for frequent pushes)
git remote add origin git@github.com:YOUR_USERNAME/NovaWrite.git
```

### Push Your Code
```bash
# Push to GitHub and set upstream
git push -u origin main
```

## 🔄 Step 3: Daily Development Workflow

### Making Changes in Cursor
1. **Make your changes** in Cursor
2. **Test locally** (frontend: `npm run dev`, backend: `php artisan serve`)
3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
4. **Push to GitHub**:
   ```bash
   git push origin main
   ```

### Example Workflow
```bash
# 1. Make changes to your code
# 2. Test locally
# 3. Stage changes
git add .

# 4. Commit with descriptive message
git commit -m "Add new email template for course completion"

# 5. Push to GitHub
git push origin main
```

## 🌐 Step 4: Deploy to Live Site (Namecheap)

### Initial Deployment
```bash
# Run the initial deployment script
./deploy.sh
```

### Regular Updates
```bash
# For regular updates after initial deployment
./update-live.sh
```

### Manual Deployment Steps
1. **SSH into your Namecheap server**
2. **Navigate to your project directory**
3. **Pull latest changes**:
   ```bash
   git pull origin main
   ```
4. **Update dependencies**:
   ```bash
   # Backend
   composer install --no-dev --optimize-autoloader
   
   # Frontend
   npm install
   npm run build
   ```
5. **Run migrations**:
   ```bash
   php artisan migrate --force
   ```
6. **Clear caches**:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

## 🤖 Step 5: Set Up GitHub Actions (CI/CD)

### Enable GitHub Actions
1. Go to your GitHub repository
2. Click on "Actions" tab
3. Click "I understand my workflows, go ahead and enable them"

### Configure Deployment (Optional)
The `.github/workflows/deploy.yml` file is already configured. You can customize it for your Namecheap hosting.

## 📋 Step 6: Branch Strategy (Recommended)

### Main Branch Workflow
- `main` branch: Production-ready code
- `develop` branch: Development features
- Feature branches: `feature/feature-name`

### Creating Feature Branches
```bash
# Create and switch to feature branch
git checkout -b feature/new-email-template

# Make changes, commit, and push
git add .
git commit -m "Add new email template"
git push origin feature/new-email-template

# Create Pull Request on GitHub
# After review, merge to main
```

## 🔧 Step 7: Environment Management

### Development (Local)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Database: Local PostgreSQL

### Production (Namecheap)
- Frontend: `https://naqashthaheem.com`
- Backend: `https://naqashthaheem.com/api`
- Database: Namecheap PostgreSQL

### Environment Files
- **Development**: `.env` (local settings)
- **Production**: `.env.production` (live site settings)

## 🚨 Step 8: Emergency Procedures

### Rollback Changes
```bash
# View commit history
git log --oneline

# Rollback to previous commit
git reset --hard HEAD~1
git push --force origin main

# Deploy rollback to live site
./update-live.sh
```

### Database Issues
```bash
# Backup database before major changes
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup if needed
psql your_database < backup_file.sql
```

## 📊 Step 9: Monitoring & Maintenance

### Check Application Status
```bash
# Check if services are running
ps aux | grep "php artisan serve"
ps aux | grep "node"

# Check logs
tail -f storage/logs/laravel.log
```

### Performance Monitoring
- Monitor server resources (CPU, Memory, Disk)
- Check database performance
- Monitor email delivery rates
- Track user registrations and activity

## 🔐 Step 10: Security Best Practices

### Regular Updates
```bash
# Update dependencies regularly
composer update
npm update

# Check for security vulnerabilities
composer audit
npm audit
```

### Backup Strategy
- **Code**: GitHub repository (automatic)
- **Database**: Regular automated backups
- **Files**: Regular file system backups
- **Configuration**: Document all environment variables

## 📞 Step 11: Troubleshooting

### Common Issues

#### Git Push Rejected
```bash
# Pull latest changes first
git pull origin main
# Then push
git push origin main
```

#### Deployment Fails
```bash
# Check logs
tail -f storage/logs/laravel.log

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

#### Email Not Sending
1. Check SMTP configuration in admin panel
2. Verify email credentials
3. Check server mail logs
4. Test with different email providers

## 🎯 Quick Reference Commands

### Git Commands
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline
```

### Laravel Commands
```bash
# Run migrations
php artisan migrate

# Clear caches
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Generate app key
php artisan key:generate

# Create admin user
php artisan make:admin-user
```

### Frontend Commands
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Documentation](https://docs.github.com/)
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev/)
- [Namecheap Hosting Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-access-my-hosting-account)

---

**Need Help?** Check the other documentation files in this project or contact support at contact@naqashthaheem.com
