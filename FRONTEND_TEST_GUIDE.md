# 🎨 Frontend Testing Guide

**Testing Lesson and Quiz Features in the Browser**

---

## 🚀 Step 1: Start Local Servers

### **Terminal 1: Backend Server**
```bash
cd /Users/naqashthaheem/NovaWrite/backend
php artisan serve

# Should show:
# Laravel development server started: http://127.0.0.1:8001
```

### **Terminal 2: Frontend Server**
```bash
cd /Users/naqashthaheem/NovaWrite/frontend
npm run dev

# Should show:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:3000/
# ➜  Network: use --host to expose
```

### **Terminal 3: Watch Logs (Optional)**
```bash
cd /Users/naqashthaheem/NovaWrite/backend
tail -f storage/logs/laravel.log
```

---

## 🧪 Step 2: Test in Browser

### **2.1: Open Browser**
1. Open http://localhost:3000
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Keep Console tab open to watch for errors

### **2.2: Login as Admin**
1. Click "Login" or navigate to http://localhost:3000/login
2. Enter admin credentials:
   - Email: `your-admin@example.com`
   - Password: `your-password`
3. **Check Console:** Should show no errors
4. **Check Network Tab:** Login API call should return 200

---

## 📚 Step 3: Test Lesson Management (Admin)

### **3.1: Navigate to Admin Panel**
1. After login, go to Admin Dashboard
2. Find "Courses" or similar menu item
3. **Check Console:** No errors

### **3.2: Create a Test Course (if needed)**
1. Click "Add Course" or similar button
2. Fill in course details:
   - Title: "Test Course - Laravel Basics"
   - Description: "Testing lesson and quiz functionality"
   - Category: Select any
   - Status: "Published"
3. Click "Save" or "Create"
4. **Check Console:** No errors
5. **Check Network Tab:** POST request should return 201

### **3.3: Add Lesson to Course**
1. Open the course you just created
2. Look for "Add Lesson" or "Lessons" section
3. Click "Add Lesson"
4. Fill in lesson details:
   ```
   Title: Introduction to Laravel
   Content: (Use the editor - add some text)
   Video URL: https://www.youtube.com/watch?v=ImtZ5yENzgE
   Duration: 15 minutes
   Free Preview: ✅ (checked)
   ```
5. Click "Save" or "Create Lesson"
6. **Check Console:** No errors
7. **Check Network Tab:** 
   - POST to `/api/admin/courses/{id}/lessons`
   - Should return 201 Created
   - Response should have `"success": true`

**Expected Result:**
```json
{
  "success": true,
  "message": "Lesson created successfully",
  "data": {
    "lesson": {
      "id": 1,
      "title": "Introduction to Laravel",
      ...
    }
  }
}
```

### **3.4: Add Quiz to Lesson**
1. In the lesson view, look for "Add Quiz" or "Tests" section
2. Click "Add Quiz" or "Create Test"
3. Fill in quiz details:
   ```
   Title: Laravel Basics Quiz
   Description: Test your knowledge
   Passing Score: 70
   Time Limit: 10 minutes
   ```
4. Add Questions:
   
   **Question 1:**
   ```
   Question: What is Laravel?
   Type: Multiple Choice
   Options:
     [ ] A JavaScript Framework
     [✓] A PHP Framework
     [ ] A Database
     [ ] An Operating System
   Points: 33
   ```
   
   **Question 2:**
   ```
   Question: What architecture does Laravel use?
   Type: Multiple Choice
   Options:
     [ ] MVVM
     [✓] MVC
     [ ] MVP
     [ ] Flux
   Points: 33
   ```
   
   **Question 3:**
   ```
   Question: What is Artisan?
   Type: Multiple Choice
   Options:
     [ ] A code editor
     [✓] A command-line tool
     [ ] A database
     [ ] A web server
   Points: 34
   ```

5. Click "Save Quiz" or "Create Test"
6. **Check Console:** No errors
7. **Check Network Tab:** 
   - POST to `/api/admin/lessons/{id}/tests`
   - Should return 201 Created

---

## 👤 Step 4: Test as User (Take the Quiz)

### **4.1: Logout and Login as User**
1. Click "Logout"
2. Login with regular user account:
   - Email: `user@example.com`
   - Password: `password`
3. **Check Console:** No errors

### **4.2: Find the Course**
1. Navigate to "Courses" or "Browse Courses"
2. Find "Test Course - Laravel Basics"
3. Click to open it
4. **Check Console:** No errors

### **4.3: Enroll in Course (if needed)**
1. If there's an "Enroll" button, click it
2. Wait for confirmation
3. **Check Console:** No errors

### **4.4: Start the Lesson**
1. Click on "Introduction to Laravel" lesson
2. Should see:
   - Lesson title
   - Video player (if video URL is valid)
   - Lesson content
   - "Take Quiz" button
3. **Check Console:** No errors

### **4.5: Take Quiz (First Attempt - Fail)**

**Purpose:** Test the retry functionality

1. Click "Take Quiz" or "Start Test"
2. **Answer incorrectly** (pick wrong answers on purpose):
   - Question 1: Pick "A JavaScript Framework" (wrong)
   - Question 2: Pick "MVVM" (wrong)
   - Question 3: Pick "A code editor" (wrong)
3. Click "Submit Quiz"
4. **Expected Result:**
   - Score: 0% or low score
   - Message: "You need 70% to pass"
   - "Try Again" button visible
   - Quiz NOT marked as passed
5. **Check Console:** No errors
6. **Check Network Tab:** POST should return 200

### **4.6: Take Quiz (Second Attempt - Pass)**

**Purpose:** Test that users can retry until they pass

1. Click "Try Again" or "Retake Quiz"
2. **Answer correctly this time**:
   - Question 1: Pick "A PHP Framework" (correct ✅)
   - Question 2: Pick "MVC" (correct ✅)
   - Question 3: Pick "A command-line tool" (correct ✅)
3. Click "Submit Quiz"
4. **Expected Result:**
   - Score: 100%
   - Message: "Test passed! Congratulations!" or similar
   - Lesson marked as completed ✅
   - Next lesson unlocked (if exists)
   - Can proceed to next lesson
5. **Check Console:** No errors
6. **Check Network Tab:** POST should return 200

### **4.7: View Quiz Results**
1. Look for "View Results" or "My Attempts" button
2. Click it
3. **Expected to See:**
   - List of all attempts
   - Attempt 1: 0% - Failed ❌
   - Attempt 2: 100% - Passed ✅
   - Best Score: 100%
4. **Check Console:** No errors

---

## ✅ Success Criteria Checklist

### **Backend (API)**
- [ ] Backend server running on port 8001
- [ ] No errors in Laravel logs
- [ ] Login API returns token
- [ ] Course creation works
- [ ] Lesson creation returns 201
- [ ] Quiz creation returns 201
- [ ] Quiz submission returns 200
- [ ] All API responses have `"success": true`

### **Frontend (UI)**
- [ ] Frontend server running on port 3000
- [ ] No errors in browser console
- [ ] No failed API requests (check Network tab)
- [ ] Admin login works
- [ ] Course management UI loads
- [ ] Lesson form appears
- [ ] Can create lesson with all fields
- [ ] Quiz form appears
- [ ] Can add multiple questions
- [ ] User can view course
- [ ] User can enroll (if required)
- [ ] User can view lesson
- [ ] Quiz loads correctly
- [ ] Can submit quiz answers
- [ ] Fail message shows correctly
- [ ] "Try Again" button works
- [ ] Second attempt works
- [ ] Pass message shows correctly
- [ ] Lesson marked as completed
- [ ] Progress tracked correctly

### **Functionality**
- [ ] Users can retry quiz unlimited times
- [ ] Must achieve 70% to pass
- [ ] All attempts are saved
- [ ] Best score is tracked
- [ ] Lesson completion after passing quiz
- [ ] Sequential access (can't skip lessons)
- [ ] Quiz questions randomized (if implemented)
- [ ] Time limit enforced (if implemented)

---

## 🐛 Common Issues & Solutions

### **Issue 1: Frontend Won't Start**

**Error:** `Cannot find module` or `Module not found`

**Solution:**
```bash
cd /Users/naqashthaheem/NovaWrite/frontend
rm -rf node_modules
npm install
npm run dev
```

---

### **Issue 2: API Calls Failing (CORS)**

**Error in Console:** `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution:**
Check backend is running and frontend is using correct URL:
```bash
# Check frontend .env
cat frontend/.env

# Should have:
# VITE_API_URL=http://localhost:8001/api
```

---

### **Issue 3: 403 Forbidden on Lesson Creation**

**Error:** API returns 403

**Solutions:**
1. Make sure you're logged in as admin
2. Check token is being sent:
   ```javascript
   // In browser console
   localStorage.getItem('token')
   // Should show your JWT token
   ```
3. Check user role:
   ```javascript
   // In browser console
   JSON.parse(localStorage.getItem('user')).role
   // Should show 'admin'
   ```

---

### **Issue 4: Quiz Not Loading**

**Symptoms:** Quiz form empty or not appearing

**Solutions:**
1. Check if quiz was created (check Network tab)
2. Check lesson ID is correct
3. Clear browser cache (Cmd+Shift+R)
4. Check API response in Network tab

---

### **Issue 5: "Try Again" Button Not Working**

**Symptoms:** Button doesn't reload quiz

**Solutions:**
1. Check console for JavaScript errors
2. Check if API allows multiple attempts
3. Reload page and try again

---

## 📸 What You Should See

### **Admin View - Create Lesson:**
```
┌─────────────────────────────────────┐
│  Add Lesson to Course               │
├─────────────────────────────────────┤
│  Title: [Introduction to Laravel  ] │
│                                     │
│  Content:                           │
│  ┌─────────────────────────────┐   │
│  │ Rich text editor            │   │
│  │ # Welcome to Laravel...     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Video URL: [https://youtube...]   │
│  Duration: [15] minutes             │
│  ☑ Free Preview                    │
│                                     │
│  [Cancel]  [Save Lesson]           │
└─────────────────────────────────────┘
```

### **User View - Take Quiz:**
```
┌─────────────────────────────────────┐
│  Laravel Basics Quiz                │
│  ⏱ Time Remaining: 9:45             │
├─────────────────────────────────────┤
│  Question 1 of 3                    │
│                                     │
│  What is Laravel?                   │
│                                     │
│  ○ A JavaScript Framework           │
│  ● A PHP Framework                  │
│  ○ A Database                       │
│  ○ An Operating System              │
│                                     │
│  [Previous]  [Next]  [Submit Quiz] │
└─────────────────────────────────────┘
```

### **Quiz Result - Failed:**
```
┌─────────────────────────────────────┐
│  ❌ Quiz Failed                     │
├─────────────────────────────────────┤
│  Your Score: 33%                    │
│  Passing Score: 70%                 │
│                                     │
│  You need to score at least 70%    │
│  to pass this quiz.                 │
│                                     │
│  Don't worry! You can try again.   │
│                                     │
│  [View Results]  [Try Again]       │
└─────────────────────────────────────┘
```

### **Quiz Result - Passed:**
```
┌─────────────────────────────────────┐
│  ✅ Congratulations!                │
├─────────────────────────────────────┤
│  Your Score: 100%                   │
│  Passing Score: 70%                 │
│                                     │
│  You passed the quiz!               │
│  Lesson completed successfully.     │
│                                     │
│  [View Results]  [Next Lesson →]   │
└─────────────────────────────────────┘
```

---

## 🎯 Testing Workflow Summary

```
1. Start Backend  → ✅
2. Start Frontend → ✅
3. Login as Admin → ✅
4. Create Course  → ✅
5. Create Lesson  → ✅
6. Create Quiz    → ✅
7. Logout         → ✅
8. Login as User  → ✅
9. Take Quiz (Fail) → ✅
10. Retry Quiz (Pass) → ✅
11. Check Results → ✅
12. All Tests Pass? → READY TO COMMIT! 🚀
```

---

## 📝 Notes for Testing

**What to Test:**
- ✅ Can create lesson with all fields
- ✅ Can create quiz with multiple questions
- ✅ Quiz shows all questions
- ✅ Can select answers
- ✅ Can submit quiz
- ✅ Fail message appears when score < 70%
- ✅ Pass message appears when score >= 70%
- ✅ Can retry unlimited times
- ✅ All attempts are saved
- ✅ Progress is tracked

**What NOT to Test (Yet):**
- ⏭️ Advanced quiz features (timer, randomization)
- ⏭️ File attachments to lessons
- ⏭️ Lesson progress animations
- ⏭️ Course certificates
- ⏭️ Mobile responsive design

---

## 🚀 Ready to Test?

### **Quick Start Commands:**

```bash
# Terminal 1
cd /Users/naqashthaheem/NovaWrite/backend && php artisan serve

# Terminal 2  
cd /Users/naqashthaheem/NovaWrite/frontend && npm run dev

# Open Browser
open http://localhost:3000
```

**Then follow the steps above!** ✨

---

**Happy Testing!** 🧪

