# Overview

This project is a comprehensive portfolio and blog website for Naqash Thaheem, a Systems Analyst & Automation Specialist. It features a Laravel 11 backend and a React + Vite + TypeScript frontend. The application provides a professional portfolio, a full-featured blog system, and an admin dashboard for content management. Key capabilities include JWT authentication, blog posts with file attachments, category filtering, search functionality, and a protected admin panel. The site aims to showcase skills, experience, and provide a platform for sharing insights, with advanced features like an interactive home page, SEO enhancements for blog content, and a workflow management system with email-gated downloads for lead generation.

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
- Public routes: `/`, `/about`, `/workflows`, `/contact`, `/blog`, `/blog/:slug`, `/admin/login`.
- Protected admin routes: `/admin`, `/admin/categories`, `/admin/posts`, `/admin/files`.
- 404 page for unmatched routes.

**Key Pages:**
- **Home**: Interactive landing page with 11 sections including Hero, Statistics, Video Introduction, Why Choose Me, Core Expertise, Skills Progress Bars, Portfolio Showcase, Professional Timeline, Services, Testimonials, and Contact Form. Features extensive animations and design elements.
- **About**: Professional summary, core skills, featured projects, professional experience, education & languages.
- **Workflows**: Showcase page with 6 automation workflow examples, descriptions, tools, and benefits.
- **Contact**: Contact information.
- **Blog**: Search bar, category filters, blog post cards with pagination.
- **Blog Detail**: Full post view with HTML content, metadata, and file attachments.
- **Admin Pages**: Login, Dashboard, and full CRUD interfaces for Categories, Posts, and Files.

## Backend Architecture

**Technology Stack:**
- Laravel 11.46.1 (PHP 8.4.10)
- JWT authentication (`php-open-source-saver/jwt-auth`)
- PostgreSQL database
- Laravel Storage for file management

**Authentication:**
- JWT-based stateless authentication.
- Bearer token authentication for API requests.
- Auth endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/refresh`.

**API Design:**
- RESTful API endpoints under `/api`.
- JSON request/response format.
- CORS enabled.
- Token-based authorization middleware (`auth:api`).

**Models & Relationships:**
- User (has many Posts).
- Category (has many Posts).
- Post (belongs to Category and User).
- File (belongs to User).
- WorkflowCategory, Workflow, WorkflowFile, WorkflowDownload for workflow management.

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
- `GET /api/workflows` (list with category filter)
- `GET /api/workflows/{slug}` (detail)
- `GET /api/workflow-categories`
- `POST /api/workflow-downloads` (email capture for downloads)
- `GET /api/workflow-files/{id}/download?token={uuid}` (secure download)

### Protected Endpoints (require authentication)
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
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