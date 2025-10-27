# Workflow System - Production Deployment Checklist

## Overview
This deployment includes the workflow download system with:
- Premium workflows (require login)
- Normal workflows (free download)
- Email opt-in for anonymous users
- Auto-opt-in for logged-in users
- No email popup for logged-in users
- Marketing email tracking

## Migrations to Deploy

### 1. Remove Approval System
**File:** `backend/database/migrations/2025_01_15_000001_remove_approval_columns_from_workflows.php`
- Removes: `approval_status`, `rejection_reason`, `approved_by`, `approved_at`
- Impact: Workflows no longer require approval, use direct status (draft/published)

### 2. Remove is_featured Column
**File:** `backend/database/migrations/2025_01_15_000002_remove_is_featured_from_workflows.php`
- Removes: `is_featured` column from workflows table
- Impact: Only `is_premium` flag is used now

### 3. Fix Workflow Columns
**File:** `backend/database/migrations/2025_01_15_000003_fix_workflow_columns.php`
- Ensures: `status` and `is_premium` columns exist
- Impact: Sets default status to 'draft' if missing

### 4. Fix Workflow Status Constraint
**File:** `backend/database/migrations/2025_01_15_000004_fix_workflow_status_constraint.php`
- Updates: CHECK constraint to include 'published' status
- Impact: Allows workflows to have 'published' status

### 5. Add is_active to workflow_files
**File:** `backend/database/migrations/2025_01_15_000005_add_is_active_to_workflow_files.php`
- Adds: `is_active` boolean column
- Impact: Allows disabling workflow files without deletion

### 6. Fix workflow_downloads Schema
**File:** `backend/database/migrations/2025_01_15_000007_fix_workflow_downloads_schema.php`
- Adds: `email`, `ip_address`, `user_agent`, `marketing_opt_in`, `user_id` columns
- Impact: Tracks downloads with marketing opt-in support

### 7. Add download_count to workflow_files
**File:** `backend/database/migrations/2025_01_15_000008_add_download_count_to_workflow_files.php`
- Adds: `download_count` integer column
- Impact: Tracks number of downloads per file

## Files Modified

### Backend
1. `app/Http/Controllers/Api/WorkflowDownloadController.php`
   - Added authentication check for premium workflows
   - Auto-opt-in for logged-in users
   - Skips email popup for logged-in users
   - Stores user_id for authenticated downloads

2. `app/Http/Controllers/Api/Admin/WorkflowController.php`
   - Removed `is_featured` references
   - Uses only `is_premium` flag

3. `app/Models/Workflow.php`
   - Removed `is_featured` from fillable and casts

4. `app/Models/WorkflowDownload.php`
   - Added `user_id` to fillable
   - Changed `token` to `download_token`

### Frontend
1. `src/components/WorkflowDownloadModal.tsx`
   - Added `isPremium` prop
   - Checks if user is logged in
   - Skips email popup for logged-in users
   - Skips email popup for premium workflows

2. `src/pages/Workflows.tsx`
   - Passes `isPremium` to modal
   - Updated to use `is_premium` instead of `is_featured`

## Pre-Deployment Checklist

- [ ] All migrations have been tested locally
- [ ] No hardcoded localhost URLs in code
- [ ] Frontend .env has production URLs
- [ ] Backend APP_URL set correctly
- [ ] Storage symlinks created
- [ ] Permissions set (775 for storage)
- [ ] STABLE_APP_KEY GitHub Secret is set
- [ ] Encryption keys are environment-specific
- [ ] Wait 2.5 minutes after deployment before testing

## Post-Deployment Verification

### Database
```bash
# Check migration status
php artisan migrate:status

# Verify columns exist
PGPASSWORD='mg08.Rcrld}N' psql -h localhost -U timesovh_naqash_thaheem -d timesovh_naqashthaheem -c "
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('workflows', 'workflow_downloads', 'workflow_files')
ORDER BY table_name, ordinal_position;
"
```

### API Testing
```bash
# Test workflows list
curl https://naqashthaheem.com/api/workflows

# Test workflow categories
curl https://naqashthaheem.com/api/workflow-categories

# Test download (without login)
curl -X POST https://naqashthaheem.com/api/workflow-downloads \
  -H "Content-Type: application/json" \
  -d '{"workflow_file_id": 1, "email": "test@example.com", "marketing_opt_in": true}'

# Test premium download (requires auth)
curl -X POST https://naqashthaheem.com/api/workflow-downloads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"workflow_file_id": 2}'
```

### Frontend Testing
1. Visit https://naqashthaheem.com/workflows
2. Test normal workflow download (should ask for email if not logged in)
3. Test premium workflow download (should require login if not logged in)
4. Log in and test premium workflow download (no email popup)
5. Log in and test normal workflow download (no email popup)

## Rollback Plan

If issues occur:
```bash
# Rollback migrations (in reverse order)
php artisan migrate:rollback --step=7

# Revert code changes
git reset --hard HEAD~1
git push origin main --force
```

## Expected Behavior

### Anonymous Users
- **Normal Workflow**: Can download, asked for email opt-in
- **Premium Workflow**: Required to login first

### Logged-In Users
- **Normal Workflow**: Direct download, no email popup, auto opt-in
- **Premium Workflow**: Direct download, no email popup, auto opt-in

### Marketing Emails
- Stored in `workflow_downloads` table
- `marketing_opt_in = true` for logged-in users
- `marketing_opt_in = user_choice` for anonymous users
- Query: `SELECT DISTINCT email FROM workflow_downloads WHERE marketing_opt_in = true AND email IS NOT NULL`

## Deployment Steps

1. Commit all changes:
   ```bash
   git add .
   git commit -m "Add workflow download system with premium/normal workflows and marketing opt-in"
   git push origin main
   ```

2. Wait for GitHub Actions to complete (2.5 minutes)

3. Verify deployment:
   - Check GitHub Actions status
   - Test API endpoints
   - Test frontend pages
   - Check database migrations

4. Monitor logs:
   ```bash
   tail -f storage/logs/laravel.log
   ```

## Notes

- Marketing emails are stored in `workflow_downloads` table
- Logged-in users automatically opt-in to marketing
- Anonymous users can choose to opt-in
- No email popup for logged-in users
- No email popup for premium workflows (user already logged in)

