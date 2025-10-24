import { useState } from 'react';
import { useSEO } from '../../utils/seo';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: string;
  }[];
  response?: {
    status: number;
    description: string;
    example: any;
  }[];
  authentication?: string;
  rateLimit?: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // Posts API
  {
    method: 'GET',
    path: '/api/posts',
    description: 'Get all published posts with filtering and pagination',
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Search in title, excerpt, content, or tags', example: 'react' },
      { name: 'category_id', type: 'integer', required: false, description: 'Filter by category ID', example: '1' },
      { name: 'category_slug', type: 'string', required: false, description: 'Filter by category slug', example: 'technology' },
      { name: 'tags', type: 'string|array', required: false, description: 'Filter by tag IDs (comma-separated or array)', example: '1,2,3' },
      { name: 'tag_slugs', type: 'string|array', required: false, description: 'Filter by tag slugs', example: 'react,javascript' },
      { name: 'since', type: 'string|number', required: false, description: 'Get posts created/updated after timestamp (ISO 8601 or Unix)', example: '2024-01-01T00:00:00Z' },
      { name: 'date_from', type: 'string', required: false, description: 'Filter by published date from', example: '2024-01-01' },
      { name: 'date_to', type: 'string', required: false, description: 'Filter by published date to', example: '2024-12-31' },
      { name: 'author_id', type: 'integer', required: false, description: 'Filter by author ID', example: '1' },
      { name: 'featured', type: 'boolean', required: false, description: 'Filter featured posts', example: 'true' },
      { name: 'min_views', type: 'integer', required: false, description: 'Minimum view count', example: '100' },
      { name: 'sort_by', type: 'string', required: false, description: 'Sort field', example: 'published_at' },
      { name: 'sort_order', type: 'string', required: false, description: 'Sort order (asc/desc)', example: 'desc' },
      { name: 'per_page', type: 'integer', required: false, description: 'Posts per page (max 100)', example: '20' },
      { name: 'page', type: 'integer', required: false, description: 'Page number', example: '1' }
    ],
    response: [
      { status: 200, description: 'Success', example: { data: [], current_page: 1, last_page: 5, total: 100 } },
      { status: 400, description: 'Invalid parameters', example: { error: 'Invalid parameter format' } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  {
    method: 'GET',
    path: '/api/posts/latest',
    description: 'Get latest posts since a specific timestamp (convenience endpoint)',
    parameters: [
      { name: 'since', type: 'string|number', required: true, description: 'Timestamp to get posts since (ISO 8601 or Unix)', example: '2024-01-01T00:00:00Z' },
      { name: 'limit', type: 'integer', required: false, description: 'Maximum posts to return (1-100)', example: '20' },
      { name: 'include_updated', type: 'boolean', required: false, description: 'Include updated posts (default: true)', example: 'true' }
    ],
    response: [
      { status: 200, description: 'Success', example: { posts: [], count: 5, since: '2024-01-01T00:00:00Z', fetched_at: '2024-01-01T12:00:00Z' } },
      { status: 400, description: 'Invalid since parameter', example: { error: 'Invalid since parameter format' } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  {
    method: 'GET',
    path: '/api/posts/{idOrSlug}',
    description: 'Get a specific post by ID or slug',
    parameters: [
      { name: 'idOrSlug', type: 'string|integer', required: true, description: 'Post ID or slug', example: 'my-post-slug' }
    ],
    response: [
      { status: 200, description: 'Success', example: { id: 1, title: 'Post Title', content: '...', category: {}, user: {}, tags: [] } },
      { status: 404, description: 'Post not found', example: { error: 'Post not found' } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  {
    method: 'POST',
    path: '/api/posts',
    description: 'Create a new post',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Post title', example: 'My New Post' },
      { name: 'content', type: 'string', required: true, description: 'Post content (HTML/Markdown)', example: '<p>Post content...</p>' },
      { name: 'excerpt', type: 'string', required: false, description: 'Post excerpt', example: 'Brief description' },
      { name: 'category_id', type: 'integer', required: true, description: 'Category ID', example: '1' },
      { name: 'featured_image', type: 'string', required: false, description: 'Featured image URL', example: 'https://example.com/image.jpg' },
      { name: 'is_published', type: 'boolean', required: false, description: 'Publish status', example: 'true' },
      { name: 'meta_description', type: 'string', required: false, description: 'SEO meta description', example: 'SEO description' },
      { name: 'meta_keywords', type: 'string', required: false, description: 'SEO meta keywords', example: 'keyword1, keyword2' },
      { name: 'tags', type: 'array', required: false, description: 'Array of tag IDs', example: '[1, 2, 3]' }
    ],
    response: [
      { status: 201, description: 'Post created successfully', example: { id: 1, title: 'My New Post', content: 'Post content...', category: { id: 1, name: 'Technology' } } },
      { status: 422, description: 'Validation error', example: { error: 'Validation failed', details: { title: ['The title field is required.'] } } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '20 requests/minute'
  },
  {
    method: 'PUT',
    path: '/api/posts/{id}',
    description: 'Update an existing post',
    parameters: [
      { name: 'id', type: 'integer', required: true, description: 'Post ID', example: '1' },
      { name: 'title', type: 'string', required: true, description: 'Post title', example: 'Updated Title' },
      { name: 'content', type: 'string', required: false, description: 'Post content (optional for updates)', example: '<p>Updated content...</p>' },
      { name: 'excerpt', type: 'string', required: false, description: 'Post excerpt', example: 'Updated excerpt' },
      { name: 'category_id', type: 'integer', required: true, description: 'Category ID', example: '1' },
      { name: 'featured_image', type: 'string', required: false, description: 'Featured image URL', example: 'https://example.com/image.jpg' },
      { name: 'is_published', type: 'boolean', required: false, description: 'Publish status', example: 'true' },
      { name: 'meta_description', type: 'string', required: false, description: 'SEO meta description', example: 'Updated SEO description' },
      { name: 'meta_keywords', type: 'string', required: false, description: 'SEO meta keywords', example: 'updated, keywords' },
      { name: 'tags', type: 'array', required: false, description: 'Array of tag IDs', example: '[1, 2, 3]' }
    ],
    response: [
      { status: 200, description: 'Post updated successfully', example: { id: 1, title: 'Updated Title', content: 'Updated content...', category: { id: 1, name: 'Technology' } } },
      { status: 404, description: 'Post not found', example: { error: 'Post not found' } },
      { status: 422, description: 'Validation error', example: { error: 'Validation failed' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '20 requests/minute'
  },
  {
    method: 'DELETE',
    path: '/api/posts/{id}',
    description: 'Delete a post',
    parameters: [
      { name: 'id', type: 'integer', required: true, description: 'Post ID', example: '1' }
    ],
    response: [
      { status: 200, description: 'Post deleted successfully', example: { message: 'Post deleted successfully' } },
      { status: 404, description: 'Post not found', example: { error: 'Post not found' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '10 requests/minute'
  },
  // Categories API
  {
    method: 'GET',
    path: '/api/categories',
    description: 'Get all categories with post counts',
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Search in category name or description', example: 'technology' },
      { name: 'min_posts', type: 'integer', required: false, description: 'Minimum posts count', example: '5' },
      { name: 'max_posts', type: 'integer', required: false, description: 'Maximum posts count', example: '50' }
    ],
    response: [
      { status: 200, description: 'Success', example: { data: [{ id: 1, name: 'Technology', posts_count: 25 }], meta: { total: 10 } } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  // Tags API
  {
    method: 'GET',
    path: '/api/tags',
    description: 'Get all tags with post counts',
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Search in tag name or description', example: 'react' },
      { name: 'color', type: 'string', required: false, description: 'Filter by color', example: '#3B82F6' },
      { name: 'min_posts', type: 'integer', required: false, description: 'Minimum posts count', example: '3' },
      { name: 'max_posts', type: 'integer', required: false, description: 'Maximum posts count', example: '20' }
    ],
    response: [
      { status: 200, description: 'Success', example: { data: [{ id: 1, name: 'React', color: '#61DAFB', posts_count: 15 }], meta: { total: 25 } } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  // Push Notifications API
  {
    method: 'POST',
    path: '/api/push/subscribe',
    description: 'Subscribe to push notifications',
    parameters: [
      { name: 'endpoint', type: 'string', required: true, description: 'Push subscription endpoint', example: 'https://fcm.googleapis.com/fcm/send/...' },
      { name: 'p256dh', type: 'string', required: true, description: 'P256DH key', example: 'BEl62iUYgUivxIkv69yViEuiBIa40HI...' },
      { name: 'auth', type: 'string', required: true, description: 'Auth key', example: 'tBHItJI5svbpez7KI4CCXg==' },
      { name: 'preferences', type: 'object', required: false, description: 'Notification preferences', example: '{"blogPosts": true, "courses": false}' }
    ],
    response: [
      { status: 200, description: 'Subscribed successfully', example: { message: 'Subscribed to push notifications' } },
      { status: 422, description: 'Validation error', example: { error: 'Invalid subscription data' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '10 requests/minute'
  },
  {
    method: 'GET',
    path: '/api/push/status',
    description: 'Get push notification subscription status',
    response: [
      { status: 200, description: 'Success', example: { subscribed: true, preferences: { blogPosts: true, courses: false } } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '30 requests/minute'
  },
  // Courses API
  {
    method: 'GET',
    path: '/api/courses',
    description: 'Get all published courses with filtering and pagination',
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Search in title, description, or content', example: 'javascript' },
      { name: 'category_id', type: 'integer', required: false, description: 'Filter by category ID', example: '1' },
      { name: 'difficulty', type: 'string', required: false, description: 'Filter by difficulty level', example: 'beginner' },
      { name: 'duration_min', type: 'integer', required: false, description: 'Minimum duration in minutes', example: '30' },
      { name: 'duration_max', type: 'integer', required: false, description: 'Maximum duration in minutes', example: '120' },
      { name: 'is_free', type: 'boolean', required: false, description: 'Filter free/paid courses', example: 'true' },
      { name: 'featured', type: 'boolean', required: false, description: 'Filter featured courses', example: 'true' },
      { name: 'sort_by', type: 'string', required: false, description: 'Sort field', example: 'created_at' },
      { name: 'sort_order', type: 'string', required: false, description: 'Sort order (asc/desc)', example: 'desc' },
      { name: 'per_page', type: 'integer', required: false, description: 'Courses per page (max 100)', example: '20' },
      { name: 'page', type: 'integer', required: false, description: 'Page number', example: '1' }
    ],
    response: [
      { status: 200, description: 'Success', example: { data: [], current_page: 1, last_page: 5, total: 50 } },
      { status: 400, description: 'Invalid parameters', example: { error: 'Invalid parameter format' } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  {
    method: 'GET',
    path: '/api/courses/{idOrSlug}',
    description: 'Get a specific course by ID or slug',
    parameters: [
      { name: 'idOrSlug', type: 'string|integer', required: true, description: 'Course ID or slug', example: 'javascript-basics' }
    ],
    response: [
      { status: 200, description: 'Success', example: { id: 1, title: 'JavaScript Basics', lessons: [], category: {} } },
      { status: 404, description: 'Course not found', example: { error: 'Course not found' } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  {
    method: 'POST',
    path: '/api/courses',
    description: 'Create a new course',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Course title', example: 'Advanced React' },
      { name: 'description', type: 'string', required: true, description: 'Course description', example: 'Learn advanced React concepts' },
      { name: 'content', type: 'string', required: false, description: 'Course content', example: '<p>Course content...</p>' },
      { name: 'category_id', type: 'integer', required: true, description: 'Category ID', example: '1' },
      { name: 'difficulty', type: 'string', required: true, description: 'Difficulty level', example: 'intermediate' },
      { name: 'duration', type: 'integer', required: true, description: 'Duration in minutes', example: '120' },
      { name: 'price', type: 'decimal', required: false, description: 'Course price', example: '99.99' },
      { name: 'is_free', type: 'boolean', required: false, description: 'Is free course', example: 'false' },
      { name: 'featured_image', type: 'string', required: false, description: 'Featured image URL', example: 'https://example.com/image.jpg' },
      { name: 'is_published', type: 'boolean', required: false, description: 'Publish status', example: 'true' },
      { name: 'meta_description', type: 'string', required: false, description: 'SEO meta description', example: 'Learn advanced React' },
      { name: 'meta_keywords', type: 'string', required: false, description: 'SEO meta keywords', example: 'react, javascript, frontend' }
    ],
    response: [
      { status: 201, description: 'Course created successfully', example: { id: 1, title: 'Advanced React', description: 'Learn advanced React concepts', category: { id: 1, name: 'Technology' } } },
      { status: 422, description: 'Validation error', example: { error: 'Validation failed' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '20 requests/minute'
  },
  {
    method: 'PUT',
    path: '/api/courses/{id}',
    description: 'Update an existing course',
    parameters: [
      { name: 'id', type: 'integer', required: true, description: 'Course ID', example: '1' },
      { name: 'title', type: 'string', required: true, description: 'Course title', example: 'Updated Course Title' },
      { name: 'description', type: 'string', required: true, description: 'Course description', example: 'Updated description' },
      { name: 'content', type: 'string', required: false, description: 'Course content', example: '<p>Updated content...</p>' },
      { name: 'category_id', type: 'integer', required: true, description: 'Category ID', example: '1' },
      { name: 'difficulty', type: 'string', required: true, description: 'Difficulty level', example: 'advanced' },
      { name: 'duration', type: 'integer', required: true, description: 'Duration in minutes', example: '150' },
      { name: 'price', type: 'decimal', required: false, description: 'Course price', example: '149.99' },
      { name: 'is_free', type: 'boolean', required: false, description: 'Is free course', example: 'false' },
      { name: 'featured_image', type: 'string', required: false, description: 'Featured image URL', example: 'https://example.com/image.jpg' },
      { name: 'is_published', type: 'boolean', required: false, description: 'Publish status', example: 'true' }
    ],
    response: [
      { status: 200, description: 'Course updated successfully', example: { id: 1, title: 'Updated Course Title', description: 'Updated description', category: { id: 1, name: 'Technology' } } },
      { status: 404, description: 'Course not found', example: { error: 'Course not found' } },
      { status: 422, description: 'Validation error', example: { error: 'Validation failed' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '20 requests/minute'
  },
  {
    method: 'DELETE',
    path: '/api/courses/{id}',
    description: 'Delete a course',
    parameters: [
      { name: 'id', type: 'integer', required: true, description: 'Course ID', example: '1' }
    ],
    response: [
      { status: 200, description: 'Course deleted successfully', example: { message: 'Course deleted successfully' } },
      { status: 404, description: 'Course not found', example: { error: 'Course not found' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '10 requests/minute'
  },
  // Workflows API
  {
    method: 'GET',
    path: '/api/workflows',
    description: 'Get all published workflows with filtering and pagination',
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Search in title, description, or content', example: 'project management' },
      { name: 'category_id', type: 'integer', required: false, description: 'Filter by category ID', example: '1' },
      { name: 'difficulty', type: 'string', required: false, description: 'Filter by difficulty level', example: 'beginner' },
      { name: 'estimated_time', type: 'string', required: false, description: 'Filter by estimated time', example: '1-2 hours' },
      { name: 'tools_required', type: 'string', required: false, description: 'Filter by required tools', example: 'notion,trello' },
      { name: 'featured', type: 'boolean', required: false, description: 'Filter featured workflows', example: 'true' },
      { name: 'sort_by', type: 'string', required: false, description: 'Sort field', example: 'created_at' },
      { name: 'sort_order', type: 'string', required: false, description: 'Sort order (asc/desc)', example: 'desc' },
      { name: 'per_page', type: 'integer', required: false, description: 'Workflows per page (max 100)', example: '20' },
      { name: 'page', type: 'integer', required: false, description: 'Page number', example: '1' }
    ],
    response: [
      { status: 200, description: 'Success', example: { data: [], current_page: 1, last_page: 3, total: 30 } },
      { status: 400, description: 'Invalid parameters', example: { error: 'Invalid parameter format' } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  {
    method: 'GET',
    path: '/api/workflows/{idOrSlug}',
    description: 'Get a specific workflow by ID or slug',
    parameters: [
      { name: 'idOrSlug', type: 'string|integer', required: true, description: 'Workflow ID or slug', example: 'agile-project-setup' }
    ],
    response: [
      { status: 200, description: 'Success', example: { id: 1, title: 'Agile Project Setup', steps: [], category: {} } },
      { status: 404, description: 'Workflow not found', example: { error: 'Workflow not found' } }
    ],
    authentication: 'None required',
    rateLimit: '100 requests/minute'
  },
  {
    method: 'POST',
    path: '/api/workflows',
    description: 'Create a new workflow',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Workflow title', example: 'Content Creation Process' },
      { name: 'description', type: 'string', required: true, description: 'Workflow description', example: 'Step-by-step content creation workflow' },
      { name: 'content', type: 'string', required: false, description: 'Workflow content', example: '<p>Detailed workflow content...</p>' },
      { name: 'category_id', type: 'integer', required: true, description: 'Category ID', example: '1' },
      { name: 'difficulty', type: 'string', required: true, description: 'Difficulty level', example: 'intermediate' },
      { name: 'estimated_time', type: 'string', required: true, description: 'Estimated completion time', example: '2-3 hours' },
      { name: 'tools_required', type: 'string', required: false, description: 'Required tools (comma-separated)', example: 'notion,figma,slack' },
      { name: 'featured_image', type: 'string', required: false, description: 'Featured image URL', example: 'https://example.com/image.jpg' },
      { name: 'is_published', type: 'boolean', required: false, description: 'Publish status', example: 'true' },
      { name: 'meta_description', type: 'string', required: false, description: 'SEO meta description', example: 'Content creation workflow' },
      { name: 'meta_keywords', type: 'string', required: false, description: 'SEO meta keywords', example: 'content, workflow, process' }
    ],
    response: [
      { status: 201, description: 'Workflow created successfully', example: { id: 1, title: 'Content Creation Process', description: 'Step-by-step content creation workflow', category: { id: 1, name: 'Productivity' } } },
      { status: 422, description: 'Validation error', example: { error: 'Validation failed' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '20 requests/minute'
  },
  {
    method: 'PUT',
    path: '/api/workflows/{id}',
    description: 'Update an existing workflow',
    parameters: [
      { name: 'id', type: 'integer', required: true, description: 'Workflow ID', example: '1' },
      { name: 'title', type: 'string', required: true, description: 'Workflow title', example: 'Updated Workflow Title' },
      { name: 'description', type: 'string', required: true, description: 'Workflow description', example: 'Updated description' },
      { name: 'content', type: 'string', required: false, description: 'Workflow content', example: '<p>Updated content...</p>' },
      { name: 'category_id', type: 'integer', required: true, description: 'Category ID', example: '1' },
      { name: 'difficulty', type: 'string', required: true, description: 'Difficulty level', example: 'advanced' },
      { name: 'estimated_time', type: 'string', required: true, description: 'Estimated completion time', example: '3-4 hours' },
      { name: 'tools_required', type: 'string', required: false, description: 'Required tools (comma-separated)', example: 'notion,figma,slack,zoom' },
      { name: 'featured_image', type: 'string', required: false, description: 'Featured image URL', example: 'https://example.com/image.jpg' },
      { name: 'is_published', type: 'boolean', required: false, description: 'Publish status', example: 'true' }
    ],
    response: [
      { status: 200, description: 'Workflow updated successfully', example: { id: 1, title: 'Updated Workflow Title', description: 'Updated description', category: { id: 1, name: 'Productivity' } } },
      { status: 404, description: 'Workflow not found', example: { error: 'Workflow not found' } },
      { status: 422, description: 'Validation error', example: { error: 'Validation failed' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '20 requests/minute'
  },
  {
    method: 'DELETE',
    path: '/api/workflows/{id}',
    description: 'Delete a workflow',
    parameters: [
      { name: 'id', type: 'integer', required: true, description: 'Workflow ID', example: '1' }
    ],
    response: [
      { status: 200, description: 'Workflow deleted successfully', example: { message: 'Workflow deleted successfully' } },
      { status: 404, description: 'Workflow not found', example: { error: 'Workflow not found' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '10 requests/minute'
  },
  // File Management API
  {
    method: 'POST',
    path: '/api/files',
    description: 'Upload a file',
    parameters: [
      { name: 'file', type: 'file', required: true, description: 'File to upload', example: 'image.jpg' },
      { name: 'context', type: 'string', required: false, description: 'File context (e.g., post, course, workflow)', example: 'post' },
      { name: 'custom_name', type: 'string', required: false, description: 'Custom filename', example: 'my-image' }
    ],
    response: [
      { status: 201, description: 'File uploaded successfully', example: { id: 1, filename: 'seo-friendly-name-2024-01-01-abc123.jpg', url: '/api/storage/...' } },
      { status: 422, description: 'Validation error', example: { error: 'Invalid file type' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '50 requests/minute'
  },
  {
    method: 'GET',
    path: '/api/storage/{path}',
    description: 'Serve a file from storage',
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'File path in storage', example: 'uploads/image.jpg' }
    ],
    response: [
      { status: 200, description: 'File served successfully', example: 'Binary file content' },
      { status: 404, description: 'File not found', example: { error: 'File not found' } }
    ],
    authentication: 'None required',
    rateLimit: '1000 requests/minute'
  },
  // Analytics API
  {
    method: 'POST',
    path: '/api/analytics/track/install',
    description: 'Track app installation',
    parameters: [
      { name: 'platform', type: 'string', required: true, description: 'Platform (web, android, ios)', example: 'web' },
      { name: 'browser', type: 'string', required: false, description: 'Browser name', example: 'Chrome' },
      { name: 'os', type: 'string', required: false, description: 'Operating system', example: 'Windows' },
      { name: 'device_type', type: 'string', required: false, description: 'Device type', example: 'desktop' },
      { name: 'screen_resolution', type: 'string', required: false, description: 'Screen resolution', example: '1920x1080' },
      { name: 'country', type: 'string', required: false, description: 'Country code', example: 'US' },
      { name: 'install_source', type: 'string', required: false, description: 'Installation source', example: 'banner' }
    ],
    response: [
      { status: 200, description: 'Installation tracked successfully', example: { message: 'Installation tracked' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '10 requests/minute'
  },
  {
    method: 'POST',
    path: '/api/analytics/track/launch',
    description: 'Track app launch',
    parameters: [
      { name: 'session_id', type: 'string', required: true, description: 'Session identifier', example: 'sess_abc123' },
      { name: 'platform', type: 'string', required: true, description: 'Platform', example: 'web' }
    ],
    response: [
      { status: 200, description: 'Launch tracked successfully', example: { message: 'Launch tracked' } }
    ],
    authentication: 'Bearer token required',
    rateLimit: '100 requests/minute'
  },
  // Admin Push Notifications
  {
    method: 'POST',
    path: '/api/admin/push-notifications/send',
    description: 'Send push notification to subscribers',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Notification title', example: 'New Blog Post!' },
      { name: 'body', type: 'string', required: true, description: 'Notification body', example: 'Check out our latest article' },
      { name: 'url', type: 'string', required: false, description: 'URL to open when clicked', example: '/blog/new-post' },
      { name: 'imageUrl', type: 'string', required: false, description: 'Notification image URL', example: 'https://example.com/image.jpg' },
      { name: 'notificationType', type: 'string', required: false, description: 'Type of notification', example: 'blogPosts' }
    ],
    response: [
      { status: 200, description: 'Notification sent successfully', example: { message: 'Notification sent to 150 subscribers' } },
      { status: 403, description: 'Admin access required', example: { error: 'Access denied' } }
    ],
    authentication: 'Admin Bearer token required',
    rateLimit: '5 requests/minute'
  },
  {
    method: 'GET',
    path: '/api/admin/push-notifications/stats',
    description: 'Get push notification statistics',
    response: [
      { status: 200, description: 'Success', example: { total_subscribers: 150, active_subscribers: 120, notification_types: { blogPosts: 120, courses: 100 } } }
    ],
    authentication: 'Admin Bearer token required',
    rateLimit: '30 requests/minute'
  },
  // Admin Analytics
  {
    method: 'GET',
    path: '/api/admin/analytics/dashboard',
    description: 'Get analytics dashboard data',
    parameters: [
      { name: 'days', type: 'integer', required: false, description: 'Number of days to analyze', example: '30' },
      { name: 'start_date', type: 'string', required: false, description: 'Start date (YYYY-MM-DD)', example: '2024-01-01' },
      { name: 'end_date', type: 'string', required: false, description: 'End date (YYYY-MM-DD)', example: '2024-01-31' }
    ],
    response: [
      { status: 200, description: 'Success', example: { summary: { total_installs: 1000 }, daily_installs: [], retention_data: [] } }
    ],
    authentication: 'Admin Bearer token required',
    rateLimit: '30 requests/minute'
  }
];

export default function ApiDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useSEO({ title: 'API Documentation | Admin' });

  const categories = [
    { value: 'all', label: 'All Endpoints' },
    { value: 'posts', label: 'Posts' },
    { value: 'courses', label: 'Courses' },
    { value: 'workflows', label: 'Workflows' },
    { value: 'categories', label: 'Categories' },
    { value: 'tags', label: 'Tags' },
    { value: 'files', label: 'File Management' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'notifications', label: 'Push Notifications' },
    { value: 'admin', label: 'Admin Only' }
  ];

  const filteredEndpoints = API_ENDPOINTS.filter(endpoint => {
    const matchesSearch = endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           endpoint.path.includes(selectedCategory) ||
                           (selectedCategory === 'admin' && endpoint.path.includes('/admin/')) ||
                           (selectedCategory === 'notifications' && endpoint.path.includes('push')) ||
                           (selectedCategory === 'files' && (endpoint.path.includes('files') || endpoint.path.includes('storage'))) ||
                           (selectedCategory === 'analytics' && endpoint.path.includes('analytics'));
    
    return matchesSearch && matchesCategory;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
            <p className="mt-2 text-gray-600">
              Complete reference for all available API endpoints, parameters, and responses.
            </p>
          </div>

          <div className="p-6">
            {/* Search and Filter */}
            <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search endpoints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Endpoints List */}
            <div className="space-y-4">
              {filteredEndpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedEndpoint(endpoint)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                    </div>
                    <div className="text-sm text-gray-500">
                      {endpoint.authentication}
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600">{endpoint.description}</p>
                  {endpoint.parameters && (
                    <div className="mt-2 text-sm text-gray-500">
                      {endpoint.parameters.length} parameter{endpoint.parameters.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Endpoint Details Modal */}
            {selectedEndpoint && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${getMethodColor(selectedEndpoint.method)}`}>
                          {selectedEndpoint.method}
                        </span>
                        <code className="text-lg font-mono text-gray-900">{selectedEndpoint.path}</code>
                      </div>
                      <button
                        onClick={() => setSelectedEndpoint(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <p className="text-gray-600 mb-6">{selectedEndpoint.description}</p>

                    {/* Authentication & Rate Limit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Authentication</h3>
                        <p className="text-sm text-gray-600">{selectedEndpoint.authentication}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Rate Limit</h3>
                        <p className="text-sm text-gray-600">{selectedEndpoint.rateLimit}</p>
                      </div>
                    </div>

                    {/* Parameters */}
                    {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Example</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedEndpoint.parameters.map((param, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{param.name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{param.type}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      param.required 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {param.required ? 'Required' : 'Optional'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{param.description}</td>
                                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{param.example || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Response Examples */}
                    {selectedEndpoint.response && selectedEndpoint.response.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Examples</h3>
                        <div className="space-y-4">
                          {selectedEndpoint.response.map((response, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                  response.status >= 200 && response.status < 300 
                                    ? 'bg-green-100 text-green-800'
                                    : response.status >= 400 && response.status < 500
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {response.status}
                                </span>
                                <span className="text-sm text-gray-600">{response.description}</span>
                              </div>
                              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                                <code>{JSON.stringify(response.example, null, 2)}</code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
