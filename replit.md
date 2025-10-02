# Overview

This is a full-stack blog application built with a Laravel 11 backend and React frontend. The application provides a comprehensive content management system for creating, managing, and publishing blog posts with categories and file management capabilities. Users can browse published posts on the frontend, while authenticated administrators can manage content through a dedicated admin dashboard with rich text editing.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (October 2, 2025)

- Completed full-stack blog system implementation with Laravel 11 + React
- Implemented JWT authentication with secure token-based auth
- Created comprehensive admin dashboard with CRUD operations for categories, posts, and files
- Integrated custom rich text editor with formatting toolbar (bold, italic, headings, lists, links)
- Applied custom design system with specified color palette and typography
- Configured secure file upload/download system with public/private file support
- Set up both Backend and Frontend workflows for development

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React 19 with TypeScript
- Vite 7 as build tool and development server (configured for host 0.0.0.0:5000)
- React Router DOM for client-side routing
- TanStack Query for server state management
- Axios for HTTP requests with JWT token injection
- Custom CSS with CSS variables for theming

**Design System:**
- Primary Color: `hsl(96, 85.19%, 73.53%)` (light green)
- Secondary Color: `hsl(0, 0%, 0%)` (black)
- Background: `hsl(0, 0%, 100%)` (white)
- Card Background: `hsl(0, 0%, 96.47%)` (light gray)
- Typography: Space Grotesk (headings), Geist (body), Geist Mono (code)
- Spacing Unit: 0.25rem base with calc() multipliers
- Sharp edges with 0rem border radius throughout

**Design Patterns:**
- Context API for authentication state management (AuthContext)
- Protected routes for admin-only pages
- Custom hooks pattern for auth operations
- Centralized API client configuration with automatic JWT token injection

**Component Structure:**
- Layout component with persistent navigation and footer
- Protected route wrapper for authentication checks
- Custom HtmlEditor component for rich text content editing
- Separation between public pages (Home, Blog, BlogPost, Login) and admin pages (Dashboard, Categories, Posts, Files)

**Routing Strategy:**
- Public routes: `/`, `/blog`, `/blog/:id`, `/login`
- Protected admin routes: `/admin`, `/admin/categories`, `/admin/posts`, `/admin/files`
- All routes render within a shared Layout component

## Backend Architecture

**Technology Stack:**
- Laravel 11.46.1 (PHP 8.4.10)
- JWT authentication via php-open-source-saver/jwt-auth v2.8.2
- PostgreSQL database (Neon-backed via Replit)
- Laravel Storage with public disk for file management

**Authentication:**
- JWT-based stateless authentication
- Token stored in localStorage on frontend
- Bearer token authentication for API requests
- Auth endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/refresh`

**API Design:**
- RESTful API endpoints under `/api` prefix
- JSON request/response format
- CORS enabled via built-in Laravel CORS middleware
- Token-based authorization middleware (`auth:api` guard)

**Models & Relationships:**
- User: Has many Posts
- Category: Has many Posts
- Post: Belongs to Category and User (includes title, slug, content, excerpt, featured_image, is_published, views)
- File: Belongs to User (includes name, path, mime_type, size, is_public, downloads)

**Security Features:**
- File downloads gated by is_public flag and user authentication
- Private files only accessible by file owner when authenticated
- Password hashing via bcrypt
- JWT secret key for token signing
- CSRF protection via Laravel middleware

**Database Strategy:**
- Eloquent ORM for database operations
- Migration-based schema management
- Automatic timestamp tracking (created_at, updated_at)
- Foreign key constraints with cascade on delete

## API Endpoints

### Public Endpoints
- `GET /api/posts` - List published posts (supports search and category filter)
- `GET /api/posts/{id}` - Get single published post (increments views)
- `GET /api/categories` - List all categories with post counts
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/files/{id}/download` - Download file (public or owner only)

### Protected Endpoints (require authentication)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout current user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/admin/posts` - List all posts (including drafts)
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
- `POST /api/posts` - Create post
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post
- `GET /api/files` - List all files
- `POST /api/files` - Upload file
- `DELETE /api/files/{id}` - Delete file

## Development Workflows

**Backend Workflow:**
- Command: `cd backend && php artisan serve --host=0.0.0.0 --port=8000`
- Port: 8000
- Output: Console

**Frontend Workflow:**
- Command: `cd frontend && npm run dev`
- Port: 5000
- Output: Webview

## External Dependencies

**Frontend:**
- @tanstack/react-query: Server state management and caching
- axios: HTTP client with interceptors
- react-router-dom: Client-side routing

**Backend:**
- php-open-source-saver/jwt-auth: JWT authentication implementation
- Laravel Storage: File management
- PostgreSQL: Database

**Development Tools:**
- Vite: Frontend build tooling
- PHPUnit: Backend testing
- TypeScript ESLint: Frontend code quality

## Environment Configuration

**Frontend (.env):**
- `VITE_API_URL`: API base URL (default: http://localhost:8000/api)

**Backend (.env):**
- Database connection via Replit environment variables (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)
- JWT secret auto-generated
- App key auto-generated

## Notes

- Both workflows are configured and running
- No mock or placeholder data used - real database integration
- File upload system supports both public and private files with proper access control
- Rich text editor implemented with contentEditable and document.execCommand for formatting
- All styling follows the specified design system with custom CSS variables
