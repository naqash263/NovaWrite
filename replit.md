# Overview

This is a comprehensive portfolio + blog website for Naqash Thaheem (Systems Analyst & Automation Specialist) built with Laravel 11 backend and React + Vite + TypeScript frontend. The application provides a professional portfolio showcasing skills and experience, along with a full-featured blog system and admin dashboard for content management. Features include JWT authentication, blog posts with file attachments, category filtering, search functionality, and a protected admin panel.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (October 2, 2025)

- Complete frontend rebuild with Tailwind CSS v3 for consistent, professional styling
- Implemented personal branding for Naqash Thaheem (Systems Analyst & Automation Specialist)
- Created comprehensive pages: Home (hero + featured posts), About (skills/experience), Contact, Blog (search/filters), Blog Detail, Admin Login, Admin Dashboard
- Developed reusable components: PostCard, CategoryFilter, FileList, Layout, ErrorBoundary, ProtectedRoute
- Created useAuth hook for authentication management and SEO utility for page meta tags
- Fixed Laravel 11 compatibility issues (removed deprecated middleware, updated routes)
- Resolved database connection and session configuration for stateless JWT API
- Both backend (Laravel/PostgreSQL on port 8000) and frontend (React/Vite on port 5000) running successfully

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React 19 with TypeScript
- Vite 7 as build tool and development server (configured for host 0.0.0.0:5000)
- React Router DOM for client-side routing
- TanStack Query for server state management
- Axios for HTTP requests with JWT token injection
- Tailwind CSS v3 for utility-first styling

**Design System:**
- Tailwind CSS v3 utility classes for all styling
- Primary color: Blue (blue-600, blue-700 for hover states)
- Professional color scheme with gray scale for text and backgrounds
- Responsive design with mobile-first approach
- Consistent spacing and typography using Tailwind's default scale

**Design Patterns:**
- Custom hooks for auth operations (useAuth) and SEO management (useSEO)
- Protected routes for admin-only pages
- Centralized API client configuration with automatic JWT token injection
- Error boundaries for graceful error handling

**Component Structure:**
- Layout component with responsive navigation (Home, Blog, About, Contact, Admin links) and footer
- ProtectedRoute wrapper for authentication checks on admin pages
- ErrorBoundary component for error handling
- Reusable components: PostCard (blog listing cards), CategoryFilter (category pills), FileList (file attachments display)
- Separation between public pages (Home, About, Contact, Blog, BlogPost) and admin pages (Dashboard, Categories, Posts, Files)

**Routing Strategy:**
- Public routes: `/` (Home), `/about`, `/contact`, `/blog` (listing), `/blog/:slug` (detail), `/admin/login`
- Protected admin routes: `/admin` (Dashboard), `/admin/categories`, `/admin/posts`, `/admin/files`
- 404 page for unmatched routes
- All routes render within a shared Layout component

**Key Pages:**
- **Home**: Professional hero section with Naqash Thaheem's name, title, tagline, contact info (location, email, phone), plus featured blog posts (latest 3) and CTA to view all posts
- **About**: Professional summary, core skills (Automation & AI, CRM & Integrations, Web & App Development, Databases & Cloud), notable experience highlights
- **Contact**: Contact information with icons for easy reach
- **Blog**: Search bar, category filters (pills), blog post cards with cover images, excerpts, category badges, dates, and view counts, plus pagination
- **Blog Detail**: Full post view with cover image, title, HTML content rendering, metadata (category, author, date, views), and file attachments list with download links
- **Admin Login**: Simple form with email/password authentication
- **Admin Dashboard**: Quick links to manage Categories, Posts, and Files
- **Admin Categories/Posts/Files**: Full CRUD interfaces with forms, tables, and delete confirmations

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
- `VITE_API_BASE_URL`: API base URL (development: http://localhost:8000/api, production: https://www.naqashthaheem.com/api)

**Backend (.env):**
- Database connection via Replit environment variables (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)
- JWT secret auto-generated
- App key auto-generated

## Notes

- Both workflows are configured and running
- No mock or placeholder data used - real database integration
- File upload system supports both public and private files with proper access control
- Blog posts support HTML content (textarea in admin, rendered with dangerouslySetInnerHTML in frontend)
- All styling uses Tailwind CSS v3 utility classes
- Professional branding for Naqash Thaheem throughout the site
- Environment configuration includes .env.example for production deployment guidance
- Ready for deployment to www.naqashthaheem.com (update VITE_API_BASE_URL in .env for production)
