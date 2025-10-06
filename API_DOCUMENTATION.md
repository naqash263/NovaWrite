# NovaWrite API Documentation

## Base URL
```
https://naqashthaheem.com/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📁 File Management API

### Upload File
**POST** `/files`

Upload a new file to the system.

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (multipart/form-data):**
```
file: [FILE] (required) - The file to upload
is_public: boolean (optional) - Whether the file is public (default: true)
```

**Supported File Types:**
- Images: JPG, JPEG, PNG, GIF, WebP, SVG
- Documents: PDF, DOC, DOCX, TXT
- Archives: ZIP
- Data: JSON

**Max File Size:** 10MB

**Response:**
```json
{
  "message": "File uploaded successfully.",
  "file": {
    "id": 1,
    "name": "example_image",
    "original_name": "example_image.jpg",
    "path": "uploads/1234567890_example_image.jpg",
    "mime_type": "image/jpeg",
    "size": 1024000,
    "is_public": true,
    "user_id": 1,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Get All Files
**GET** `/files`

Get all files uploaded by the authenticated user.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "example_image",
    "original_name": "example_image.jpg",
    "path": "uploads/1234567890_example_image.jpg",
    "mime_type": "image/jpeg",
    "size": 1024000,
    "is_public": true,
    "user_id": 1,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

### Get Files by Type
**GET** `/files/type/{type}`

Get files filtered by MIME type.

**Parameters:**
- `type` (string) - MIME type prefix (e.g., "image", "application", "text")

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example:**
```
GET /files/type/image
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "example_image",
    "original_name": "example_image.jpg",
    "path": "uploads/1234567890_example_image.jpg",
    "mime_type": "image/jpeg",
    "size": 1024000,
    "is_public": true,
    "user_id": 1,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z"
  }
]
```

### Download File
**GET** `/files/{id}/download`

Download a file by ID.

**Parameters:**
- `id` (integer) - File ID

**Response:** File download

---

## 📝 Posts API

### Create Post
**POST** `/posts`

Create a new blog post.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "title": "My Blog Post",
  "slug": "my-blog-post",
  "excerpt": "Short description of the post",
  "content": "Full blog post content in markdown",
  "featured_image": "https://naqashthaheem.com/storage/uploads/1234567890_image.jpg",
  "meta_title": "SEO Title",
  "meta_description": "SEO Description",
  "status": "published",
  "category_id": 1
}
```

**Response:**
```json
{
  "message": "Post created successfully",
  "post": {
    "id": 1,
    "title": "My Blog Post",
    "slug": "my-blog-post",
    "excerpt": "Short description of the post",
    "content": "Full blog post content in markdown",
    "featured_image": "https://naqashthaheem.com/storage/uploads/1234567890_image.jpg",
    "meta_title": "SEO Title",
    "meta_description": "SEO Description",
    "status": "published",
    "category_id": 1,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z"
  }
}
```

### Update Post
**PUT** `/posts/{id}`

Update an existing blog post.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** Same as create post

### Get All Posts
**GET** `/posts`

Get all published posts (public endpoint).

**Response:**
```json
[
  {
    "id": 1,
    "title": "My Blog Post",
    "slug": "my-blog-post",
    "excerpt": "Short description of the post",
    "featured_image": "https://naqashthaheem.com/storage/uploads/1234567890_image.jpg",
    "created_at": "2025-01-05T10:30:00.000000Z"
  }
]
```

---

## ⚡ Workflows API

### Create Workflow
**POST** `/admin/workflows`

Create a new workflow (Admin only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "workflow_category_id": 1,
  "title": "Automated Invoice Processing",
  "summary": "Streamline invoice processing from receipt to payment",
  "description": "This workflow automates the entire invoice processing pipeline...",
  "tools": ["Python", "Pandas", "OpenCV", "Email API"],
  "benefits": ["Faster processing", "Better accuracy", "Cost savings"],
  "status": "published",
  "is_featured": true,
  "image_url": "https://naqashthaheem.com/storage/uploads/1234567890_workflow.jpg"
}
```

**Response:**
```json
{
  "message": "Workflow created successfully",
  "workflow": {
    "id": 1,
    "title": "Automated Invoice Processing",
    "slug": "automated-invoice-processing",
    "summary": "Streamline invoice processing from receipt to payment",
    "description": "This workflow automates the entire invoice processing pipeline...",
    "tools": ["Python", "Pandas", "OpenCV", "Email API"],
    "benefits": ["Faster processing", "Better accuracy", "Cost savings"],
    "status": "published",
    "is_featured": true,
    "image_url": "https://naqashthaheem.com/storage/uploads/1234567890_workflow.jpg",
    "workflow_category_id": 1,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z"
  }
}
```

### Update Workflow
**PUT** `/admin/workflows/{id}`

Update an existing workflow (Admin only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** Same as create workflow

### Get All Workflows
**GET** `/workflows`

Get all published workflows (public endpoint).

**Response:**
```json
[
  {
    "id": 1,
    "title": "Automated Invoice Processing",
    "slug": "automated-invoice-processing",
    "summary": "Streamline invoice processing from receipt to payment",
    "tools": ["Python", "Pandas", "OpenCV", "Email API"],
    "benefits": ["Faster processing", "Better accuracy", "Cost savings"],
    "is_featured": true,
    "image_url": "https://naqashthaheem.com/storage/uploads/1234567890_workflow.jpg",
    "category": {
      "id": 1,
      "name": "Data Processing"
    },
    "created_at": "2025-01-05T10:30:00.000000Z"
  }
]
```

---

## 📚 Courses API

### Create Course
**POST** `/admin/courses`

Create a new course (Admin only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "title": "Complete Automation Course",
  "slug": "complete-automation-course",
  "description": "Learn how to build powerful automation workflows",
  "what_you_learn": "Build automation workflows\nMaster system analysis\nCreate efficient processes",
  "image_url": "https://naqashthaheem.com/storage/uploads/1234567890_course.jpg",
  "duration_hours": 20,
  "level": "intermediate",
  "is_published": true
}
```

**Response:**
```json
{
  "message": "Course created successfully",
  "course": {
    "id": 1,
    "title": "Complete Automation Course",
    "slug": "complete-automation-course",
    "description": "Learn how to build powerful automation workflows",
    "what_you_learn": "Build automation workflows\nMaster system analysis\nCreate efficient processes",
    "image_url": "https://naqashthaheem.com/storage/uploads/1234567890_course.jpg",
    "duration_hours": 20,
    "level": "intermediate",
    "is_published": true,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z"
  }
}
```

### Update Course
**PUT** `/admin/courses/{id}`

Update an existing course (Admin only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** Same as create course

### Get All Courses
**GET** `/courses`

Get all published courses (public endpoint).

**Response:**
```json
[
  {
    "id": 1,
    "title": "Complete Automation Course",
    "slug": "complete-automation-course",
    "description": "Learn how to build powerful automation workflows",
    "image_url": "https://naqashthaheem.com/storage/uploads/1234567890_course.jpg",
    "duration_hours": 20,
    "level": "intermediate",
    "created_at": "2025-01-05T10:30:00.000000Z"
  }
]
```

### Get Course Details
**GET** `/courses/{slug}`

Get detailed course information including lessons.

**Parameters:**
- `slug` (string) - Course slug

**Response:**
```json
{
  "id": 1,
  "title": "Complete Automation Course",
  "slug": "complete-automation-course",
  "description": "Learn how to build powerful automation workflows",
  "image_url": "https://naqashthaheem.com/storage/uploads/1234567890_course.jpg",
  "what_you_learn": "Build automation workflows\nMaster system analysis\nCreate efficient processes",
  "duration_hours": 20,
  "level": "intermediate",
  "lessons": [
    {
      "id": 1,
      "title": "Introduction to Automation",
      "content": "Welcome to the course...",
      "video_url": "https://youtube.com/watch?v=example",
      "duration_minutes": 30,
      "order": 1,
      "is_free_preview": true,
      "is_locked": false,
      "is_completed": false,
      "has_test": true,
      "test_passed": false
    }
  ],
  "enrolled_users_count": 150,
  "is_enrolled": false,
  "is_logged_in": true
}
```

### Enroll in Course
**POST** `/courses/{id}/enroll`

Enroll the authenticated user in a course.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Successfully enrolled in course",
  "enrollment": {
    "id": 1,
    "user_id": 1,
    "course_id": 1,
    "enrolled_at": "2025-01-05T10:30:00.000000Z"
  }
}
```

### Get My Courses
**GET** `/my-courses`

Get courses enrolled by the authenticated user.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Complete Automation Course",
    "slug": "complete-automation-course",
    "description": "Learn how to build powerful automation workflows",
    "image_url": "https://naqashthaheem.com/storage/uploads/1234567890_course.jpg",
    "duration_hours": 20,
    "level": "intermediate",
    "enrolled_at": "2025-01-05T10:30:00.000000Z",
    "progress": {
      "completed_lessons": 5,
      "total_lessons": 10,
      "completion_percentage": 50
    }
  }
]
```

---

## 📖 Lessons API

### Create Lesson
**POST** `/admin/courses/{courseId}/lessons`

Create a new lesson for a course (Admin only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "title": "Introduction to Automation",
  "content": "# Introduction to Automation\n\nWelcome to this comprehensive course on automation...",
  "video_url": "https://youtube.com/watch?v=example",
  "duration_minutes": 30,
  "is_free_preview": true
}
```

**Response:**
```json
{
  "message": "Lesson created successfully",
  "lesson": {
    "id": 1,
    "course_id": 1,
    "title": "Introduction to Automation",
    "content": "# Introduction to Automation\n\nWelcome to this comprehensive course on automation...",
    "video_url": "https://youtube.com/watch?v=example",
    "duration_minutes": 30,
    "order": 1,
    "is_free_preview": true,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z"
  }
}
```

### Update Lesson
**PUT** `/admin/courses/{courseId}/lessons/{id}`

Update an existing lesson (Admin only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** Same as create lesson

### Get Course Lessons
**GET** `/admin/courses/{courseId}/lessons`

Get all lessons for a specific course (Admin only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
[
  {
    "id": 1,
    "course_id": 1,
    "title": "Introduction to Automation",
    "content": "# Introduction to Automation\n\nWelcome to this comprehensive course on automation...",
    "video_url": "https://youtube.com/watch?v=example",
    "duration_minutes": 30,
    "order": 1,
    "is_free_preview": true,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z",
    "files": [
      {
        "id": 1,
        "file_path": "uploads/lesson1-resources.pdf",
        "description": "Course resources and materials"
      }
    ],
    "tests": [
      {
        "id": 1,
        "title": "Introduction Quiz",
        "description": "Test your understanding of the introduction",
        "questions": [
          {
            "id": 1,
            "question": "What is automation?",
            "options": {
              "A": "Manual work",
              "B": "Using technology to perform tasks automatically",
              "C": "Writing code",
              "D": "Data analysis"
            },
            "correct_answer": "B"
          }
        ],
        "passing_score": 70,
        "time_limit_minutes": 15,
        "is_active": true
      }
    ]
  }
]
```

### Delete Lesson
**DELETE** `/admin/courses/{courseId}/lessons/{id}`

Delete a lesson (Admin only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Lesson deleted successfully"
}
```

---

## 🧠 Quiz/Test API

### Create Lesson Test
**POST** `/admin/lessons/{lessonId}/tests`

Create a quiz/test for a lesson (Admin only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "title": "Introduction Quiz",
  "description": "Test your understanding of the introduction lesson",
  "questions": [
    {
      "id": 1,
      "question": "What is automation?",
      "options": {
        "A": "Manual work",
        "B": "Using technology to perform tasks automatically",
        "C": "Writing code",
        "D": "Data analysis"
      },
      "correct_answer": "B"
    },
    {
      "id": 2,
      "question": "Which of the following is NOT a benefit of automation?",
      "options": {
        "A": "Increased efficiency",
        "B": "Reduced errors",
        "C": "Higher costs",
        "D": "Time savings"
      },
      "correct_answer": "C"
    }
  ],
  "passing_score": 70,
  "time_limit_minutes": 15,
  "is_active": true,
  "order": 1
}
```

**Response:**
```json
{
  "message": "Test created successfully",
  "test": {
    "id": 1,
    "lesson_id": 1,
    "title": "Introduction Quiz",
    "description": "Test your understanding of the introduction lesson",
    "questions": [
      {
        "id": 1,
        "question": "What is automation?",
        "options": {
          "A": "Manual work",
          "B": "Using technology to perform tasks automatically",
          "C": "Writing code",
          "D": "Data analysis"
        },
        "correct_answer": "B"
      }
    ],
    "passing_score": 70,
    "time_limit_minutes": 15,
    "is_active": true,
    "order": 1,
    "created_at": "2025-01-05T10:30:00.000000Z",
    "updated_at": "2025-01-05T10:30:00.000000Z"
  }
}
```

### Update Lesson Test
**PUT** `/admin/lessons/{lessonId}/tests/{id}`

Update an existing test (Admin only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** Same as create test

### Get Lesson Test
**GET** `/lessons/{lessonId}/test`

Get the active test for a lesson (Authenticated users only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "test": {
    "id": 1,
    "lesson_id": 1,
    "title": "Introduction Quiz",
    "description": "Test your understanding of the introduction lesson",
    "questions": [
      {
        "id": 1,
        "question": "What is automation?",
        "options": {
          "A": "Manual work",
          "B": "Using technology to perform tasks automatically",
          "C": "Writing code",
          "D": "Data analysis"
        },
        "correct_answer": "B"
      }
    ],
    "passing_score": 70,
    "time_limit_minutes": 15,
    "is_active": true
  },
  "has_attempted": false,
  "has_passed": false
}
```

### Start Test
**POST** `/lessons/{lessonId}/test/start`

Start a test attempt (Authenticated users only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Test started",
  "attempt": {
    "id": 1,
    "user_id": 1,
    "lesson_test_id": 1,
    "started_at": "2025-01-05T10:30:00.000000Z",
    "answers": [],
    "score": null,
    "passed": false,
    "completed_at": null
  },
  "test": {
    "id": 1,
    "title": "Introduction Quiz",
    "description": "Test your understanding of the introduction lesson",
    "questions": [
      {
        "id": 1,
        "question": "What is automation?",
        "options": {
          "A": "Manual work",
          "B": "Using technology to perform tasks automatically",
          "C": "Writing code",
          "D": "Data analysis"
        }
      }
    ],
    "passing_score": 70,
    "time_limit_minutes": 15
  }
}
```

### Submit Test
**POST** `/lessons/{lessonId}/test/submit`

Submit test answers (Authenticated users only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "attempt_id": 1,
  "answers": ["B", "C"],
  "time_spent_minutes": 12
}
```

**Response:**
```json
{
  "message": "Test passed!",
  "attempt": {
    "id": 1,
    "user_id": 1,
    "lesson_test_id": 1,
    "answers": ["B", "C"],
    "score": 85,
    "passed": true,
    "started_at": "2025-01-05T10:30:00.000000Z",
    "completed_at": "2025-01-05T10:42:00.000000Z",
    "time_taken_minutes": 12
  },
  "score": 85,
  "passed": true,
  "lesson_completed": true
}
```

### Get Test Results
**GET** `/lessons/{lessonId}/test/results`

Get test results for a lesson (Authenticated users only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "test": {
    "id": 1,
    "title": "Introduction Quiz",
    "description": "Test your understanding of the introduction lesson",
    "passing_score": 70,
    "time_limit_minutes": 15
  },
  "latest_attempt": {
    "id": 1,
    "user_id": 1,
    "lesson_test_id": 1,
    "answers": ["B", "C"],
    "score": 85,
    "passed": true,
    "started_at": "2025-01-05T10:30:00.000000Z",
    "completed_at": "2025-01-05T10:42:00.000000Z",
    "time_taken_minutes": 12
  }
}
```

---

## 📈 Lesson Progress API

### Mark Lesson Complete
**POST** `/lessons/{lessonId}/complete`

Mark a lesson as completed (Authenticated users only).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "time_spent_minutes": 30,
  "progress_data": {
    "video_watched": true,
    "notes_taken": true,
    "resources_downloaded": ["resource1.pdf", "resource2.docx"]
  }
}
```

**Response:**
```json
{
  "message": "Lesson marked as completed",
  "progress": {
    "id": 1,
    "user_id": 1,
    "lesson_id": 1,
    "is_completed": true,
    "completed_at": "2025-01-05T10:30:00.000000Z",
    "time_spent_minutes": 30,
    "progress_data": {
      "video_watched": true,
      "notes_taken": true,
      "resources_downloaded": ["resource1.pdf", "resource2.docx"]
    }
  }
}
```

### Get Lesson Progress
**GET** `/lessons/{lessonId}/progress`

Get progress for a specific lesson (Authenticated users only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "lesson_id": 1,
  "is_completed": true,
  "completed_at": "2025-01-05T10:30:00.000000Z",
  "time_spent_minutes": 30,
  "progress_data": {
    "video_watched": true,
    "notes_taken": true,
    "resources_downloaded": ["resource1.pdf", "resource2.docx"]
  }
}
```

### Get Course Progress
**GET** `/courses/{courseId}/progress`

Get progress for all lessons in a course (Authenticated users only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "1": {
    "id": 1,
    "user_id": 1,
    "lesson_id": 1,
    "is_completed": true,
    "completed_at": "2025-01-05T10:30:00.000000Z",
    "time_spent_minutes": 30
  },
  "2": {
    "id": 2,
    "user_id": 1,
    "lesson_id": 2,
    "is_completed": false,
    "completed_at": null,
    "time_spent_minutes": 0
  }
}
```

### Reset Lesson Progress
**DELETE** `/lessons/{lessonId}/progress`

Reset progress for a specific lesson (Authenticated users only).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Lesson progress reset"
}
```

---

## 🔐 Authentication API

### Register User
**POST** `/auth/register`

Register a new user account.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2025-01-05T10:30:00.000000Z"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Login User
**POST** `/auth/login`

Login with email and password.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Get Current User
**GET** `/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "created_at": "2025-01-05T10:30:00.000000Z",
  "updated_at": "2025-01-05T10:30:00.000000Z"
}
```

---

## 📊 Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required."],
    "email": ["The email must be a valid email address."]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "file": ["The file must be a file of type: jpg, jpeg, png, gif, webp, svg."]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Server Error"
}
```

---

## 🔧 Image Upload Examples

### Using cURL

#### Upload Image for Post
```bash
curl -X POST https://naqashthaheem.com/api/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "is_public=true"
```

#### Upload Image for Workflow
```bash
curl -X POST https://naqashthaheem.com/api/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/workflow-image.png" \
  -F "is_public=true"
```

#### Upload Image for Course
```bash
curl -X POST https://naqashthaheem.com/api/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/course-image.jpg" \
  -F "is_public=true"
```

### Using JavaScript/Fetch

```javascript
// Upload file
const uploadFile = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('is_public', 'true');

  const response = await fetch('https://naqashthaheem.com/api/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};

// Create post with image
const createPost = async (postData, imageFile, token) => {
  // First upload the image
  const imageResponse = await uploadFile(imageFile, token);
  const imageUrl = `https://naqashthaheem.com/storage/${imageResponse.file.path}`;

  // Then create the post
  const response = await fetch('https://naqashthaheem.com/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...postData,
      featured_image: imageUrl
    })
  });

  return await response.json();
};
```

### Using Python/Requests

```python
import requests

def upload_file(file_path, token):
    url = "https://naqashthaheem.com/api/files"
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(file_path, 'rb') as file:
        files = {'file': file}
        data = {'is_public': 'true'}
        response = requests.post(url, headers=headers, files=files, data=data)
    
    return response.json()

def create_post_with_image(post_data, image_path, token):
    # Upload image first
    image_response = upload_file(image_path, token)
    image_url = f"https://naqashthaheem.com/storage/{image_response['file']['path']}"
    
    # Create post
    url = "https://naqashthaheem.com/api/posts"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    post_data['featured_image'] = image_url
    response = requests.post(url, headers=headers, json=post_data)
    
    return response.json()

def create_course_with_lessons_and_quizzes(token):
    # 1. Upload course image
    image_response = upload_file("course-image.jpg", token)
    course_image_url = f"https://naqashthaheem.com/storage/{image_response['file']['path']}"
    
    # 2. Create course
    course_data = {
        "title": "Complete Automation Course",
        "slug": "complete-automation-course",
        "description": "Learn how to build powerful automation workflows",
        "what_you_learn": "Build automation workflows\nMaster system analysis\nCreate efficient processes",
        "image_url": course_image_url,
        "duration_hours": 20,
        "level": "intermediate",
        "is_published": True
    }
    
    course_response = requests.post(
        "https://naqashthaheem.com/api/admin/courses",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=course_data
    )
    course = course_response.json()['course']
    
    # 3. Create lessons
    lessons_data = [
        {
            "title": "Introduction to Automation",
            "content": "# Introduction to Automation\n\nWelcome to this comprehensive course on automation...",
            "video_url": "https://youtube.com/watch?v=example1",
            "duration_minutes": 30,
            "is_free_preview": True
        },
        {
            "title": "Building Your First Workflow",
            "content": "# Building Your First Workflow\n\nIn this lesson, we'll create a simple automation...",
            "video_url": "https://youtube.com/watch?v=example2",
            "duration_minutes": 45,
            "is_free_preview": False
        }
    ]
    
    created_lessons = []
    for lesson_data in lessons_data:
        lesson_response = requests.post(
            f"https://naqashthaheem.com/api/admin/courses/{course['id']}/lessons",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=lesson_data
        )
        created_lessons.append(lesson_response.json()['lesson'])
    
    # 4. Create quizzes for lessons
    quiz_data = [
        {
            "title": "Introduction Quiz",
            "description": "Test your understanding of the introduction lesson",
            "questions": [
                {
                    "id": 1,
                    "question": "What is automation?",
                    "options": {
                        "A": "Manual work",
                        "B": "Using technology to perform tasks automatically",
                        "C": "Writing code",
                        "D": "Data analysis"
                    },
                    "correct_answer": "B"
                },
                {
                    "id": 2,
                    "question": "Which of the following is NOT a benefit of automation?",
                    "options": {
                        "A": "Increased efficiency",
                        "B": "Reduced errors",
                        "C": "Higher costs",
                        "D": "Time savings"
                    },
                    "correct_answer": "C"
                }
            ],
            "passing_score": 70,
            "time_limit_minutes": 15,
            "is_active": True,
            "order": 1
        }
    ]
    
    for i, quiz in enumerate(quiz_data):
        requests.post(
            f"https://naqashthaheem.com/api/admin/lessons/{created_lessons[i]['id']}/tests",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=quiz
        )
    
    return course, created_lessons
```

### Complete Course Creation Example (JavaScript)

```javascript
// Complete course creation with lessons and quizzes
const createCompleteCourse = async (token) => {
  try {
    // 1. Upload course image
    const courseImageFormData = new FormData();
    courseImageFormData.append('file', courseImageFile);
    courseImageFormData.append('is_public', 'true');
    
    const imageResponse = await fetch('https://naqashthaheem.com/api/files', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: courseImageFormData
    });
    const imageData = await imageResponse.json();
    const courseImageUrl = `https://naqashthaheem.com/storage/${imageData.file.path}`;
    
    // 2. Create course
    const courseData = {
      title: "Complete Automation Course",
      slug: "complete-automation-course",
      description: "Learn how to build powerful automation workflows",
      what_you_learn: "Build automation workflows\nMaster system analysis\nCreate efficient processes",
      image_url: courseImageUrl,
      duration_hours: 20,
      level: "intermediate",
      is_published: true
    };
    
    const courseResponse = await fetch('https://naqashthaheem.com/api/admin/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(courseData)
    });
    const course = await courseResponse.json();
    
    // 3. Create lessons
    const lessons = [
      {
        title: "Introduction to Automation",
        content: "# Introduction to Automation\n\nWelcome to this comprehensive course on automation...",
        video_url: "https://youtube.com/watch?v=example1",
        duration_minutes: 30,
        is_free_preview: true
      },
      {
        title: "Building Your First Workflow",
        content: "# Building Your First Workflow\n\nIn this lesson, we'll create a simple automation...",
        video_url: "https://youtube.com/watch?v=example2",
        duration_minutes: 45,
        is_free_preview: false
      }
    ];
    
    const createdLessons = [];
    for (const lessonData of lessons) {
      const lessonResponse = await fetch(`https://naqashthaheem.com/api/admin/courses/${course.course.id}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lessonData)
      });
      const lesson = await lessonResponse.json();
      createdLessons.push(lesson.lesson);
    }
    
    // 4. Create quizzes
    const quizzes = [
      {
        title: "Introduction Quiz",
        description: "Test your understanding of the introduction lesson",
        questions: [
          {
            id: 1,
            question: "What is automation?",
            options: {
              "A": "Manual work",
              "B": "Using technology to perform tasks automatically",
              "C": "Writing code",
              "D": "Data analysis"
            },
            correct_answer: "B"
          }
        ],
        passing_score: 70,
        time_limit_minutes: 15,
        is_active: true,
        order: 1
      }
    ];
    
    for (let i = 0; i < quizzes.length; i++) {
      await fetch(`https://naqashthaheem.com/api/admin/lessons/${createdLessons[i].id}/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quizzes[i])
      });
    }
    
    return { course: course.course, lessons: createdLessons };
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};
```

### Student Taking a Course Example

```javascript
// Student taking a course and quiz
const takeCourseAndQuiz = async (token, courseId, lessonId) => {
  try {
    // 1. Enroll in course
    await fetch(`https://naqashthaheem.com/api/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 2. Get lesson test
    const testResponse = await fetch(`https://naqashthaheem.com/api/lessons/${lessonId}/test`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const testData = await testResponse.json();
    
    // 3. Start test
    const startResponse = await fetch(`https://naqashthaheem.com/api/lessons/${lessonId}/test/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const startData = await startResponse.json();
    
    // 4. Submit test answers
    const submitData = {
      attempt_id: startData.attempt.id,
      answers: ["B", "C"], // Student's answers
      time_spent_minutes: 12
    };
    
    const submitResponse = await fetch(`https://naqashthaheem.com/api/lessons/${lessonId}/test/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(submitData)
    });
    const result = await submitResponse.json();
    
    // 5. Mark lesson complete if test passed
    if (result.passed) {
      await fetch(`https://naqashthaheem.com/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          time_spent_minutes: 30,
          progress_data: {
            video_watched: true,
            notes_taken: true,
            test_passed: true
          }
        })
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error taking course:', error);
    throw error;
  }
};
```

---

## 📝 Notes

1. **File URLs**: After uploading a file, use the returned `path` to construct the full URL: `https://naqashthaheem.com/storage/{path}`

2. **Image Optimization**: The system automatically optimizes uploaded images for web use.

3. **File Types**: Supported file types are validated on both frontend and backend.

4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse.

5. **CORS**: The API supports CORS for cross-origin requests from authorized domains.

6. **Pagination**: List endpoints support pagination with `page` and `per_page` parameters.

7. **Search**: Most list endpoints support search with a `search` parameter.

8. **Sorting**: List endpoints support sorting with `sort` and `order` parameters.

---

## 🚀 Getting Started

1. **Register** a new account using `/auth/register`
2. **Login** to get your JWT token using `/auth/login`
3. **Upload** images using `/files` endpoint
4. **Create** content using the appropriate endpoints with the image URLs
5. **Use** the JWT token in the Authorization header for all protected endpoints

For more information or support, contact: naqash263@gmail.com
