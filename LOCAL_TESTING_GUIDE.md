# 🧪 Local Testing Guide

**CRITICAL RULE: Always test locally before pushing to production!**

---

## ⚠️ Why Test Locally?

- ✅ Catch errors before they affect users
- ✅ Faster feedback loop (no waiting for deployment)
- ✅ Safe to experiment and break things
- ✅ Debug with full error messages
- ✅ No risk to production data
- ✅ Can rollback instantly

**Production is for users, not for testing!**

---

## 🚀 Quick Start

### **1. Start Backend (Laravel)**

```bash
cd /Users/naqashthaheem/NovaWrite/backend

# Start development server
php artisan serve
# Backend now running at: http://localhost:8001

# In another terminal, watch for errors
tail -f storage/logs/laravel.log
```

### **2. Start Frontend (React + Vite)**

```bash
cd /Users/naqashthaheem/NovaWrite/frontend

# Start development server
npm run dev
# Frontend now running at: http://localhost:3000
```

### **3. Access Local Development**

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **Database:** PostgreSQL (already configured)

---

## ✅ Testing Checklist

### **Before Every Push:**

#### **1. Test New Features**
```bash
# Example: Testing User API Key Creation

# 1. Start servers
cd backend && php artisan serve &
cd ../frontend && npm run dev

# 2. Login via browser
open http://localhost:3000/login

# 3. Test the feature in browser
# - Navigate to feature
# - Open browser console (F12)
# - Watch for errors
# - Test all user flows

# 4. Test API with curl
curl -X POST http://localhost:8001/api/user-api-keys \
  -H "Authorization: Bearer YOUR_LOCAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "api_key": "test-key-value"
  }'

# 5. Check Laravel logs
tail -50 backend/storage/logs/laravel.log
```

#### **2. Test Database Changes**
```bash
# If you added migrations:

# 1. Run migrations locally
cd backend
php artisan migrate

# 2. Check if they worked
php artisan tinker
>>> Schema::hasTable('your_table_name');
>>> Schema::getColumnListing('your_table_name');

# 3. Test rollback (make sure it's safe)
php artisan migrate:rollback
php artisan migrate

# 4. If all good, THEN push to production
```

#### **3. Test API Endpoints**
```bash
# Use Postman, Insomnia, or curl

# Test GET
curl http://localhost:8001/api/courses

# Test POST
curl -X POST http://localhost:8001/api/admin/courses/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Lesson","content":"Test","duration_minutes":10}'

# Test PUT
curl -X PUT http://localhost:8001/api/admin/courses/1/lessons/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Lesson","content":"Updated","duration_minutes":15}'

# Test DELETE
curl -X DELETE http://localhost:8001/api/admin/courses/1/lessons/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **4. Test Frontend Changes**
```bash
# 1. Open browser at http://localhost:3000
# 2. Open Developer Tools (F12)
# 3. Check Console for errors
# 4. Check Network tab for failed requests
# 5. Test all buttons and forms
# 6. Check mobile responsive design
# 7. Test with different user roles (admin, user)
```

#### **5. Test File Uploads**
```bash
# Test uploading files locally

# 1. Test via UI
# - Upload an image/file
# - Check if it appears correctly
# - Check storage/app/public/ folder

# 2. Test via API
curl -X POST http://localhost:8001/api/files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/test-file.jpg"

# 3. Verify storage
ls -la backend/storage/app/public/
```

---

## 🔧 Common Local Testing Scenarios

### **Scenario 1: Testing New API Endpoint**

```bash
# Step 1: Create the endpoint in controller
# Step 2: Add route
# Step 3: Test locally

# Start servers
cd backend && php artisan serve
# In another terminal:
cd frontend && npm run dev

# Test API
curl -X POST http://localhost:8001/api/your-new-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Check logs
tail -f backend/storage/logs/laravel.log

# If working ✅ → Commit and push
# If broken ❌ → Fix locally, test again
```

---

### **Scenario 2: Testing Database Migration**

```bash
# Step 1: Create migration
cd backend
php artisan make:migration add_column_to_table

# Step 2: Edit migration file
# Add Schema::hasColumn() checks!

# Step 3: Test locally
php artisan migrate

# Step 4: Verify
php artisan tinker
>>> Schema::getColumnListing('your_table');

# Step 5: Test rollback
php artisan migrate:rollback

# Step 6: Run again
php artisan migrate

# If all works ✅ → Commit and push
# If fails ❌ → Fix migration, test again
```

---

### **Scenario 3: Testing Frontend Component**

```bash
# Step 1: Make changes to React component
# Step 2: Save (Vite hot-reloads automatically)
# Step 3: Check browser at http://localhost:3000
# Step 4: Open console (F12)
# Step 5: Look for errors
# Step 6: Test all interactions

# Common checks:
# - Does it render correctly?
# - Do buttons work?
# - Do forms submit?
# - Are API calls successful?
# - Are there console errors?

# If all works ✅ → Commit and push
# If broken ❌ → Fix, save, check again
```

---

### **Scenario 4: Testing OAuth/Authentication**

```bash
# Step 1: Start both servers
# Step 2: Open http://localhost:3000/login
# Step 3: Try to login
# Step 4: Check browser console for errors
# Step 5: Check Laravel logs:
tail -f backend/storage/logs/laravel.log

# Step 6: Test Google OAuth
# - Click "Sign in with Google"
# - Check redirect URL in console
# - Should be localhost:3000, not production
# - After auth, should redirect back to localhost

# If all works ✅ → Commit and push
# If broken ❌ → Check OAuth config, fix, test again
```

---

## 🐛 Debugging Locally

### **Backend Errors**

```bash
# 1. Check Laravel logs
tail -f backend/storage/logs/laravel.log

# 2. Use tinker for quick tests
cd backend
php artisan tinker
>>> User::count();
>>> Course::first();
>>> auth()->user();

# 3. Add debug statements
# In controller:
\Log::info('Debug info', ['data' => $variable]);
dd($variable); // Dump and die

# 4. Check database
php artisan tinker
>>> DB::table('users')->get();
```

### **Frontend Errors**

```bash
# 1. Browser Console (F12)
# Look for:
# - Red errors
# - Failed network requests (in Network tab)
# - React warnings

# 2. Check Vite terminal output
# Look for:
# - Compilation errors
# - TypeScript errors
# - Import errors

# 3. Add console.log statements
console.log('Debug:', variable);
console.error('Error:', error);
```

---

## 📝 Testing Workflow

### **The Right Way:**

```
1. Make changes locally
2. Test locally ✅
3. Fix any issues
4. Test again ✅
5. All working?
6. Commit changes
7. Push to GitHub
8. GitHub Actions deploys
9. Test on production (final verification)
```

### **The Wrong Way (DON'T DO THIS!):**

```
❌ 1. Make changes
❌ 2. Commit immediately
❌ 3. Push to production
❌ 4. Hope it works
❌ 5. Users report errors
❌ 6. Panic and fix
```

---

## ⚡ Quick Test Commands

### **Test Everything Quickly:**

```bash
# Backend tests
cd backend
php artisan test
php artisan config:clear
php artisan route:list | grep your-route
php artisan migrate:status

# Frontend tests
cd frontend
npm run build  # Test if it builds without errors
npm run type-check  # Check TypeScript
```

---

## 🚨 Red Flags (Don't Push If You See These!)

### **Backend:**
- ❌ Laravel logs showing errors
- ❌ Migration fails locally
- ❌ API returns 500 errors
- ❌ Database queries failing
- ❌ Tests failing

### **Frontend:**
- ❌ Console errors in browser
- ❌ TypeScript errors
- ❌ Failed API requests (Network tab)
- ❌ Build fails (`npm run build`)
- ❌ Components not rendering

---

## ✅ Green Lights (Safe to Push!)

### **Backend:**
- ✅ Laravel logs clean
- ✅ Migrations run successfully
- ✅ API returns correct responses
- ✅ All CRUD operations work
- ✅ Tests pass

### **Frontend:**
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ All API calls succeed
- ✅ Build succeeds
- ✅ UI works as expected

---

## 🎯 Testing Tools

### **Backend:**
- **Tinker:** `php artisan tinker` - Interactive PHP shell
- **Logs:** `tail -f storage/logs/laravel.log`
- **Postman:** API testing tool
- **curl:** Command-line API testing

### **Frontend:**
- **Browser DevTools:** F12 → Console, Network, Elements
- **React DevTools:** Browser extension
- **Vite HMR:** Instant updates on save

---

## 📚 Example: Full Test Cycle

### **Adding a New Feature:**

```bash
# 1. Create feature branch (optional)
git checkout -b feature/new-lesson-quiz

# 2. Make changes to code
# ... edit files ...

# 3. Start local servers
cd backend && php artisan serve &
cd ../frontend && npm run dev

# 4. Test in browser
# - Open http://localhost:3000
# - Test the new feature
# - Check console for errors
# - Test all edge cases

# 5. Test API with curl
curl http://localhost:8001/api/your-endpoint

# 6. Check logs
tail -20 backend/storage/logs/laravel.log

# 7. All working? Build production
cd frontend
npm run build

# 8. Check for localhost URLs
grep -r "localhost" dist/
# Should return nothing!

# 9. Commit
git add -A
git commit -m "feat: Add new lesson quiz feature"

# 10. Push
git push origin main

# 11. Monitor deployment
# https://github.com/YOUR_REPO/actions

# 12. Test on production (final check)
# https://naqashthaheem.com
```

---

## 🔄 When Things Go Wrong in Production

### **If you pushed without testing and production breaks:**

```bash
# 1. Don't panic!
# 2. Check GitHub Actions logs
# 3. Check production Laravel logs (SSH to server)
ssh your-server
tail -50 /home/timesovh/naqashthaheem.com/backend/storage/logs/laravel.log

# 4. Quick fix?
# - Fix locally
# - Test locally ✅
# - Push fix immediately

# 5. Need to rollback?
git revert HEAD
git push origin main
# GitHub Actions will deploy the rollback

# 6. Learn from it!
# - Add to rules
# - Improve testing
# - Don't skip local testing again!
```

---

## 💡 Pro Tips

1. **Use two terminals:**
   - Terminal 1: Backend (php artisan serve)
   - Terminal 2: Frontend (npm run dev)

2. **Keep browser DevTools open:**
   - Always have Console open
   - Watch Network tab for failed requests

3. **Test with different users:**
   - Admin user
   - Regular user
   - Unauthenticated user

4. **Test error cases:**
   - Invalid data
   - Missing fields
   - Wrong permissions

5. **Use `.env.local` for local config:**
   - Never commit sensitive data
   - Use different API keys for testing

---

## 📖 Remember:

> **"Test twice, deploy once"**

> **"Production is not your QA environment"**

> **"Every minute testing locally saves an hour debugging production"**

---

## ✅ Final Checklist Before Push

```
□ Tested locally (backend + frontend)
□ No errors in Laravel logs
□ No errors in browser console
□ All CRUD operations work
□ Migrations tested (up and down)
□ API responses correct
□ Frontend builds successfully (npm run build)
□ No localhost URLs in build (grep -r "localhost" dist/)
□ TypeScript compiles without errors
□ All tests pass (if you have tests)
□ Git commit message is clear
□ Ready to push ✅
```

---

**ALWAYS TEST LOCALLY FIRST!** 🚀

**Production users will thank you!** 💚

