# 🚀 Production Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Database Migrations Summary

All migrations have been created properly and are ready for production deployment. Here's the complete list of new migrations:

#### **Core Functionality Migrations:**

1. **`2025_10_13_000001_add_sort_order_to_home_settings_table.php`**
   - Adds `sort_order` column to `home_settings`

2. **`2025_10_13_000002_add_is_published_to_posts_and_workflows.php`**
   - Adds `is_published` and `published_at` to `posts`
   - Adds `is_featured` to `workflows`

3. **`2025_10_13_000003_add_missing_columns_to_home_settings.php`**
   - Adds `type`, `title`, `description`, `is_active` to `home_settings`

4. **`2025_10_13_000004_rename_abilities_to_permissions_in_api_tokens.php`**
   - Renames `abilities` to `permissions` in `api_tokens`

5. **`2025_10_13_000005_add_missing_columns_to_smtp_configurations.php`**
   - Adds multiple columns to `smtp_configurations`

6. **`2025_10_13_000006_add_missing_columns_to_cv_templates.php`**
   - Adds multiple columns to `cv_templates`

7. **`2025_10_13_000007_make_cv_templates_columns_nullable.php`**
   - Makes certain columns nullable in `cv_templates`

8. **`2025_10_13_000008_add_published_at_to_workflows.php`**
   - Adds `published_at` to `workflows`

9. **`2025_10_13_000009_add_order_and_published_columns.php`**
   - Adds `order` to `courses`
   - Adds `published_at` to `workflows`

10. **`2025_10_13_000010_add_meta_fields_to_posts.php`**
    - Adds `meta_description` and `meta_keywords` to `posts`

11. **`2025_10_13_000011_add_missing_workflow_columns.php`**
    - Renames `category_id` to `workflow_category_id`
    - Adds `summary`, `tools`, `benefits`, `created_by`, `updated_by` to `workflows`

12. **`2025_10_13_000012_add_remaining_missing_columns.php`**
    - Adds `views` to `posts`
    - Adds `order` to `courses`
    - Adds `published_at` to `workflows`

13. **`2025_10_13_000013_make_workflows_instructions_nullable.php`**
    - Makes `instructions` nullable in `workflows`

14. **`2025_10_13_000014_add_missing_courses_columns.php`**
    - Adds `image_url`, `what_you_learn` to `courses`

15. **`2025_10_13_000015_add_duration_and_level_to_courses.php`**
    - Adds `duration_hours`, `level` to `courses`

16. **`2025_10_13_000016_add_is_public_to_files.php`**
    - Adds `is_public` to `files`

17. **`2025_10_13_000017_add_missing_columns_to_workflow_files.php`**
    - Adds `display_name`, `description`, `sort_order` to `workflow_files`

18. **`2025_10_14_000001_make_user_id_nullable_in_workflows.php`**
    - Makes `user_id` nullable in `workflows`

19. **`2025_10_14_000002_make_content_and_user_id_nullable_in_courses.php`**
    - Makes `content` and `user_id` nullable in `courses`

---

## 🔍 Migration Testing

### Test on Local/Staging First:

```bash
# 1. Check migration status
php artisan migrate:status

# 2. Run migrations (dry run if possible)
php artisan migrate --pretend

# 3. Actually run migrations
php artisan migrate

# 4. If issues, rollback last batch
php artisan migrate:rollback

# 5. Check all tables
php artisan tinker
>>> Schema::getColumnListing('workflows');
>>> Schema::getColumnListing('courses');
>>> Schema::getColumnListing('files');
>>> Schema::getColumnListing('workflow_files');
```

---

## 🚀 Production Deployment Steps

### Step 1: Backup Everything

```bash
# Backup database
pg_dump -U postgres -h localhost novawrite_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup files
tar -czf storage_backup_$(date +%Y%m%d_%H%M%S).tar.gz storage/
```

### Step 2: Put Application in Maintenance Mode

```bash
php artisan down --message="Upgrading database. Back in 5 minutes."
```

### Step 3: Pull Latest Code

```bash
git pull origin main
```

### Step 4: Install Dependencies

```bash
# Backend
composer install --no-dev --optimize-autoloader

# Frontend
cd frontend
npm install
npm run build
```

### Step 5: Run Migrations

```bash
cd backend

# Clear caches first
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Run migrations
php artisan migrate --force

# If migrations fail, check error and decide:
# - Fix and retry
# - Or rollback: php artisan migrate:rollback
```

### Step 6: Clear and Optimize

```bash
# Generate optimized autoload
composer dump-autoload --optimize

# Cache everything
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Generate JWT secret if needed
php artisan jwt:secret --force
```

### Step 7: Bring Application Back Online

```bash
php artisan up
```

### Step 8: Verify Deployment

```bash
# Check migration status
php artisan migrate:status

# Test critical endpoints
curl -X GET "https://naqashthaheem.com/api/workflows"
curl -X GET "https://naqashthaheem.com/api/posts"
curl -X GET "https://naqashthaheem.com/api/courses"

# Test file upload (with auth)
curl -X POST "https://naqashthaheem.com/api/files" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.png"
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Migration Already Exists

**Error:** Column already exists

**Solution:** Migrations have `if (!Schema::hasColumn(...))` checks, so this should not happen. If it does:
```bash
# Check which migrations ran
php artisan migrate:status

# If a migration is marked as run but failed partway:
# 1. Manually verify the database state
# 2. Delete the migration entry from migrations table
# 3. Re-run: php artisan migrate
```

### Issue 2: Foreign Key Constraints

**Error:** Cannot add foreign key constraint

**Solution:**
```bash
# Temporarily disable foreign key checks (PostgreSQL)
SET CONSTRAINTS ALL DEFERRED;

# Or in migration:
DB::statement('SET CONSTRAINTS ALL DEFERRED');
// your migration code
DB::statement('SET CONSTRAINTS ALL IMMEDIATE');
```

### Issue 3: Null Values in NOT NULL Columns

**Error:** Column contains null values

**Solution:**
```bash
# Before making column NOT NULL, update existing rows:
UPDATE workflows SET user_id = 1 WHERE user_id IS NULL;
# Then run migration
```

---

## 📊 API Changes Summary

### New/Updated Endpoints:

1. **Files API** - Now fully working
   - `POST /api/files` - Upload file ✅
   - `GET /api/files` - List files ✅
   - `GET /api/files/{id}` - Get file ✅
   - `DELETE /api/files/{id}` - Delete file ✅

2. **Workflow Files API** - New functionality
   - `POST /api/admin/workflows/{id}/files` - Attach file ✅
   - `DELETE /api/admin/workflows/{id}/files/{fileId}` - Detach file ✅

3. **API Token Authentication** - Now working
   - API tokens from Admin Panel can now be used for all operations ✅

### Breaking Changes:

**None** - All changes are backward compatible or additive.

---

## 🧪 Post-Deployment Testing

### Critical Paths to Test:

1. **Authentication:**
   ```bash
   # JWT login
   curl -X POST "https://naqashthaheem.com/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}'
   
   # API Token usage
   curl -X GET "https://naqashthaheem.com/api/posts" \
     -H "Authorization: Bearer API_TOKEN_HERE"
   ```

2. **File Upload:**
   ```bash
   curl -X POST "https://naqashthaheem.com/api/files" \
     -H "Authorization: Bearer TOKEN" \
     -F "file=@test.png"
   ```

3. **Workflow with Files:**
   ```bash
   # Create workflow
   # Upload file
   # Attach file to workflow
   # Verify workflow has file attached
   ```

4. **Admin Operations:**
   - Create Post ✅
   - Create Workflow ✅
   - Create Course ✅
   - Upload and attach files ✅

---

## 📝 Environment Variables to Check

### **Backend `.env` (Laravel)**

Ensure these are set in production `backend/.env`:

```bash
# App Configuration
APP_NAME=NovaWrite
APP_ENV=production
APP_DEBUG=false
APP_URL=https://naqashthaheem.com  # ⚠️ CRITICAL for storage URLs!
APP_KEY=base64:your_app_key_here

# Database
DB_CONNECTION=pgsql
DB_HOST=your_host
DB_PORT=5432
DB_DATABASE=novawrite_production
DB_USERNAME=your_user
DB_PASSWORD=your_password

# JWT Authentication
JWT_SECRET=your_jwt_secret_here
JWT_TTL=60
JWT_REFRESH_TTL=20160
JWT_ALGO=HS256

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=naqashthaheem.com
MAIL_PORT=465
MAIL_USERNAME=contact@naqashthaheem.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=contact@naqashthaheem.com
MAIL_FROM_NAME="NovaWrite"

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://naqashthaheem.com/auth/google/callback

# Session & Cache
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# Filesystem (public disk for uploads)
FILESYSTEM_DISK=public
```

### **Frontend `.env` (Vite)**

Ensure these are set in production `frontend/.env`:

```bash
# API Configuration
VITE_API_URL=https://naqashthaheem.com/api

# App Configuration
VITE_APP_NAME=NovaWrite
VITE_APP_URL=https://naqashthaheem.com
```

### **⚠️ CRITICAL: APP_URL Configuration**

The `APP_URL` in backend `.env` is **CRITICAL** because:

1. **Storage URLs:** `Storage::url()` uses this to generate asset URLs
2. **Email Links:** Password reset and verification links use this
3. **OAuth Redirects:** Google OAuth callback URLs use this

**Development:**
```bash
APP_URL=http://localhost:8001
```

**Production:**
```bash
APP_URL=https://naqashthaheem.com
```

**After changing APP_URL, always run:**
```bash
php artisan config:clear
php artisan config:cache
```

---

## 🔄 Rollback Plan

If deployment fails:

```bash
# 1. Put in maintenance mode
php artisan down

# 2. Restore database backup
psql -U postgres -h localhost novawrite_db < backup_TIMESTAMP.sql

# 3. Restore code (if needed)
git reset --hard PREVIOUS_COMMIT_HASH

# 4. Bring back online
php artisan up

# 5. Notify users
```

---

## ✅ Success Criteria

Deployment is successful when:

- [ ] All migrations run without errors
- [ ] No 500 errors in application logs
- [ ] All API endpoints return expected responses
- [ ] File upload works
- [ ] Workflow file attachment works
- [ ] API tokens authenticate successfully
- [ ] Frontend loads without errors
- [ ] Admin dashboard accessible
- [ ] User can login with Google OAuth
- [ ] Email verification works

---

## 📞 Support

If issues occur:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check web server logs: `/var/log/nginx/error.log`
3. Check database logs
4. Use rollback plan if critical

---

## 📅 Deployment Timeline Estimate

- Backup: 5-10 minutes
- Pull code & dependencies: 5-10 minutes
- Run migrations: 2-5 minutes
- Cache & optimize: 2 minutes
- Testing: 10-15 minutes
- **Total downtime: ~15-20 minutes**

---

**Created:** $(date)
**Last Updated:** $(date)

