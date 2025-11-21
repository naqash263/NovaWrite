# 🧪 Testing Lesson Creation and Quiz - Step by Step

**Testing Date:** $(date)

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Backend running on http://localhost:8001
- ✅ Frontend running on http://localhost:3003
- ✅ PostgreSQL database running
- ✅ Admin user account
- ✅ At least one course created

---

## 🚀 Step 1: Start Local Servers

### **Terminal 1: Start Backend**
```bash
cd /Users/naqashthaheem/NovaWrite/backend
php artisan serve
# Should show: Server started on http://127.0.0.1:8001
```

### **Terminal 2: Start Frontend**
```bash
cd /Users/naqashthaheem/NovaWrite/frontend
npm run dev
# Should show: Local: http://localhost:3000
```

### **Terminal 3: Watch Laravel Logs**
```bash
cd /Users/naqashthaheem/NovaWrite/backend
tail -f storage/logs/laravel.log
# Watch for any errors
```

---

## 🎓 Step 2: Test Lesson Creation (via API)

### **2.1: Get Admin Token**

First, login to get your JWT token:

```bash
# Login as admin
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin@example.com",
    "password": "your-password"
  }' | jq

# Response should include:
# {
#   "access_token": "eyJ0eXAi...",
#   "user": { "role": "admin", ... }
# }

# Copy the access_token for next steps
```

**Save your token:**
```bash
export ADMIN_TOKEN="paste-your-token-here"
```

---

### **2.2: Check Existing Courses**

```bash
# Get list of courses
curl http://localhost:8001/api/courses | jq

# Note a course ID (e.g., 1) to use for testing
export COURSE_ID=1
```

---

### **2.3: Create a Test Lesson**

```bash
# Create lesson
curl -X POST "http://localhost:8001/api/admin/courses/${COURSE_ID}/lessons" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Lesson: Introduction to Laravel",
    "content": "# Welcome to Laravel\n\nIn this lesson, you will learn:\n- What is Laravel\n- Why use Laravel\n- Laravel architecture\n\nLet'\''s get started!",
    "video_url": "https://www.youtube.com/watch?v=ImtZ5yENzgE",
    "duration_minutes": 15,
    "is_free_preview": true
  }' | jq

# Expected Response:
# {
#   "success": true,
#   "message": "Lesson created successfully",
#   "data": {
#     "lesson": {
#       "id": 1,
#       "course_id": 1,
#       "title": "Test Lesson: Introduction to Laravel",
#       "order": 0,
#       ...
#     }
#   }
# }

# ✅ If you see success: true → Lesson created!
# ❌ If error → Check logs in Terminal 3
```

**Save the lesson ID:**
```bash
export LESSON_ID=1  # Use the ID from response
```

---

### **2.4: Verify Lesson Was Created**

```bash
# Get all lessons for the course
curl "http://localhost:8001/api/admin/courses/${COURSE_ID}/lessons" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq

# Should show your new lesson in the list
```

---

## 🧪 Step 3: Create Quiz for the Lesson

### **3.1: Create Test Quiz**

```bash
# Create quiz with 3 questions
curl -X POST "http://localhost:8001/api/admin/lessons/${LESSON_ID}/tests" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Laravel Basics Quiz",
    "description": "Test your knowledge of Laravel fundamentals",
    "passing_score": 70,
    "time_limit_minutes": 10,
    "is_active": true,
    "questions": [
      {
        "id": 1,
        "question": "What is Laravel?",
        "type": "multiple_choice",
        "options": [
          "A PHP Framework",
          "A JavaScript Library",
          "A Database",
          "An Operating System"
        ],
        "correct_answer": 0,
        "points": 33
      },
      {
        "id": 2,
        "question": "What architecture pattern does Laravel use?",
        "type": "multiple_choice",
        "options": [
          "MVVM",
          "MVC",
          "MVP",
          "Flux"
        ],
        "correct_answer": 1,
        "points": 33
      },
      {
        "id": 3,
        "question": "What is Artisan in Laravel?",
        "type": "multiple_choice",
        "options": [
          "A code editor",
          "A command-line tool",
          "A database driver",
          "A web server"
        ],
        "correct_answer": 1,
        "points": 34
      }
    ]
  }' | jq

# Expected Response:
# {
#   "success": true,
#   "message": "Test created successfully",
#   "data": {
#     "test": {
#       "id": 1,
#       "lesson_id": 1,
#       "title": "Laravel Basics Quiz",
#       "passing_score": 70,
#       ...
#     }
#   }
# }

# ✅ If success: true → Quiz created!
# ❌ If error → Check logs
```

**Save the test ID:**
```bash
export TEST_ID=1  # Use the ID from response
```

---

## 👤 Step 4: Test Quiz as User

### **4.1: Get User Token**

```bash
# Login as regular user
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }' | jq

# Save the user token
export USER_TOKEN="paste-user-token-here"
```

---

### **4.2: Attempt Quiz (First Try - Intentionally Fail)**

```bash
# Submit wrong answers to test retry functionality
curl -X POST "http://localhost:8001/api/lessons/${LESSON_ID}/tests/${TEST_ID}/attempt" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "question_id": 1,
        "selected_answer": 1
      },
      {
        "question_id": 2,
        "selected_answer": 0
      },
      {
        "question_id": 3,
        "selected_answer": 0
      }
    ]
  }' | jq

# Expected Response (Failed):
# {
#   "success": true,
#   "message": "Score: 33%. You need 70% to pass. Try again!",
#   "data": {
#     "attempt": {
#       "score": 33,
#       "passed": false,
#       ...
#     },
#     "can_proceed": false,
#     "passing_score": 70,
#     "can_retry": true
#   }
# }

# ✅ If "passed": false and "can_retry": true → Working correctly!
```

---

### **4.3: Retry Quiz (Second Try - Pass)**

```bash
# Submit correct answers
curl -X POST "http://localhost:8001/api/lessons/${LESSON_ID}/tests/${TEST_ID}/attempt" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "question_id": 1,
        "selected_answer": 0
      },
      {
        "question_id": 2,
        "selected_answer": 1
      },
      {
        "question_id": 3,
        "selected_answer": 1
      }
    ]
  }' | jq

# Expected Response (Passed):
# {
#   "success": true,
#   "message": "Test passed! Congratulations!",
#   "data": {
#     "attempt": {
#       "score": 100,
#       "passed": true,
#       ...
#     },
#     "can_proceed": true,
#     "next_lesson_id": 2
#   }
# }

# ✅ If "passed": true and "can_proceed": true → Success!
```

---

### **4.4: View Test Results**

```bash
# Get all attempts for this test
curl "http://localhost:8001/api/lessons/${LESSON_ID}/tests/${TEST_ID}/results" \
  -H "Authorization: Bearer ${USER_TOKEN}" | jq

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "test": { ... },
#     "attempts": [
#       { "score": 33, "passed": false },
#       { "score": 100, "passed": true }
#     ],
#     "best_score": 100,
#     "has_passed": true,
#     "attempts_count": 2
#   }
# }

# ✅ Should show both attempts with best_score: 100
```

---

## 🖥️ Step 5: Test in Browser (Frontend)

### **5.1: Test Lesson List**

1. Open browser: http://localhost:3000
2. Login as admin
3. Navigate to Courses (if you have admin panel)
4. Find your test course
5. Click to view lessons
6. **Expected:** Should see "Test Lesson: Introduction to Laravel"

### **5.2: Test Lesson View**

1. Click on the lesson
2. **Expected:** Should see:
   - Lesson title
   - Video player (if implemented)
   - Lesson content
   - Quiz button (if quiz exists)

### **5.3: Test Quiz in Browser**

1. Open browser console (F12)
2. Click "Take Quiz" button
3. Answer questions
4. Submit quiz
5. **Expected:**
   - If fail: See score and "Try Again" button
   - If pass: See congratulations message
6. **Check console:** No errors

---

## 📊 Step 6: Verify Database

### **6.1: Check Lessons Table**

```bash
cd /Users/naqashthaheem/NovaWrite/backend
php artisan tinker

# In tinker:
>>> Lesson::count();
# Should show at least 1

>>> Lesson::first();
# Should show your test lesson

>>> Lesson::with('course')->first();
# Should show lesson with course relationship

>>> exit
```

### **6.2: Check Tests Table**

```bash
php artisan tinker

>>> LessonTest::count();
# Should show at least 1

>>> LessonTest::first();
# Should show your quiz with questions

>>> LessonTest::first()->questions;
# Should show array of questions

>>> exit
```

### **6.3: Check Test Attempts**

```bash
php artisan tinker

>>> TestAttempt::count();
# Should show 2 (your two attempts)

>>> TestAttempt::all();
# Should show both attempts with scores

>>> TestAttempt::where('passed', true)->count();
# Should show 1 (your passing attempt)

>>> exit
```

---

## ✅ Success Criteria

### **Lesson Creation:**
- ✅ POST /api/admin/courses/{id}/lessons returns 201
- ✅ Response includes lesson data
- ✅ Lesson appears in database
- ✅ Lesson has correct order number
- ✅ No errors in Laravel logs

### **Quiz Creation:**
- ✅ POST /api/admin/lessons/{id}/tests returns 201
- ✅ Response includes test data
- ✅ Questions stored correctly
- ✅ Quiz appears in database
- ✅ No errors in Laravel logs

### **Quiz Attempt (Fail):**
- ✅ POST /api/lessons/{id}/tests/{id}/attempt returns 200
- ✅ Response shows "passed": false
- ✅ Shows correct score percentage
- ✅ "can_retry": true
- ✅ Attempt saved in database

### **Quiz Attempt (Pass):**
- ✅ Second attempt returns 200
- ✅ Response shows "passed": true
- ✅ Shows score 100%
- ✅ "can_proceed": true
- ✅ Lesson marked as completed

### **Overall:**
- ✅ All API endpoints working
- ✅ Retry system working (can attempt multiple times)
- ✅ Database relationships correct
- ✅ No console errors in frontend
- ✅ No errors in Laravel logs

---

## 🐛 Troubleshooting

### **Issue: 403 Forbidden**

**Solution:**
```bash
# Check if you're using admin token for admin endpoints
echo $ADMIN_TOKEN

# If empty, login again and save token
```

### **Issue: 404 Not Found**

**Solution:**
```bash
# Check if endpoints exist
cd backend
php artisan route:list | grep lessons
php artisan route:list | grep tests

# Clear route cache
php artisan route:clear
```

### **Issue: 500 Internal Server Error**

**Solution:**
```bash
# Check Laravel logs
tail -50 backend/storage/logs/laravel.log

# Common causes:
# - Database connection issue
# - Missing column in database
# - Validation error
# - Authentication issue
```

### **Issue: Quiz Endpoint Not Found**

**Check if routes exist:**
```bash
cd backend
grep -n "tests" routes/api.php
```

**If missing, we need to add them!**

---

## 📝 Testing Checklist

**Before Testing:**
- [ ] Backend server running (php artisan serve)
- [ ] Frontend server running (npm run dev)
- [ ] Database running
- [ ] Have admin account credentials
- [ ] Have at least one course

**During Testing:**
- [ ] Created lesson successfully
- [ ] Lesson appears in database
- [ ] Created quiz successfully
- [ ] Quiz has 3 questions
- [ ] Attempted quiz (failed) - score < 70%
- [ ] Attempted quiz (passed) - score >= 70%
- [ ] Can retry unlimited times
- [ ] Test results show both attempts

**After Testing:**
- [ ] No errors in Laravel logs
- [ ] No errors in browser console
- [ ] All data in database correct
- [ ] Frontend displays correctly
- [ ] Ready to commit and push ✅

---

## 🎯 Next Steps

**If ALL tests pass:**
1. ✅ Mark all items in checklist
2. ✅ Document any issues found
3. ✅ Commit changes
4. ✅ Push to production
5. ✅ Test once more on production

**If ANY test fails:**
1. ❌ Check logs for errors
2. ❌ Fix the issue
3. ❌ Re-run tests
4. ❌ Don't push until all tests pass!

---

**Ready to start testing? Let's go!** 🚀

