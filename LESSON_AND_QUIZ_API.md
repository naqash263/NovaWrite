# 📚 Lesson and Quiz API Documentation

Complete guide for managing lessons and quizzes in courses.

---

## 🎯 Overview

The system supports:
- ✅ **Lessons:** Course content with video, text, and files
- ✅ **Quizzes:** Tests with multiple-choice questions
- ✅ **Progress Tracking:** User progress and completion
- ✅ **Quiz Attempts:** Users can retry until they pass
- ✅ **Sequential Access:** Must complete previous lessons to unlock next

---

## 📋 Table of Contents

1. [Lesson API](#lesson-api)
2. [Quiz/Test API](#quiz-test-api)
3. [Progress Tracking](#progress-tracking)
4. [Complete Workflow](#complete-workflow)

---

## 🎓 Lesson API

### **1. Get Course Lessons**

**Endpoint:** `GET /api/admin/courses/{courseId}/lessons`

**Description:** Get all lessons for a course in order

**Authentication:** Admin JWT token required

**Response:**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": 1,
      "title": "Introduction to Laravel",
      "description": "...",
      ...
    },
    "lessons": [
      {
        "id": 1,
        "course_id": 1,
        "title": "Getting Started",
        "content": "Welcome to Laravel...",
        "video_url": "https://youtube.com/watch?v=...",
        "duration_minutes": 15,
        "order": 0,
        "is_free_preview": true,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      },
      ...
    ]
  }
}
```

---

### **2. Create Lesson**

**Endpoint:** `POST /api/admin/courses/{courseId}/lessons`

**Description:** Create a new lesson for a course

**Authentication:** Admin JWT token required

**Request Body:**
```json
{
  "title": "Laravel Installation",
  "content": "In this lesson, we'll learn how to install Laravel...",
  "video_url": "https://youtube.com/watch?v=xyz123",
  "duration_minutes": 20,
  "is_free_preview": false
}
```

**Notes:**
- `order` is auto-assigned (next available order number)
- `course_id` is taken from URL parameter
- `content` supports Markdown/HTML

**Response:**
```json
{
  "success": true,
  "message": "Lesson created successfully",
  "data": {
    "lesson": {
      "id": 2,
      "course_id": 1,
      "title": "Laravel Installation",
      "content": "In this lesson, we'll learn...",
      "video_url": "https://youtube.com/watch?v=xyz123",
      "duration_minutes": 20,
      "order": 1,
      "is_free_preview": false,
      "created_at": "2025-01-15T00:00:00Z",
      "updated_at": "2025-01-15T00:00:00Z"
    }
  }
}
```

---

### **3. Update Lesson**

**Endpoint:** `PUT /api/admin/courses/{courseId}/lessons/{id}`

**Description:** Update an existing lesson

**Authentication:** Admin JWT token required

**Request Body:**
```json
{
  "title": "Laravel Installation (Updated)",
  "content": "Updated content...",
  "video_url": "https://youtube.com/watch?v=abc456",
  "duration_minutes": 25,
  "order": 2,
  "is_free_preview": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson updated successfully",
  "data": {
    "lesson": {
      "id": 2,
      "course_id": 1,
      "title": "Laravel Installation (Updated)",
      ...
    }
  }
}
```

---

### **4. Delete Lesson**

**Endpoint:** `DELETE /api/admin/courses/{courseId}/lessons/{id}`

**Description:** Delete a lesson

**Authentication:** Admin JWT token required

**Response:**
```json
{
  "success": true,
  "message": "Lesson deleted successfully"
}
```

---

## 🧪 Quiz/Test API

### **Quiz System Overview**

- Each lesson can have multiple tests (quizzes)
- Questions stored as JSON array
- Users can attempt tests multiple times
- Must achieve passing score to complete lesson
- Progress tracked per user

---

### **Test Structure**

```json
{
  "id": 1,
  "lesson_id": 1,
  "title": "Getting Started Quiz",
  "description": "Test your knowledge of Laravel basics",
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
      "points": 10
    },
    {
      "id": 2,
      "question": "Laravel uses which architecture pattern?",
      "type": "multiple_choice",
      "options": [
        "MVVM",
        "MVC",
        "MVP",
        "Flux"
      ],
      "correct_answer": 1,
      "points": 10
    }
  ],
  "passing_score": 70,
  "time_limit_minutes": 10,
  "is_active": true,
  "order": 0
}
```

---

### **5. Create Test/Quiz**

**Endpoint:** `POST /api/admin/lessons/{lessonId}/tests`

**Description:** Create a quiz for a lesson

**Authentication:** Admin JWT token required

**Request Body:**
```json
{
  "title": "Laravel Basics Quiz",
  "description": "Test your understanding of Laravel fundamentals",
  "questions": [
    {
      "id": 1,
      "question": "What command creates a new Laravel project?",
      "type": "multiple_choice",
      "options": [
        "laravel new project",
        "composer create-project laravel/laravel project",
        "npm create laravel",
        "php artisan new project"
      ],
      "correct_answer": 1,
      "points": 10
    },
    {
      "id": 2,
      "question": "What is Artisan?",
      "type": "multiple_choice",
      "options": [
        "A code editor",
        "A command-line tool",
        "A database driver",
        "A web server"
      ],
      "correct_answer": 1,
      "points": 10
    }
  ],
  "passing_score": 70,
  "time_limit_minutes": 10,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test created successfully",
  "data": {
    "test": {
      "id": 1,
      "lesson_id": 1,
      "title": "Laravel Basics Quiz",
      ...
    }
  }
}
```

---

### **6. Submit Test Attempt**

**Endpoint:** `POST /api/lessons/{lessonId}/tests/{testId}/attempt`

**Description:** Submit answers for a test (users can retry until they pass)

**Authentication:** User JWT token required

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": 1,
      "selected_answer": 1
    },
    {
      "question_id": 2,
      "selected_answer": 1
    }
  ]
}
```

**Response (Passed):**
```json
{
  "success": true,
  "message": "Test passed! Congratulations!",
  "data": {
    "attempt": {
      "id": 1,
      "test_id": 1,
      "user_id": 5,
      "score": 100,
      "passed": true,
      "time_taken_seconds": 120,
      "answers": [...],
      "created_at": "2025-01-15T00:00:00Z"
    },
    "can_proceed": true,
    "next_lesson_id": 2
  }
}
```

**Response (Failed - Can Retry):**
```json
{
  "success": true,
  "message": "Score: 50%. You need 70% to pass. Try again!",
  "data": {
    "attempt": {
      "id": 2,
      "test_id": 1,
      "user_id": 5,
      "score": 50,
      "passed": false,
      "time_taken_seconds": 95,
      "answers": [...],
      "created_at": "2025-01-15T00:05:00Z"
    },
    "can_proceed": false,
    "passing_score": 70,
    "attempts_count": 2,
    "can_retry": true
  }
}
```

---

### **7. Get Test Results**

**Endpoint:** `GET /api/lessons/{lessonId}/tests/{testId}/results`

**Description:** Get user's test attempts and results

**Authentication:** User JWT token required

**Response:**
```json
{
  "success": true,
  "data": {
    "test": {
      "id": 1,
      "title": "Laravel Basics Quiz",
      "passing_score": 70
    },
    "attempts": [
      {
        "id": 1,
        "score": 50,
        "passed": false,
        "created_at": "2025-01-15T00:00:00Z"
      },
      {
        "id": 2,
        "score": 80,
        "passed": true,
        "created_at": "2025-01-15T00:10:00Z"
      }
    ],
    "best_score": 80,
    "has_passed": true,
    "attempts_count": 2
  }
}
```

---

## 📊 Progress Tracking

### **8. Get User Progress**

**Endpoint:** `GET /api/courses/{courseId}/progress`

**Description:** Get user's progress in a course

**Authentication:** User JWT token required

**Response:**
```json
{
  "success": true,
  "data": {
    "course_id": 1,
    "total_lessons": 10,
    "completed_lessons": 3,
    "completion_percentage": 30,
    "current_lesson": {
      "id": 4,
      "title": "Routing in Laravel",
      "order": 3
    },
    "lessons_progress": [
      {
        "lesson_id": 1,
        "title": "Getting Started",
        "is_completed": true,
        "test_passed": true,
        "completed_at": "2025-01-10T00:00:00Z"
      },
      {
        "lesson_id": 2,
        "title": "Installation",
        "is_completed": true,
        "test_passed": true,
        "completed_at": "2025-01-11T00:00:00Z"
      },
      {
        "lesson_id": 3,
        "title": "Configuration",
        "is_completed": true,
        "test_passed": true,
        "completed_at": "2025-01-12T00:00:00Z"
      },
      {
        "lesson_id": 4,
        "title": "Routing in Laravel",
        "is_completed": false,
        "is_locked": false
      },
      {
        "lesson_id": 5,
        "title": "Controllers",
        "is_completed": false,
        "is_locked": true
      }
    ]
  }
}
```

---

### **9. Mark Lesson Complete**

**Endpoint:** `POST /api/lessons/{lessonId}/complete`

**Description:** Mark a lesson as completed (after passing test)

**Authentication:** User JWT token required

**Notes:**
- Automatically called when user passes the lesson test
- Can also be manually called for lessons without tests
- Updates user progress

**Response:**
```json
{
  "success": true,
  "message": "Lesson completed successfully",
  "data": {
    "lesson_id": 1,
    "completed_at": "2025-01-15T00:00:00Z",
    "next_lesson": {
      "id": 2,
      "title": "Laravel Installation",
      "is_unlocked": true
    }
  }
}
```

---

## 🔄 Complete Workflow

### **Admin: Creating Course Content**

1. **Create Course**
   ```
   POST /api/admin/courses
   ```

2. **Add Lessons**
   ```
   POST /api/admin/courses/{courseId}/lessons
   ```

3. **Add Quiz to Lesson**
   ```
   POST /api/admin/lessons/{lessonId}/tests
   ```

4. **Publish Course**
   ```
   PUT /api/admin/courses/{courseId}
   { "status": "published" }
   ```

---

### **User: Taking Course**

1. **Enroll in Course**
   ```
   POST /api/courses/{courseId}/enroll
   ```

2. **View First Lesson**
   ```
   GET /api/courses/{courseId}/lessons/1
   ```

3. **Watch Video/Read Content**
   - User studies the lesson content

4. **Take Quiz**
   ```
   POST /api/lessons/{lessonId}/tests/{testId}/attempt
   { "answers": [...] }
   ```

5. **If Failed: Retry**
   ```
   POST /api/lessons/{lessonId}/tests/{testId}/attempt
   { "answers": [...] }
   ```
   *User can retry unlimited times until passing score is achieved*

6. **If Passed: Proceed to Next Lesson**
   - Lesson automatically marked as complete
   - Next lesson unlocked
   - Repeat steps 2-6

---

## ✅ Key Features

### **1. Sequential Access**
- Lessons must be completed in order
- Can't skip ahead without completing previous lessons
- `canBeAccessedByUser()` method checks this

### **2. Unlimited Retries**
- Users can retry quizzes unlimited times
- Must achieve passing score to proceed
- Best score is tracked

### **3. Progress Tracking**
- Real-time progress updates
- Completion percentage
- Time tracking per lesson

### **4. Flexible Content**
- Video lessons (YouTube, Vimeo, etc.)
- Text content (Markdown/HTML)
- Downloadable files
- Multiple quiz types

---

## 🛠️ Database Schema

### **lessons**
```sql
id, course_id, title, content, video_url, duration_minutes, 
order, is_free_preview, created_at, updated_at
```

### **lesson_tests**
```sql
id, lesson_id, title, description, questions (JSON), 
passing_score, time_limit_minutes, is_active, order, 
created_at, updated_at
```

### **test_attempts**
```sql
id, test_id, user_id, score, passed, time_taken_seconds, 
answers (JSON), created_at, updated_at
```

### **lesson_progress**
```sql
id, lesson_id, user_id, is_completed, completed_at, 
time_spent_seconds, created_at, updated_at
```

---

## 🧪 Testing Examples

### **Create a Complete Lesson with Quiz**

```bash
# 1. Create Lesson
curl -X POST https://naqashthaheem.com/api/admin/courses/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Laravel",
    "content": "Laravel is a modern PHP framework...",
    "video_url": "https://youtube.com/watch?v=xyz",
    "duration_minutes": 30,
    "is_free_preview": true
  }'

# 2. Add Quiz to Lesson
curl -X POST https://naqashthaheem.com/api/admin/lessons/1/tests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Laravel Basics Quiz",
    "passing_score": 70,
    "questions": [
      {
        "id": 1,
        "question": "What is Laravel?",
        "type": "multiple_choice",
        "options": ["Framework", "Library", "Language", "Database"],
        "correct_answer": 0,
        "points": 50
      },
      {
        "id": 2,
        "question": "Laravel uses MVC?",
        "type": "multiple_choice",
        "options": ["Yes", "No"],
        "correct_answer": 0,
        "points": 50
      }
    ]
  }'
```

---

## 🚀 Best Practices

1. **Quiz Design:**
   - 5-10 questions per quiz
   - Passing score: 70-80%
   - Time limit: 1-2 minutes per question
   - Clear, concise questions

2. **Lesson Structure:**
   - Keep videos under 15 minutes
   - Break complex topics into multiple lessons
   - Always include a quiz for knowledge check
   - Use `is_free_preview` for first 1-2 lessons

3. **Content Organization:**
   - Number lessons logically (0, 1, 2...)
   - Group related topics
   - Build on previous knowledge
   - Review key concepts in quizzes

4. **User Experience:**
   - Provide immediate feedback on quiz attempts
   - Show correct answers after passing
   - Track time spent on lessons
   - Celebrate course completion

---

## 📚 Related Documentation

- **API_DOCUMENTATION.md** - Complete API reference
- **Course API** - Course management endpoints
- **Enrollment API** - User enrollment system
- **File Management** - Lesson files and downloads

---

**Happy Teaching!** 🎓


