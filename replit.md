# Overview

This project is a comprehensive portfolio and blog website for Naqash Thaheem, a Systems Analyst & Automation Specialist. It features a Laravel 11 backend and a React + Vite + TypeScript frontend. The application provides a professional portfolio, a full-featured blog system, free courses for registered users, premium workflow downloads, and an admin dashboard for content management. Key capabilities include JWT authentication with role-based access (admin/user), blog posts with file attachments, category filtering, search functionality, course enrollment system, premium workflow gating, and a protected admin panel. The site aims to showcase skills, experience, and provide a platform for sharing insights and educational content.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React 19 with TypeScript
- Vite 7
- React Router DOM
- TanStack Query
- Axios
- Tailwind CSS v3

**API Configuration:**
- Frontend proxies API requests through Vite dev server to backend (port 8000)
- Uses relative path `/api` in `frontend/.env` (VITE_API_BASE_URL=/api)
- Vite proxy config in `vite.config.ts` forwards `/api/*` to `http://localhost:8001`
- This avoids CORS/mixed-content issues between HTTPS frontend and HTTP backend

**Design System:**
- Utility-first styling with Tailwind CSS v3.
- Primary color: Blue (blue-600, blue-700).
- Professional color scheme with responsive, mobile-first design.

**Design Patterns:**
- Custom hooks for authentication (useAuth) and SEO (useSEO).
- Protected routes for admin access.
- Centralized API client with JWT token injection.
- Error boundaries for graceful error handling.

**Component Structure:**
- Layout component with responsive navigation and footer.
- `ProtectedRoute` and `ErrorBoundary` components.
- Reusable components: `PostCard`, `CategoryFilter`, `FileList`.
- Separation of public (Home, Blog, Workflows, About, Contact) and admin (Dashboard, Categories, Posts, Files) pages.

**Routing Strategy:**
- Public routes: `/`, `/about`, `/workflows`, `/contact`, `/blog`, `/blog/:slug`, `/login`, `/register`, `/courses`, `/courses/:slug`.
- User routes (require login): `/my-courses`.
- Protected admin routes: `/admin/login`, `/admin`, `/admin/categories`, `/admin/posts`, `/admin/files`, `/admin/workflow-categories`, `/admin/workflows`, `/admin/courses`.
- 404 page for unmatched routes.

**Key Pages:**
- **Home**: Interactive landing page with 11 sections including Hero, Statistics, Video Introduction, Why Choose Me, Core Expertise, Skills Progress Bars, Portfolio Showcase, Professional Timeline, Services, Testimonials, and Contact Form. Features extensive animations and design elements.
- **About**: Professional summary, core skills, featured projects, professional experience, education & languages.
- **Workflows**: Showcase page with automation workflow examples. Premium workflows show 👑 Premium badge and require user authentication to download.
- **Contact**: Contact information.
- **Blog**: Search bar, category filters, blog post cards with pagination.
- **Blog Detail**: Full post view with HTML content, metadata, and file attachments.
- **Courses**: Browse all available courses with enrollment status indicators.
- **Course Detail**: View lessons, enroll in course, and access lesson content (locked for non-enrolled users).
- **My Courses**: Dashboard showing enrolled courses with progress tracking.
- **Login/Register**: User authentication pages for accessing courses and premium workflows.
- **Admin Pages**: Login, Dashboard, and full CRUD interfaces for Categories, Posts, Files, Workflow Categories, Workflows, and Courses.

## Backend Architecture

**Technology Stack:**
- Laravel 11.46.1 (PHP 8.4.10)
- JWT authentication (`php-open-source-saver/jwt-auth`)
- PostgreSQL database
- Laravel Storage for file management

**Authentication:**
- JWT-based stateless authentication.
- Bearer token authentication for API requests.
- Role-based access control (admin/user roles).
- Auth endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/refresh`.

**API Design:**
- RESTful API endpoints under `/api`.
- JSON request/response format.
- CORS enabled.
- Token-based authorization middleware (`auth:api`).

**Models & Relationships:**
- User (has many Posts, Enrollments; role: admin/user).
- Category (has many Posts).
- Post (belongs to Category and User).
- File (belongs to User).
- Course (has many Lessons and Enrollments).
- Lesson (belongs to Course).
- Enrollment (belongs to User and Course; tracks progress).
- WorkflowCategory, Workflow (has is_premium flag), WorkflowFile, WorkflowDownload for workflow management.

**Security Features:**
- File downloads gated by `is_public` flag and user authentication.
- Private files accessible only by authenticated owner.
- Password hashing (bcrypt).
- JWT secret key for token signing.
- CSRF protection.

**Database Strategy:**
- Eloquent ORM.
- Migration-based schema management.
- Automatic timestamp tracking.
- Foreign key constraints with cascade on delete.

## API Endpoints

### Public Endpoints
- `GET /api/posts`
- `GET /api/posts/{id}`
- `GET /api/categories`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/files/{id}/download`
- `GET /api/workflows` (list with category filter; shows is_premium flag)
- `GET /api/workflows/{slug}` (detail)
- `GET /api/workflow-categories`
- `POST /api/workflow-downloads` (email capture; protected for premium workflows)
- `GET /api/workflow-files/{id}/download?token={uuid}` (secure download)
- `GET /api/courses` (list all published courses)
- `GET /api/courses/{slug}` (course detail with lessons)

### Protected Endpoints (require authentication)
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/courses/{id}/enroll` (enroll in course)
- `GET /api/my-courses` (user's enrolled courses)
- `GET /api/admin/posts`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`
- `POST /api/posts`
- `PUT /api/posts/{id}`
- `DELETE /api/posts/{id}`
- `GET /api/files`
- `POST /api/files`
- `DELETE /api/files/{id}`
- `GET /api/admin/courses` (list all courses with lessons count)
- `POST /api/admin/courses` (create course with validation)
- `PUT /api/admin/courses/{id}` (update course)
- `DELETE /api/admin/courses/{id}` (delete course)
- Admin CRUD for workflow categories and workflows under `/api/admin/*`.

# External Dependencies

**Frontend:**
- `@tanstack/react-query`: Server state management.
- `axios`: HTTP client.
- `react-router-dom`: Client-side routing.

**Backend:**
- `php-open-source-saver/jwt-auth`: JWT authentication.
- Laravel Storage: File management.
- PostgreSQL: Database.