# 🚀 Deployment Guide for Namecheap Hosting

## Overview
This guide explains how to deploy your NovaWrite application to Namecheap hosting and manage updates from your Cursor development environment.

## 📁 Environment Setup

### 1. Development Environment (Current - Cursor)
- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`
- **Database**: Local PostgreSQL/SQLite
- **Environment**: `.env` (local development)

### 2. Production Environment (Namecheap)
- **Backend**: `https://naqashthaheem.com/api`
- **Frontend**: `https://naqashthaheem.com`
- **Database**: Production PostgreSQL
- **Environment**: `.env.production`

## 🔧 Production Environment Configuration

### Backend (.env.production)
```env
APP_NAME="Naqash Thaheem"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://naqashthaheem.com

# Database
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=naqashthaheem_production
DB_USERNAME=naqashthaheem
DB_PASSWORD=your_production_db_password

# Email
MAIL_MAILER=smtp
MAIL_HOST=mail.naqashthaheem.com
MAIL_PORT=587
MAIL_USERNAME=contsct@naqashthaheem.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS="contact@naqashthaheem.com"
MAIL_FROM_NAME="Naqash Thaheem"

# Security
SESSION_ENCRYPT=true
SESSION_DOMAIN=naqashthaheem.com
LOG_LEVEL=error
```

### Frontend (vite.config.ts production)
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/', // or '/subfolder/' if not in root
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://naqashthaheem.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
```

## 🚀 Deployment Process

### Option 1: Manual Deployment (Recommended for Start)

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload Files to Namecheap**
   - Upload `frontend/dist/*` to `public_html/`
   - Upload `backend/*` to `public_html/api/` (or subdomain)

3. **Set Up Database**
   - Create PostgreSQL database on Namecheap
   - Run migrations: `php artisan migrate --env=production`

4. **Configure Web Server**
   - Set up Apache/Nginx virtual host
   - Point domain to Laravel public folder

### Option 2: Git-Based Deployment (Advanced)

1. **Set up Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/novawrite.git
   git push -u origin main
   ```

2. **Namecheap Server Setup**
   ```bash
   # On Namecheap server
   git clone https://github.com/yourusername/novawrite.git
   cd novawrite
   composer install --no-dev --optimize-autoloader
   npm install && npm run build
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

## 🔄 Update Management Workflow

### Development to Production Updates

1. **Make Changes in Cursor**
   - Develop features locally
   - Test thoroughly
   - Commit changes to Git

2. **Deploy to Production**
   ```bash
   # Option A: Manual
   git pull origin main
   composer install --no-dev
   npm run build
   php artisan migrate --force
   php artisan config:cache

   # Option B: Automated (with webhook)
   # Set up GitHub Actions or webhook for auto-deployment
   ```

3. **Database Updates**
   ```bash
   php artisan migrate --force
   php artisan db:seed --force  # if needed
   ```

## 🛠️ Recommended Tools & Services

### 1. Version Control
- **GitHub**: Store your code
- **GitHub Actions**: Automated deployment
- **Git Flow**: Branch management

### 2. Deployment Tools
- **Deployer**: PHP deployment tool
- **Laravel Forge**: Server management
- **Envoyer**: Zero-downtime deployment

### 3. Monitoring
- **Laravel Telescope**: Debug and monitor
- **Sentry**: Error tracking
- **New Relic**: Performance monitoring

## 📋 Pre-Deployment Checklist

### Backend
- [ ] Update `.env.production` with correct values
- [ ] Set `APP_DEBUG=false`
- [ ] Configure production database
- [ ] Set up email configuration
- [ ] Run `php artisan config:cache`
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan view:cache`

### Frontend
- [ ] Update API endpoints to production URLs
- [ ] Build production assets: `npm run build`
- [ ] Test all functionality
- [ ] Optimize images and assets

### Database
- [ ] Create production database
- [ ] Run migrations: `php artisan migrate`
- [ ] Seed initial data: `php artisan db:seed`
- [ ] Set up database backups

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use different keys for production
   - Enable encryption for sensitive data

2. **File Permissions**
   ```bash
   chmod -R 755 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

3. **SSL Certificate**
   - Enable HTTPS
   - Force HTTPS redirects
   - Update mixed content issues

## 🚨 Emergency Procedures

### Rollback Process
```bash
# Revert to previous version
git checkout previous-commit-hash
composer install --no-dev
npm run build
php artisan config:cache
```

### Database Rollback
```bash
php artisan migrate:rollback --step=1
```

## 📞 Support Resources

- **Namecheap Support**: For hosting issues
- **Laravel Documentation**: For framework issues
- **GitHub Issues**: For code-related problems

## 🎯 Next Steps

1. Set up your Namecheap hosting account
2. Configure domain and SSL
3. Set up production database
4. Deploy initial version
5. Set up monitoring and backups
6. Implement automated deployment

---

**Remember**: Always test changes in a staging environment before deploying to production!