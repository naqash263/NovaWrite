# NovaWrite Production Migration Checklist

## Pre-Deployment Checks

- [x] All code changes committed and pushed to main branch
- [x] Mobile responsiveness improvements implemented
- [x] PWA functionality re-enabled
- [x] ATS-friendly PDF exports implemented
- [x] OCR improvements for PDF extraction implemented
- [x] Profile picture handling improved
- [x] UTF-8 encoding issues fixed

## Deployment Process

### 1. Automatic Deployment

The push to the main branch should have automatically triggered the deployment workflow. To verify:

1. Go to: https://github.com/naqash263/NovaWrite/actions
2. Check that the latest workflow run is successful
3. Wait at least 2.5 minutes for the deployment to complete (as per rule #10)

### 2. Run CV Template Seeder

You have two options to run the CV template seeder:

#### Option A: Using GitHub Actions Workflow

1. Go to: https://github.com/naqash263/NovaWrite/actions/workflows/run-cv-seeder.yml
2. Click "Run workflow" button
3. Select "main" branch
4. Click "Run workflow"
5. Wait for the workflow to complete

#### Option B: Using SSH Script (Direct Server Access)

```bash
./run-cv-seeder-ssh.sh "Uae#@965443322"
```

### 3. Verify Deployment

#### Frontend Checks

- [ ] Visit https://naqashthaheem.com
- [ ] Navigate to the CV Builder module
- [ ] Verify mobile responsiveness (test on a mobile device or using browser dev tools)
- [ ] Check that CV templates display correctly with thumbnails
- [ ] Test profile picture upload functionality
- [ ] Test PDF export with various templates
- [ ] Verify ATS-friendly text layer in exported PDFs

#### Backend Checks

- [ ] Test CV extraction with text-based PDFs
- [ ] Test CV extraction with image-based PDFs (OCR)
- [ ] Verify encryption key stability:
  ```bash
  curl -s "https://naqashthaheem.com/api/cv-ai/check-encryption"
  ```

## Post-Deployment Tasks

- [ ] Clear browser cache to ensure latest assets are loaded
- [ ] Test all CV Builder features on multiple devices
- [ ] Document any remaining issues for future improvements

## Rollback Plan (If Needed)

If critical issues are found after deployment:

1. Revert to the previous stable commit:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. Or manually fix issues on the production server:
   ```bash
   ssh -p 21098 timesovh@162.254.39.126
   cd ~/naqashthaheem.com
   # Make necessary fixes
   ```

## Notes

- Remember that production deployments take at least 2.5 minutes to complete
- Always check the GitHub Actions logs for any deployment issues
- The stable APP_KEY is now managed through GitHub Secrets
