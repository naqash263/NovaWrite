import { useState } from 'react';
import { useSEO } from '../../utils/seo';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    type: string;
    example: any;
  };
  responseExample: any;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // Health Check Endpoints
  {
    method: 'GET',
    path: '/api/health',
    description: 'Basic health check endpoint',
    auth: false,
    responseExample: {
      status: "ok",
      timestamp: "2025-10-15T10:00:00Z",
      uptime: 3600
    }
  },
  {
    method: 'GET',
    path: '/api/health/comprehensive',
    description: 'Comprehensive health check with detailed system status',
    auth: false,
    responseExample: {
      status: "ok",
      timestamp: "2025-10-15T10:00:00Z",
      services: {
        database: "healthy",
        storage: "healthy",
        cache: "healthy"
      },
      uptime: 3600
    }
  },
  {
    method: 'GET',
    path: '/api/health/database',
    description: 'Database health check',
    auth: false,
    responseExample: {
      status: "healthy",
      connection: "ok",
      response_time: "5ms"
    }
  },
  {
    method: 'GET',
    path: '/api/health/storage',
    description: 'Storage health check',
    auth: false,
    responseExample: {
      status: "healthy",
      disk_space: "85%",
      writable: true
    }
  },

  // Authentication Endpoints
  {
    method: 'POST',
    path: '/api/auth/register',
    description: 'Register a new user account',
    auth: false,
    requestBody: {
      type: 'application/json',
      example: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        password_confirmation: "password123"
      }
    },
    responseExample: {
      message: "User registered successfully. Please check your email for verification.",
      user: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "user"
      }
    }
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate user and get access token',
    auth: false,
    requestBody: {
      type: 'application/json',
      example: {
        email: "user@example.com",
        password: "password123"
      }
    },
    responseExample: {
      user: {
        id: 1,
        name: "John Doe",
        email: "user@example.com",
        role: "user"
      },
      token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
  },
  {
    method: 'POST',
    path: '/api/auth/verify-email',
    description: 'Verify user email address',
    auth: false,
    requestBody: {
      type: 'application/json',
      example: {
        token: "verification_token_here"
      }
    },
    responseExample: {
      message: "Email verified successfully"
    }
  },
  {
    method: 'POST',
    path: '/api/auth/resend-verification',
    description: 'Resend email verification',
    auth: false,
    requestBody: {
      type: 'application/json',
      example: {
        email: "user@example.com"
      }
    },
    responseExample: {
      message: "Verification email sent successfully"
    }
  },
  {
    method: 'GET',
    path: '/api/auth/google',
    description: 'Initiate Google OAuth login',
    auth: false,
    responseExample: {
      url: "https://accounts.google.com/oauth/authorize?..."
    }
  },
  {
    method: 'GET',
    path: '/api/auth/google/callback',
    description: 'Handle Google OAuth callback',
    auth: false,
    parameters: [
      {
        name: 'code',
        type: 'string',
        required: true,
        description: 'Authorization code from Google'
      },
      {
        name: 'state',
        type: 'string',
        required: false,
        description: 'State parameter for security'
      }
    ],
    responseExample: {
      user: {
        id: 1,
        name: "John Doe",
        email: "john@gmail.com",
        role: "user"
      },
      token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    description: 'Logout user and invalidate token',
    auth: true,
    responseExample: {
      message: "Successfully logged out"
    }
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    description: 'Get current authenticated user information',
    auth: true,
    responseExample: {
      id: 1,
      name: "John Doe",
      email: "user@example.com",
      role: "user",
      created_at: "2025-10-04T08:31:23.000000Z"
    }
  },

  // Public Endpoints
  {
    method: 'GET',
    path: '/api/workflows',
    description: 'Get all published workflows',
    auth: false,
    responseExample: [
      {
        id: 1,
        title: "Lead Qualification Automation",
        slug: "lead-qualification-automation",
        summary: "Automatically qualify and score leads",
        tools: ["n8n", "Zoho CRM"],
        benefits: ["Faster processing", "Better accuracy"],
        status: "published",
        is_featured: true,
        category: {
          id: 1,
          name: "CRM Automation"
        }
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/workflows/{id}',
    description: 'Get a specific workflow by ID',
    auth: false,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Workflow ID'
      }
    ],
    responseExample: {
      id: 1,
      title: "Lead Qualification Automation",
      slug: "lead-qualification-automation",
      summary: "Automatically qualify and score leads",
      description: "Detailed workflow description...",
      tools: ["n8n", "Zoho CRM"],
      benefits: ["Faster processing", "Better accuracy"],
      status: "published",
      is_featured: true,
      category: {
        id: 1,
        name: "CRM Automation"
      },
      files: []
    }
  },
  {
    method: 'GET',
    path: '/api/courses',
    description: 'Get all published courses',
    auth: false,
    responseExample: [
      {
        id: 1,
        title: "React Development Course",
        slug: "react-development-course",
        description: "Learn React from scratch",
        duration_hours: 40,
        level: "beginner",
        lessons_count: 10,
        enrolled_users_count: 25,
        is_enrolled: false
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/courses/{id}',
    description: 'Get a specific course by ID',
    auth: false,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Course ID'
      }
    ],
    responseExample: {
      id: 1,
      title: "React Development Course",
      slug: "react-development-course",
      description: "Learn React from scratch",
      duration_hours: 40,
      level: "beginner",
      lessons_count: 10,
      enrolled_users_count: 25,
      is_enrolled: false,
      lessons: []
    }
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate user and get access token',
    auth: false,
    requestBody: {
      type: 'application/json',
      example: {
        email: "user@example.com",
        password: "password123"
      }
    },
    responseExample: {
      user: {
        id: 1,
        name: "John Doe",
        email: "user@example.com",
        role: "user"
      },
      token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
  },
  {
    method: 'POST',
    path: '/api/admin/workflows',
    description: 'Create a new workflow (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        workflow_category_id: 1,
        title: "New Workflow",
        summary: "Workflow summary",
        description: "Detailed description",
        tools: ["Tool 1", "Tool 2"],
        benefits: ["Benefit 1", "Benefit 2"],
        status: "draft",
        is_featured: false
      }
    },
    responseExample: {
      id: 1,
      title: "New Workflow",
      slug: "new-workflow",
      summary: "Workflow summary",
      description: "Detailed description",
      tools: ["Tool 1", "Tool 2"],
      benefits: ["Benefit 1", "Benefit 2"],
      status: "draft",
      is_featured: false,
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'PUT',
    path: '/api/admin/workflows/{id}',
    description: 'Update a workflow (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Workflow ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        title: "Updated Workflow Title",
        status: "published"
      }
    },
    responseExample: {
      id: 1,
      title: "Updated Workflow Title",
      slug: "updated-workflow-title",
      status: "published",
      updated_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/admin/workflows/{id}',
    description: 'Delete a workflow (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Workflow ID'
      }
    ],
    responseExample: {
      message: "Workflow deleted successfully"
    }
  },

  // Workflow Files Management
  {
    method: 'POST',
    path: '/api/admin/workflows/{id}/files',
    description: 'Attach a file to a workflow (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Workflow ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        file_id: 6,
        display_name: "Workflow Process Diagram",
        description: "Main process flow showing all steps",
        sort_order: 1
      }
    },
    responseExample: {
      id: 1,
      workflow_id: 14,
      file_id: 6,
      display_name: "Workflow Process Diagram",
      description: "Main process flow showing all steps",
      sort_order: 1,
      created_at: "2025-10-14T03:30:46.000000Z",
      file: {
        id: 6,
        name: "diagram",
        original_name: "diagram.png",
        path: "uploads/1760411843_diagram.png",
        mime_type: "image/png"
      }
    }
  },
  {
    method: 'DELETE',
    path: '/api/admin/workflows/{id}/files/{fileId}',
    description: 'Detach a file from a workflow (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Workflow ID'
      },
      {
        name: 'fileId',
        type: 'integer',
        required: true,
        description: 'Workflow File ID (not the original file_id)'
      }
    ],
    responseExample: {
      message: "File detached successfully"
    }
  },

  // Posts CRUD Operations
  {
    method: 'GET',
    path: '/api/posts',
    description: 'Get all published posts with advanced filtering',
    auth: false,
    parameters: [
      {
        name: 'search',
        type: 'string',
        required: false,
        description: 'Search in title, content, excerpt, or tags'
      },
      {
        name: 'category_id',
        type: 'integer',
        required: false,
        description: 'Filter by category ID'
      },
      {
        name: 'category_slug',
        type: 'string',
        required: false,
        description: 'Filter by category slug'
      },
      {
        name: 'tags',
        type: 'string|array',
        required: false,
        description: 'Filter by tag IDs (comma-separated or array)'
      },
      {
        name: 'tag_slugs',
        type: 'string|array',
        required: false,
        description: 'Filter by tag slugs (comma-separated or array)'
      },
      {
        name: 'date_from',
        type: 'date',
        required: false,
        description: 'Filter posts published from this date'
      },
      {
        name: 'date_to',
        type: 'date',
        required: false,
        description: 'Filter posts published until this date'
      },
      {
        name: 'created_from',
        type: 'date',
        required: false,
        description: 'Filter posts created from this date'
      },
      {
        name: 'created_to',
        type: 'date',
        required: false,
        description: 'Filter posts created until this date'
      },
      {
        name: 'updated_from',
        type: 'date',
        required: false,
        description: 'Filter posts updated from this date'
      },
      {
        name: 'updated_to',
        type: 'date',
        required: false,
        description: 'Filter posts updated until this date'
      },
      {
        name: 'year',
        type: 'integer',
        required: false,
        description: 'Filter by published year'
      },
      {
        name: 'created_year',
        type: 'integer',
        required: false,
        description: 'Filter by created year'
      },
      {
        name: 'updated_year',
        type: 'integer',
        required: false,
        description: 'Filter by updated year'
      },
      {
        name: 'month',
        type: 'integer',
        required: false,
        description: 'Filter by published month (1-12)'
      },
      {
        name: 'created_month',
        type: 'integer',
        required: false,
        description: 'Filter by created month (1-12)'
      },
      {
        name: 'updated_month',
        type: 'integer',
        required: false,
        description: 'Filter by updated month (1-12)'
      },
      {
        name: 'recent_days',
        type: 'integer',
        required: false,
        description: 'Get posts from last N days (created)'
      },
      {
        name: 'recent_updated_days',
        type: 'integer',
        required: false,
        description: 'Get posts updated in last N days'
      },
      {
        name: 'author_id',
        type: 'integer',
        required: false,
        description: 'Filter by author ID'
      },
      {
        name: 'featured',
        type: 'boolean',
        required: false,
        description: 'Filter featured posts (true/false)'
      },
      {
        name: 'min_views',
        type: 'integer',
        required: false,
        description: 'Minimum view count'
      },
      {
        name: 'sort_by',
        type: 'string',
        required: false,
        description: 'Sort by: published_at, created_at, updated_at, title, views'
      },
      {
        name: 'sort_order',
        type: 'string',
        required: false,
        description: 'Sort order: asc or desc'
      },
      {
        name: 'page',
        type: 'integer',
        required: false,
        description: 'Page number for pagination'
      },
      {
        name: 'per_page',
        type: 'integer',
        required: false,
        description: 'Number of posts per page (max 100)'
      }
    ],
    responseExample: {
      current_page: 1,
      data: [
        {
          id: 1,
          title: "Getting Started with AI Automation",
          slug: "getting-started-with-ai-automation",
          excerpt: "Learn how to implement AI automation...",
          featured_image: "/images/ai-automation.jpg",
          category: {
            id: 1,
            name: "AI Automation"
          },
          published_at: "2025-09-27T08:33:50.000000Z",
          is_published: true
        }
      ],
      last_page: 1,
      total: 4
    }
  },
  {
    method: 'GET',
    path: '/api/posts/{slug}',
    description: 'Get a specific post by slug',
    auth: false,
    parameters: [
      {
        name: 'slug',
        type: 'string',
        required: true,
        description: 'Post slug'
      }
    ],
    responseExample: {
      id: 1,
      title: "Getting Started with AI Automation",
      slug: "getting-started-with-ai-automation",
      content: "Full post content...",
      excerpt: "Learn how to implement AI automation...",
      featured_image: "/images/ai-automation.jpg",
      category: {
        id: 1,
        name: "AI Automation"
      },
      published_at: "2025-09-27T08:33:50.000000Z",
      is_published: true
    }
  },
  {
    method: 'POST',
    path: '/api/admin/posts',
    description: 'Create a new post (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        title: "New Blog Post",
        content: "Full post content here...",
        excerpt: "Short excerpt...",
        featured_image: "/images/featured.jpg",
        category_id: 1,
        is_published: true
      }
    },
    responseExample: {
      id: 5,
      title: "New Blog Post",
      slug: "new-blog-post",
      content: "Full post content here...",
      excerpt: "Short excerpt...",
      featured_image: "/images/featured.jpg",
      category_id: 1,
      is_published: true,
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'PUT',
    path: '/api/admin/posts/{id}',
    description: 'Update a post (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Post ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        title: "Updated Blog Post Title",
        is_published: false
      }
    },
    responseExample: {
      id: 5,
      title: "Updated Blog Post Title",
      slug: "updated-blog-post-title",
      is_published: false,
      updated_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/admin/posts/{id}',
    description: 'Delete a post (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Post ID'
      }
    ],
    responseExample: {
      message: "Post deleted successfully"
    }
  },

  // Courses CRUD Operations
  {
    method: 'GET',
    path: '/api/courses',
    description: 'Get all published courses',
    auth: false,
    responseExample: [
      {
        id: 1,
        title: "React Development Course",
        slug: "react-development-course",
        description: "Learn React from scratch",
        duration_hours: 40,
        level: "beginner",
        lessons_count: 10,
        enrolled_users_count: 25,
        is_enrolled: false
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/courses/{slug}',
    description: 'Get a specific course by slug',
    auth: false,
    parameters: [
      {
        name: 'slug',
        type: 'string',
        required: true,
        description: 'Course slug'
      }
    ],
    responseExample: {
      id: 1,
      title: "React Development Course",
      slug: "react-development-course",
      description: "Learn React from scratch",
      duration_hours: 40,
      level: "beginner",
      lessons_count: 10,
      enrolled_users_count: 25,
      is_enrolled: false,
      lessons: []
    }
  },
  {
    method: 'POST',
    path: '/api/admin/courses',
    description: 'Create a new course (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        title: "Advanced JavaScript Course",
        description: "Master advanced JavaScript concepts",
        image_url: "https://example.com/course-image.jpg",
        what_you_learn: "Learn advanced JS concepts, async programming, design patterns",
        duration_hours: 60,
        level: "advanced",
        is_published: true,
        order: 1
      }
    },
    responseExample: {
      id: 2,
      title: "Advanced JavaScript Course",
      slug: "advanced-javascript-course",
      description: "Master advanced JavaScript concepts",
      duration_hours: 60,
      level: "advanced",
      is_published: true,
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'PUT',
    path: '/api/admin/courses/{id}',
    description: 'Update a course (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Course ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        title: "Updated Course Title",
        is_published: false
      }
    },
    responseExample: {
      id: 2,
      title: "Updated Course Title",
      slug: "updated-course-title",
      is_published: false,
      updated_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/admin/courses/{id}',
    description: 'Delete a course (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Course ID'
      }
    ],
    responseExample: {
      message: "Course deleted successfully"
    }
  },

  // Categories Management
  {
    method: 'GET',
    path: '/api/categories',
    description: 'Get all categories',
    auth: false,
    responseExample: [
      {
        id: 1,
        name: "AI Automation",
        slug: "ai-automation",
        description: "Articles about AI automation",
        posts_count: 5,
        created_at: "2025-10-04T08:31:23.000000Z"
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/categories/{id}',
    description: 'Get a specific category by ID',
    auth: false,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Category ID'
      }
    ],
    responseExample: {
      id: 1,
      name: "AI Automation",
      slug: "ai-automation",
      description: "Articles about AI automation",
      posts_count: 5,
      created_at: "2025-10-04T08:31:23.000000Z"
    }
  },
  {
    method: 'POST',
    path: '/api/categories',
    description: 'Create a new category (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        name: "New Category",
        description: "Category description"
      }
    },
    responseExample: {
      id: 2,
      name: "New Category",
      slug: "new-category",
      description: "Category description",
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'PUT',
    path: '/api/categories/{id}',
    description: 'Update a category (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Category ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        name: "Updated Category Name",
        description: "Updated description"
      }
    },
    responseExample: {
      id: 2,
      name: "Updated Category Name",
      slug: "updated-category-name",
      description: "Updated description",
      updated_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/categories/{id}',
    description: 'Delete a category (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Category ID'
      }
    ],
    responseExample: {
      message: "Category deleted successfully"
    }
  },

  // Tags Management
  {
    method: 'GET',
    path: '/api/tags',
    description: 'Get all tags',
    auth: false,
    responseExample: [
      {
        id: 1,
        name: "React",
        slug: "react",
        description: "React.js related content",
        posts_count: 3,
        created_at: "2025-10-04T08:31:23.000000Z"
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/tags',
    description: 'Create a new tag (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        name: "JavaScript",
        description: "JavaScript related content"
      }
    },
    responseExample: {
      id: 2,
      name: "JavaScript",
      slug: "javascript",
      description: "JavaScript related content",
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'GET',
    path: '/api/tags/{id}',
    description: 'Get a specific tag by ID',
    auth: false,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Tag ID'
      }
    ],
    responseExample: {
      id: 1,
      name: "React",
      slug: "react",
      description: "React.js related content",
      posts_count: 3,
      created_at: "2025-10-04T08:31:23.000000Z"
    }
  },
  {
    method: 'PUT',
    path: '/api/tags/{id}',
    description: 'Update a tag (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Tag ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        name: "Updated Tag Name",
        description: "Updated description"
      }
    },
    responseExample: {
      id: 1,
      name: "Updated Tag Name",
      slug: "updated-tag-name",
      description: "Updated description",
      updated_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/tags/{id}',
    description: 'Delete a tag (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Tag ID'
      }
    ],
    responseExample: {
      message: "Tag deleted successfully"
    }
  },

  // Workflow Categories Management
  {
    method: 'GET',
    path: '/api/workflow-categories',
    description: 'Get all workflow categories',
    auth: false,
    responseExample: [
      {
        id: 1,
        name: "AI & Machine Learning",
        slug: "ai-machine-learning",
        description: "Workflows leveraging artificial intelligence and machine learning",
        created_at: "2025-10-15T18:33:33.000000Z"
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/workflow-categories',
    description: 'Create a new workflow category (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        name: "Data Analysis",
        description: "Workflows for collecting, processing, and analyzing data"
      }
    },
    responseExample: {
      id: 2,
      name: "Data Analysis",
      slug: "data-analysis",
      description: "Workflows for collecting, processing, and analyzing data",
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'PUT',
    path: '/api/admin/workflow-categories/{id}',
    description: 'Update a workflow category (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Workflow Category ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        name: "Updated Category Name",
        description: "Updated description"
      }
    },
    responseExample: {
      id: 2,
      name: "Updated Category Name",
      slug: "updated-category-name",
      description: "Updated description",
      updated_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/admin/workflow-categories/{id}',
    description: 'Delete a workflow category (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Workflow Category ID'
      }
    ],
    responseExample: {
      message: "Workflow category deleted successfully"
    }
  },

  // Contact Form
  {
    method: 'POST',
    path: '/api/contact',
    description: 'Submit contact form',
    auth: false,
    requestBody: {
      type: 'application/json',
      example: {
        name: "John Doe",
        email: "john@example.com",
        subject: "Inquiry about services",
        message: "I would like to know more about your automation services."
      }
    },
    responseExample: {
      message: "Thank you for your message. We will get back to you soon."
    }
  },

  // Watermark Remover API
  {
    method: 'POST',
    path: '/api/watermark-remover/upload',
    description: 'Upload image for watermark removal',
    auth: false,
    requestBody: {
      type: 'multipart/form-data',
      example: {
        image: '(binary file data)'
      }
    },
    responseExample: {
      job_id: "job_123456789",
      status: "uploaded",
      message: "Image uploaded successfully. Processing will begin shortly."
    }
  },
  {
    method: 'POST',
    path: '/api/watermark-remover/process/{jobId}',
    description: 'Start watermark removal process',
    auth: false,
    parameters: [
      {
        name: 'jobId',
        type: 'string',
        required: true,
        description: 'Job ID from upload response'
      }
    ],
    responseExample: {
      job_id: "job_123456789",
      status: "processing",
      message: "Watermark removal process started"
    }
  },
  {
    method: 'GET',
    path: '/api/watermark-remover/status/{jobId}',
    description: 'Check watermark removal status',
    auth: false,
    parameters: [
      {
        name: 'jobId',
        type: 'string',
        required: true,
        description: 'Job ID'
      }
    ],
    responseExample: {
      job_id: "job_123456789",
      status: "completed",
      progress: 100,
      download_url: "https://naqashthaheem.com/api/watermark-remover/download/job_123456789"
    }
  },
  {
    method: 'GET',
    path: '/api/watermark-remover/download/{jobId}',
    description: 'Download processed image',
    auth: false,
    parameters: [
      {
        name: 'jobId',
        type: 'string',
        required: true,
        description: 'Job ID'
      }
    ],
    responseExample: "(Binary file download)"
  },

  // User Management
  {
    method: 'GET',
    path: '/api/admin/users',
    description: 'Get all users (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'page',
        type: 'integer',
        required: false,
        description: 'Page number for pagination'
      },
      {
        name: 'search',
        type: 'string',
        required: false,
        description: 'Search users by name or email'
      },
      {
        name: 'role',
        type: 'string',
        required: false,
        description: 'Filter by role (admin, user)'
      }
    ],
    responseExample: [
      {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        created_at: "2025-10-04T08:31:23.000000Z",
        groups: []
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/users',
    description: 'Create a new user (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        name: "New User",
        email: "user@example.com",
        password: "password123",
        role: "user"
      }
    },
    responseExample: {
      id: 2,
      name: "New User",
      email: "user@example.com",
      role: "user",
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'PUT',
    path: '/api/admin/users/{id}',
    description: 'Update a user (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'User ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        name: "Updated User Name",
        role: "admin"
      }
    },
    responseExample: {
      id: 2,
      name: "Updated User Name",
      email: "user@example.com",
      role: "admin",
      updated_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/admin/users/{id}',
    description: 'Delete a user (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'User ID'
      }
    ],
    responseExample: {
      message: "User deleted successfully"
    }
  },

  // User Groups Management
  {
    method: 'GET',
    path: '/api/admin/user-groups',
    description: 'Get all user groups (Admin only)',
    auth: true,
    responseExample: [
      {
        id: 1,
        name: "Content Creators",
        color: "#3B82F6",
        members_count: 5,
        created_at: "2025-10-04T08:31:23.000000Z"
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/user-groups',
    description: 'Create a new user group (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        name: "New Group",
        color: "#10B981",
        description: "Group description"
      }
    },
    responseExample: {
      id: 2,
      name: "New Group",
      color: "#10B981",
      description: "Group description",
      members_count: 0,
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'POST',
    path: '/api/admin/user-groups/{id}/members',
    description: 'Add members to a user group (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Group ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        user_ids: [1, 2, 3]
      }
    },
    responseExample: {
      message: "Members added successfully",
      added_count: 3
    }
  },

  // API Token Management
  {
    method: 'GET',
    path: '/api/admin/api-tokens',
    description: 'Get all API tokens for current user (Admin only)',
    auth: true,
    responseExample: [
      {
        id: 1,
        name: "Mobile App Token",
        permissions: ["read", "write"],
        last_used_at: "2025-10-04T09:00:00.000000Z",
        expires_at: "2025-11-03T19:18:34.000000Z",
        created_at: "2025-10-04T19:18:34.000000Z"
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/api-tokens',
    description: 'Create a new API token (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        name: "New API Token",
        expires_in_days: 30,
        permissions: ["read", "write"]
      }
    },
    responseExample: {
      id: 2,
      name: "New API Token",
      token: "WjCaVwD3yTri3maNAbxvCXIFVL0SPMrWM2tks5Zv21WWHUsZGavWoOYPNgW6LJcL",
      permissions: ["read", "write"],
      expires_at: "2025-11-03T19:18:34.000000Z",
      created_at: "2025-10-04T19:18:34.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/admin/api-tokens/{id}',
    description: 'Delete an API token (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Token ID'
      }
    ],
    responseExample: {
      message: "Token deleted successfully"
    }
  },

  // Lesson Management
  {
    method: 'GET',
    path: '/api/courses/{courseId}/lessons',
    description: 'Get all lessons for a course (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'courseId',
        type: 'integer',
        required: true,
        description: 'Course ID'
      }
    ],
    responseExample: [
      {
        id: 1,
        title: "Introduction to React",
        slug: "introduction-to-react",
        content: "Learn the basics of React...",
        order: 1,
        duration_minutes: 30,
        is_published: true,
        course_id: 1
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/courses/{courseId}/lessons',
    description: 'Create a new lesson (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'courseId',
        type: 'integer',
        required: true,
        description: 'Course ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        title: "Advanced React Hooks",
        content: "Learn about advanced React hooks...",
        order: 2,
        duration_minutes: 45,
        is_published: true
      }
    },
    responseExample: {
      id: 2,
      title: "Advanced React Hooks",
      slug: "advanced-react-hooks",
      content: "Learn about advanced React hooks...",
      order: 2,
      duration_minutes: 45,
      is_published: true,
      course_id: 1,
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'PUT',
    path: '/api/courses/{courseId}/lessons/{id}',
    description: 'Update a lesson (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'courseId',
        type: 'integer',
        required: true,
        description: 'Course ID'
      },
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Lesson ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        title: "Updated Lesson Title",
        is_published: false
      }
    },
    responseExample: {
      id: 2,
      title: "Updated Lesson Title",
      slug: "updated-lesson-title",
      is_published: false,
      updated_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/courses/{courseId}/lessons/{id}',
    description: 'Delete a lesson (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'courseId',
        type: 'integer',
        required: true,
        description: 'Course ID'
      },
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Lesson ID'
      }
    ],
    responseExample: {
      message: "Lesson deleted successfully"
    }
  },

  // Lesson Progress Management
  {
    method: 'POST',
    path: '/api/lessons/{lessonId}/complete',
    description: 'Mark a lesson as completed',
    auth: true,
    parameters: [
      {
        name: 'lessonId',
        type: 'integer',
        required: true,
        description: 'Lesson ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        time_spent_minutes: 25,
        completion_percentage: 100
      }
    },
    responseExample: {
      message: "Lesson marked as completed",
      progress: {
        lesson_id: 1,
        user_id: 1,
        completed_at: "2025-10-04T10:00:00.000000Z",
        time_spent_minutes: 25
      }
    }
  },
  {
    method: 'GET',
    path: '/api/lessons/{lessonId}/progress',
    description: 'Get lesson progress for current user',
    auth: true,
    parameters: [
      {
        name: 'lessonId',
        type: 'integer',
        required: true,
        description: 'Lesson ID'
      }
    ],
    responseExample: {
      lesson_id: 1,
      user_id: 1,
      is_completed: true,
      completed_at: "2025-10-04T10:00:00.000000Z",
      time_spent_minutes: 25,
      completion_percentage: 100
    }
  },
  {
    method: 'GET',
    path: '/api/courses/{courseId}/progress',
    description: 'Get course progress for current user',
    auth: true,
    parameters: [
      {
        name: 'courseId',
        type: 'integer',
        required: true,
        description: 'Course ID'
      }
    ],
    responseExample: {
      course_id: 1,
      user_id: 1,
      total_lessons: 10,
      completed_lessons: 5,
      completion_percentage: 50,
      total_time_spent: 150
    }
  },

  // Lesson Tests
  {
    method: 'GET',
    path: '/api/lessons/{lessonId}/test',
    description: 'Get lesson test questions',
    auth: true,
    parameters: [
      {
        name: 'lessonId',
        type: 'integer',
        required: true,
        description: 'Lesson ID'
      }
    ],
    responseExample: {
      lesson_id: 1,
      questions: [
        {
          id: 1,
          question: "What is React?",
          options: ["A library", "A framework", "A language", "A database"],
          correct_answer: 0
        }
      ]
    }
  },
  {
    method: 'POST',
    path: '/api/lessons/{lessonId}/test/start',
    description: 'Start a lesson test',
    auth: true,
    parameters: [
      {
        name: 'lessonId',
        type: 'integer',
        required: true,
        description: 'Lesson ID'
      }
    ],
    responseExample: {
      attempt_id: 1,
      lesson_id: 1,
      started_at: "2025-10-04T10:00:00.000000Z",
      time_limit_minutes: 30
    }
  },
  {
    method: 'POST',
    path: '/api/lessons/{lessonId}/test/submit',
    description: 'Submit lesson test answers',
    auth: true,
    parameters: [
      {
        name: 'lessonId',
        type: 'integer',
        required: true,
        description: 'Lesson ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        attempt_id: 1,
        answers: [
          {
            question_id: 1,
            selected_answer: 0
          }
        ]
      }
    },
    responseExample: {
      attempt_id: 1,
      score: 100,
      passed: true,
      correct_answers: 1,
      total_questions: 1,
      completed_at: "2025-10-04T10:05:00.000000Z"
    }
  },

  // Course Enrollment
  {
    method: 'POST',
    path: '/api/courses/{id}/enroll',
    description: 'Enroll in a course',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Course ID'
      }
    ],
    responseExample: {
      message: "Successfully enrolled in course",
      enrollment: {
        id: 1,
        user_id: 1,
        course_id: 1,
        enrolled_at: "2025-10-04T10:00:00.000000Z"
      }
    }
  },
  {
    method: 'GET',
    path: '/api/my-courses',
    description: 'Get current user enrolled courses',
    auth: true,
    responseExample: [
      {
        id: 1,
        title: "React Development Course",
        slug: "react-development-course",
        description: "Learn React from scratch",
        progress_percentage: 50,
        enrolled_at: "2025-10-04T10:00:00.000000Z"
      }
    ]
  },

  // File Management
  {
    method: 'POST',
    path: '/api/files',
    description: 'Upload a file',
    auth: true,
    requestBody: {
      type: 'multipart/form-data',
      example: {
        file: '(binary file data)',
        is_public: true
      }
    },
    responseExample: {
      message: "File uploaded successfully.",
      file: {
        id: 1,
        name: "image",
        original_name: "image.png",
        path: "uploads/1760411843_image.png",
        mime_type: "image/png",
        size: 70,
        is_public: true,
        user_id: 2,
        created_at: "2025-10-14T03:16:41.000000Z",
        updated_at: "2025-10-14T03:16:41.000000Z"
      }
    }
  },
  {
    method: 'GET',
    path: '/api/files',
    description: 'Get all files for current user',
    auth: true,
    responseExample: [
      {
        id: 1,
        name: "image",
        original_name: "image.png",
        path: "uploads/1760411843_image.png",
        mime_type: "image/png",
        size: 70,
        is_public: true,
        user_id: 2,
        created_at: "2025-10-14T03:16:41.000000Z",
        updated_at: "2025-10-14T03:16:41.000000Z",
        user: {
          id: 2,
          name: "Admin User",
          email: "admin@example.com"
        }
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/files/{id}',
    description: 'Get a specific file by ID',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'File ID'
      }
    ],
    responseExample: {
      id: 1,
      name: "image",
      original_name: "image.png",
      path: "uploads/1760411843_image.png",
      mime_type: "image/png",
      size: 70,
      is_public: true,
      user_id: 2,
      created_at: "2025-10-14T03:16:41.000000Z",
      updated_at: "2025-10-14T03:16:41.000000Z"
    }
  },
  {
    method: 'DELETE',
    path: '/api/files/{id}',
    description: 'Delete a file',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'File ID'
      }
    ],
    responseExample: {
      message: "File deleted successfully"
    }
  },

  // Advanced Admin Endpoints
  {
    method: 'GET',
    path: '/api/admin/posts/stats',
    description: 'Get posts statistics (Admin only)',
    auth: true,
    responseExample: {
      total_posts: 25,
      published_posts: 20,
      draft_posts: 5,
      total_views: 1500,
      average_views_per_post: 60
    }
  },
  {
    method: 'GET',
    path: '/api/admin/workflows/stats',
    description: 'Get workflows statistics (Admin only)',
    auth: true,
    responseExample: {
      total_workflows: 15,
      published_workflows: 12,
      draft_workflows: 3,
      total_downloads: 250,
      average_downloads_per_workflow: 16.67
    }
  },
  {
    method: 'GET',
    path: '/api/admin/users/stats',
    description: 'Get users statistics (Admin only)',
    auth: true,
    responseExample: {
      total_users: 100,
      active_users: 85,
      admin_users: 3,
      new_users_this_month: 15
    }
  },
  {
    method: 'GET',
    path: '/api/admin/api-tokens-stats',
    description: 'Get API tokens statistics (Admin only)',
    auth: true,
    responseExample: {
      total_tokens: 10,
      active_tokens: 8,
      expired_tokens: 2,
      total_requests: 5000
    }
  },

  // Bulk Operations
  {
    method: 'POST',
    path: '/api/admin/bulk/posts/delete',
    description: 'Bulk delete posts (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        post_ids: [1, 2, 3]
      }
    },
    responseExample: {
      message: "3 posts deleted successfully",
      deleted_count: 3
    }
  },
  {
    method: 'POST',
    path: '/api/admin/bulk/posts/status',
    description: 'Bulk update post status (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        post_ids: [1, 2, 3],
        status: "published"
      }
    },
    responseExample: {
      message: "3 posts updated successfully",
      updated_count: 3
    }
  },
  {
    method: 'POST',
    path: '/api/admin/bulk/workflows/delete',
    description: 'Bulk delete workflows (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        workflow_ids: [1, 2, 3]
      }
    },
    responseExample: {
      message: "3 workflows deleted successfully",
      deleted_count: 3
    }
  },

  // Content Approval
  {
    method: 'GET',
    path: '/api/admin/approval/posts/pending',
    description: 'Get pending posts for approval (Admin only)',
    auth: true,
    responseExample: [
      {
        id: 1,
        title: "Pending Post",
        author: "John Doe",
        submitted_at: "2025-10-04T10:00:00.000000Z",
        status: "pending"
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/approval/posts/{id}/approve',
    description: 'Approve a post (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Post ID'
      }
    ],
    responseExample: {
      message: "Post approved successfully"
    }
  },
  {
    method: 'POST',
    path: '/api/admin/approval/posts/{id}/reject',
    description: 'Reject a post (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Post ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        reason: "Content does not meet quality standards"
      }
    },
    responseExample: {
      message: "Post rejected successfully"
    }
  },

  // Cache Management
  {
    method: 'POST',
    path: '/api/admin/cache/clear',
    description: 'Clear all cache (Admin only)',
    auth: true,
    responseExample: {
      message: "All cache cleared successfully"
    }
  },
  {
    method: 'GET',
    path: '/api/admin/cache/stats',
    description: 'Get cache statistics (Admin only)',
    auth: true,
    responseExample: {
      total_keys: 150,
      memory_usage: "25MB",
      hit_rate: 0.85
    }
  },

  // Activity Logs
  {
    method: 'GET',
    path: '/api/admin/activity-logs',
    description: 'Get activity logs (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'page',
        type: 'integer',
        required: false,
        description: 'Page number for pagination'
      },
      {
        name: 'user_id',
        type: 'integer',
        required: false,
        description: 'Filter by user ID'
      }
    ],
    responseExample: [
      {
        id: 1,
        user_id: 1,
        action: "created_post",
        description: "Created new post: 'Getting Started with AI'",
        ip_address: "192.168.1.1",
        created_at: "2025-10-04T10:00:00.000000Z"
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/admin/activity-logs/stats',
    description: 'Get activity logs statistics (Admin only)',
    auth: true,
    responseExample: {
      total_activities: 1000,
      activities_today: 50,
      most_active_user: "John Doe",
      top_actions: ["created_post", "updated_workflow", "logged_in"]
    }
  },

  // User Groups Management
  {
    method: 'GET',
    path: '/api/admin/user-groups',
    description: 'Get all user groups (Admin only)',
    auth: true,
    responseExample: [
      {
        id: 1,
        name: "Content Creators",
        color: "#3B82F6",
        members_count: 5,
        created_at: "2025-10-04T08:31:23.000000Z"
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/user-groups',
    description: 'Create a new user group (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        name: "New Group",
        color: "#10B981",
        description: "Group description"
      }
    },
    responseExample: {
      id: 2,
      name: "New Group",
      color: "#10B981",
      description: "Group description",
      members_count: 0,
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'POST',
    path: '/api/admin/user-groups/{id}/members',
    description: 'Add members to a user group (Admin only)',
    auth: true,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Group ID'
      }
    ],
    requestBody: {
      type: 'application/json',
      example: {
        user_ids: [1, 2, 3]
      }
    },
    responseExample: {
      message: "Members added successfully",
      added_count: 3
    }
  },

  // Gemini API Management
  {
    method: 'GET',
    path: '/api/admin/gemini-api-keys',
    description: 'Get all Gemini API keys (Admin only)',
    auth: true,
    responseExample: [
      {
        id: 1,
        name: "Primary Key",
        is_active: true,
        usage_count: 150,
        last_used_at: "2025-10-04T09:00:00.000000Z",
        created_at: "2025-10-04T08:31:23.000000Z"
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/gemini-api-keys',
    description: 'Create a new Gemini API key (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        name: "New API Key",
        api_key: "AIzaSyC...",
        is_active: true
      }
    },
    responseExample: {
      id: 2,
      name: "New API Key",
      is_active: true,
      usage_count: 0,
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  },
  {
    method: 'GET',
    path: '/api/admin/gemini-api-keys/health-check',
    description: 'Check health of all Gemini API keys (Admin only)',
    auth: true,
    responseExample: {
      total_keys: 3,
      active_keys: 2,
      inactive_keys: 1,
      health_status: "good"
    }
  },

  // CV Templates Management
  {
    method: 'GET',
    path: '/api/cv-templates',
    description: 'Get all CV templates (Public)',
    auth: false,
    responseExample: [
      {
        id: 1,
        name: "Modern Professional",
        category: "professional",
        ats_score: 9,
        thumbnail: "/images/cv-template-1.jpg",
        is_default: true
      }
    ]
  },
  {
    method: 'GET',
    path: '/api/cv-templates/{id}',
    description: 'Get a specific CV template (Public)',
    auth: false,
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'Template ID'
      }
    ],
    responseExample: {
      id: 1,
      name: "Modern Professional",
      category: "professional",
      ats_score: 9,
      html_content: "<div>Template HTML...</div>",
      json_config: {"layout": "single-column"},
      customizable_options: ["colors", "fonts"],
      field_mappings: {"name": "full_name"}
    }
  },
  {
    method: 'POST',
    path: '/api/cv-templates/customize',
    description: 'Customize a CV template (Public)',
    auth: false,
    requestBody: {
      type: 'application/json',
      example: {
        template_id: 1,
        personal_data: {
          full_name: "John Doe",
          email: "john@example.com",
          phone: "+1234567890"
        },
        customizations: {
          colors: {"primary": "#3B82F6"},
          fonts: {"heading": "Arial"}
        }
      }
    },
    responseExample: {
      customized_html: "<div>Customized CV HTML...</div>",
      download_url: "https://naqashthaheem.com/api/cv-templates/download/custom_123"
    }
  },

  // CV AI Routes
  {
    method: 'POST',
    path: '/api/cv-ai/extract',
    description: 'Extract data from CV using AI',
    auth: false,
    requestBody: {
      type: 'multipart/form-data',
      example: {
        cv_file: '(binary file data)'
      }
    },
    responseExample: {
      extracted_data: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        experience: ["Software Engineer at Company A"],
        education: ["Bachelor in Computer Science"]
      },
      confidence_score: 0.95
    }
  },
  {
    method: 'POST',
    path: '/api/cv-ai/tailor',
    description: 'Tailor CV for specific job using AI',
    auth: false,
    requestBody: {
      type: 'application/json',
      example: {
        cv_data: {
          name: "John Doe",
          experience: ["Software Engineer"]
        },
        job_description: "Looking for React developer with 3+ years experience",
        target_role: "Senior React Developer"
      }
    },
    responseExample: {
      tailored_cv: {
        optimized_summary: "Experienced React developer with 3+ years...",
        key_skills: ["React", "JavaScript", "Node.js"],
        tailored_experience: ["Led React development projects..."]
      }
    }
  },

  // Home Settings
  {
    method: 'GET',
    path: '/api/home-settings',
    description: 'Get public home settings',
    auth: false,
    responseExample: {
      hero_title: "Welcome to Naqash Thaheem",
      hero_subtitle: "Systems Analyst & Automation Specialist",
      featured_workflows: 3,
      total_courses: 5
    }
  },
  {
    method: 'GET',
    path: '/api/admin/home-settings',
    description: 'Get all home settings (Admin only)',
    auth: true,
    responseExample: [
      {
        id: 1,
        key: "hero_title",
        value: "Welcome to Naqash Thaheem",
        is_active: true,
        updated_at: "2025-10-04T10:00:00.000000Z"
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/home-settings',
    description: 'Create or update home setting (Admin only)',
    auth: true,
    requestBody: {
      type: 'application/json',
      example: {
        key: "hero_title",
        value: "New Hero Title",
        is_active: true
      }
    },
    responseExample: {
      id: 1,
      key: "hero_title",
      value: "New Hero Title",
      is_active: true,
      created_at: "2025-10-04T10:00:00.000000Z"
    }
  }
];

export default function ApiDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'examples'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    method: '',
    auth: '',
    category: '',
    hasParameters: '',
    hasRequestBody: '',
    hasResponseExample: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useSEO({
    title: 'API Documentation | Admin Dashboard',
    description: 'Complete API documentation for NovaWrite platform',
    url: '/admin/api-docs'
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

  const filteredEndpoints = API_ENDPOINTS.filter(endpoint => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in multiple fields
    const searchableFields = [
      endpoint.path,
      endpoint.description,
      endpoint.method,
      // Search in parameters
      ...(endpoint.parameters || []).map(p => `${p.name} ${p.type} ${p.description}`),
      // Search in request body example keys
      ...(endpoint.requestBody?.example ? Object.keys(endpoint.requestBody.example) : []),
      // Search in response example keys
      ...(endpoint.responseExample ? Object.keys(endpoint.responseExample) : []),
      // Search in auth requirement
      endpoint.auth ? 'authenticated' : 'public',
      // Search in specific categories
      endpoint.path.includes('/admin/') ? 'admin' : '',
      endpoint.path.includes('/auth/') ? 'authentication' : '',
      endpoint.path.includes('/workflows') ? 'workflow' : '',
      endpoint.path.includes('/courses') ? 'course' : '',
      endpoint.path.includes('/posts') ? 'post' : '',
      endpoint.path.includes('/files') ? 'file' : '',
      endpoint.path.includes('/users') ? 'user' : '',
      endpoint.path.includes('/health') ? 'health' : '',
      endpoint.path.includes('/bulk') ? 'bulk' : '',
      endpoint.path.includes('/approval') ? 'approval' : '',
      endpoint.path.includes('/cache') ? 'cache' : '',
      endpoint.path.includes('/activity') ? 'activity' : '',
      endpoint.path.includes('/gemini') ? 'gemini' : '',
      endpoint.path.includes('/cv-') ? 'cv' : '',
      endpoint.path.includes('/watermark') ? 'watermark' : '',
      endpoint.path.includes('/contact') ? 'contact' : '',
      endpoint.path.includes('/tags') ? 'tag' : '',
      endpoint.path.includes('/categories') ? 'category' : '',
    ].filter(Boolean);
    
    // Apply search filter
    const matchesSearch = searchTerm === '' || searchableFields.some(field => 
      field.toLowerCase().includes(searchLower)
    );
    
    // Apply additional filters
    const matchesMethod = filters.method === '' || endpoint.method === filters.method;
    const matchesAuth = filters.auth === '' || 
      (filters.auth === 'authenticated' && endpoint.auth) ||
      (filters.auth === 'public' && !endpoint.auth);
    const matchesCategory = filters.category === '' || 
      (filters.category === 'admin' && endpoint.path.includes('/admin/')) ||
      (filters.category === 'auth' && endpoint.path.includes('/auth/')) ||
      (filters.category === 'workflow' && endpoint.path.includes('/workflows')) ||
      (filters.category === 'course' && endpoint.path.includes('/courses')) ||
      (filters.category === 'post' && endpoint.path.includes('/posts')) ||
      (filters.category === 'file' && endpoint.path.includes('/files')) ||
      (filters.category === 'user' && endpoint.path.includes('/users')) ||
      (filters.category === 'health' && endpoint.path.includes('/health')) ||
      (filters.category === 'bulk' && endpoint.path.includes('/bulk')) ||
      (filters.category === 'approval' && endpoint.path.includes('/approval')) ||
      (filters.category === 'cache' && endpoint.path.includes('/cache')) ||
      (filters.category === 'activity' && endpoint.path.includes('/activity')) ||
      (filters.category === 'gemini' && endpoint.path.includes('/gemini')) ||
      (filters.category === 'cv' && endpoint.path.includes('/cv-')) ||
      (filters.category === 'watermark' && endpoint.path.includes('/watermark')) ||
      (filters.category === 'contact' && endpoint.path.includes('/contact')) ||
      (filters.category === 'tag' && endpoint.path.includes('/tags')) ||
      (filters.category === 'category' && endpoint.path.includes('/categories'));
    const matchesParameters = filters.hasParameters === '' ||
      (filters.hasParameters === 'yes' && endpoint.parameters && endpoint.parameters.length > 0) ||
      (filters.hasParameters === 'no' && (!endpoint.parameters || endpoint.parameters.length === 0));
    const matchesRequestBody = filters.hasRequestBody === '' ||
      (filters.hasRequestBody === 'yes' && endpoint.requestBody) ||
      (filters.hasRequestBody === 'no' && !endpoint.requestBody);
    const matchesResponseExample = filters.hasResponseExample === '' ||
      (filters.hasResponseExample === 'yes' && endpoint.responseExample) ||
      (filters.hasResponseExample === 'no' && !endpoint.responseExample);
    
    return matchesSearch && matchesMethod && matchesAuth && matchesCategory && 
           matchesParameters && matchesRequestBody && matchesResponseExample;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
        <p className="text-gray-600 mt-1">Complete API reference for NovaWrite platform integration</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'endpoints', name: 'Endpoints' },
            { id: 'examples', name: 'Examples' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Base URL</h3>
            <code className="text-blue-800 font-mono">https://naqashthaheem.com/api</code>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Authentication</h3>
            <p className="text-gray-600 mb-4">
              You can authenticate using either a JWT Token or an API Token:
            </p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Option 1: JWT Token (Temporary)</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Login via <code className="bg-gray-100 px-1">/auth/login</code> to get a JWT token.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Expires after 1 hour (30 days with "Remember Me")</li>
                  <li>• Best for: Testing, user-specific operations</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Option 2: API Token (Permanent)</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Create tokens from <strong>Admin Dashboard → API Tokens</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Never expires (unless you set an expiration date)</li>
                  <li>• Best for: Automated integrations, scripts, production use</li>
                  <li>• ✅ <strong>Fully tested and working!</strong></li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600 mb-2">Include your token in all requests:</p>
                <code className="text-sm">
                  Authorization: Bearer {'{your-token}'}
                </code>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">API Status: All Systems Operational</h3>
                <p className="text-green-800 mb-3">All endpoints have been tested and verified working!</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white rounded px-3 py-2">
                    <div className="text-green-600 font-semibold">Posts</div>
                    <div className="text-gray-600">✅ CRUD</div>
                  </div>
                  <div className="bg-white rounded px-3 py-2">
                    <div className="text-green-600 font-semibold">Workflows</div>
                    <div className="text-gray-600">✅ CRUD</div>
                  </div>
                  <div className="bg-white rounded px-3 py-2">
                    <div className="text-green-600 font-semibold">Courses</div>
                    <div className="text-gray-600">✅ CRUD</div>
                  </div>
                  <div className="bg-white rounded px-3 py-2">
                    <div className="text-green-600 font-semibold">Files</div>
                    <div className="text-gray-600">✅ Upload/List/Get/Delete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Response Format</h3>
            <p className="text-gray-600 mb-4">
              All API responses are returned in JSON format with the following structure:
            </p>
            <div className="bg-gray-50 rounded p-4">
              <pre className="text-sm overflow-x-auto">
{`{
  "data": { /* Response data */ },
  "message": "Success message",
  "status": "success"
}`}
              </pre>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Error Handling</h3>
            <p className="text-gray-600 mb-4">
              Errors are returned with appropriate HTTP status codes and error messages:
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">400</span>
                <span className="text-sm">Bad Request - Invalid input data</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">401</span>
                <span className="text-sm">Unauthorized - Invalid or missing token</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">403</span>
                <span className="text-sm">Forbidden - Insufficient permissions</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">404</span>
                <span className="text-sm">Not Found - Resource not found</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by endpoint, method, description, parameters, data fields, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Method Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
                    <select
                      value={filters.method}
                      onChange={(e) => setFilters({...filters, method: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Methods</option>
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  {/* Authentication Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
                    <select
                      value={filters.auth}
                      onChange={(e) => setFilters({...filters, auth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Endpoints</option>
                      <option value="authenticated">Authenticated Only</option>
                      <option value="public">Public Only</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Categories</option>
                      <option value="admin">Admin</option>
                      <option value="auth">Authentication</option>
                      <option value="workflow">Workflow</option>
                      <option value="course">Course</option>
                      <option value="post">Post</option>
                      <option value="file">File</option>
                      <option value="user">User</option>
                      <option value="health">Health</option>
                      <option value="bulk">Bulk Operations</option>
                      <option value="approval">Content Approval</option>
                      <option value="cache">Cache Management</option>
                      <option value="activity">Activity Logs</option>
                      <option value="gemini">Gemini AI</option>
                      <option value="cv">CV Templates</option>
                      <option value="watermark">Watermark Remover</option>
                      <option value="contact">Contact</option>
                      <option value="tag">Tags</option>
                      <option value="category">Categories</option>
                    </select>
                  </div>

                  {/* Parameters Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Has Parameters</label>
                    <select
                      value={filters.hasParameters}
                      onChange={(e) => setFilters({...filters, hasParameters: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Endpoints</option>
                      <option value="yes">With Parameters</option>
                      <option value="no">Without Parameters</option>
                    </select>
                  </div>

                  {/* Request Body Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Has Request Body</label>
                    <select
                      value={filters.hasRequestBody}
                      onChange={(e) => setFilters({...filters, hasRequestBody: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Endpoints</option>
                      <option value="yes">With Request Body</option>
                      <option value="no">Without Request Body</option>
                    </select>
                  </div>

                  {/* Response Example Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Has Response Example</label>
                    <select
                      value={filters.hasResponseExample}
                      onChange={(e) => setFilters({...filters, hasResponseExample: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Endpoints</option>
                      <option value="yes">With Response Example</option>
                      <option value="no">Without Response Example</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-sm text-gray-600">
                    {Object.values(filters).filter(f => f !== '').length > 0 && (
                      <span>
                        {Object.values(filters).filter(f => f !== '').length} filter{Object.values(filters).filter(f => f !== '').length !== 1 ? 's' : ''} active
                      </span>
                    )}
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => setFilters({
                        method: '',
                        auth: '',
                        category: '',
                        hasParameters: '',
                        hasRequestBody: '',
                        hasResponseExample: ''
                      })}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
            {(searchTerm || Object.values(filters).some(f => f !== '')) && (
              <div className="mt-2 space-y-2">
                <div className="text-sm text-gray-600">
                  Found {filteredEndpoints.length} endpoint{filteredEndpoints.length !== 1 ? 's' : ''} 
                  {searchTerm && ` matching "${searchTerm}"`}
                  {Object.values(filters).filter(f => f !== '').length > 0 && ` with ${Object.values(filters).filter(f => f !== '').length} filter${Object.values(filters).filter(f => f !== '').length !== 1 ? 's' : ''}`}
                </div>
                
                {/* Search Suggestions */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Try searching for:</span>
                  {[
                    'admin', 'auth', 'workflow', 'course', 'post', 'file', 'user', 
                    'health', 'bulk', 'approval', 'cache', 'activity', 'gemini', 
                    'cv', 'watermark', 'contact', 'tag', 'category', 'authenticated', 
                    'public', 'GET', 'POST', 'PUT', 'DELETE', 'stats', 'create', 
                    'update', 'delete', 'upload', 'download'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setSearchTerm(suggestion)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(searchTerm || Object.values(filters).some(f => f !== '')) && filteredEndpoints.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Filtered Results Summary</h3>
              
              {/* Active Filters */}
              {Object.values(filters).some(f => f !== '') && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-blue-800">Active Filters:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {filters.method && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Method: {filters.method}
                      </span>
                    )}
                    {filters.auth && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Auth: {filters.auth}
                      </span>
                    )}
                    {filters.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Category: {filters.category}
                      </span>
                    )}
                    {filters.hasParameters && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Parameters: {filters.hasParameters}
                      </span>
                    )}
                    {filters.hasRequestBody && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Request Body: {filters.hasRequestBody}
                      </span>
                    )}
                    {filters.hasResponseExample && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Response: {filters.hasResponseExample}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white rounded px-2 py-1">
                  <span className="font-medium text-blue-600">Methods:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[...new Set(filteredEndpoints.map(e => e.method))].map(method => (
                      <span key={method} className={`px-1 py-0.5 rounded text-xs ${getMethodColor(method)}`}>
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded px-2 py-1">
                  <span className="font-medium text-blue-600">Auth:</span>
                  <div className="mt-1">
                    {filteredEndpoints.filter(e => e.auth).length > 0 && (
                      <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs mr-1">
                        {filteredEndpoints.filter(e => e.auth).length} Auth
                      </span>
                    )}
                    {filteredEndpoints.filter(e => !e.auth).length > 0 && (
                      <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                        {filteredEndpoints.filter(e => !e.auth).length} Public
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded px-2 py-1">
                  <span className="font-medium text-blue-600">Categories:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[...new Set(filteredEndpoints.map(e => {
                      if (e.path.includes('/admin/')) return 'Admin';
                      if (e.path.includes('/auth/')) return 'Auth';
                      if (e.path.includes('/workflows')) return 'Workflow';
                      if (e.path.includes('/courses')) return 'Course';
                      if (e.path.includes('/posts')) return 'Post';
                      if (e.path.includes('/files')) return 'File';
                      if (e.path.includes('/users')) return 'User';
                      if (e.path.includes('/health')) return 'Health';
                      return 'Other';
                    }))].slice(0, 3).map(cat => (
                      <span key={cat} className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded px-2 py-1">
                  <span className="font-medium text-blue-600">Total:</span>
                  <span className="ml-1 text-gray-700">{filteredEndpoints.length} endpoints</span>
                </div>
              </div>
            </div>
          )}

          {filteredEndpoints.length === 0 && (searchTerm || Object.values(filters).some(f => f !== '')) ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No endpoints found</h3>
              <p className="text-gray-600 mb-4">No endpoints match your search for "{searchTerm}"</p>
              
              <div className="space-y-3 text-left max-w-md mx-auto">
                <h4 className="font-medium text-gray-900">Search Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Try searching by category: <code className="bg-gray-200 px-1 rounded">admin</code>, <code className="bg-gray-200 px-1 rounded">auth</code>, <code className="bg-gray-200 px-1 rounded">workflow</code></li>
                  <li>• Search by HTTP method: <code className="bg-gray-200 px-1 rounded">GET</code>, <code className="bg-gray-200 px-1 rounded">POST</code>, <code className="bg-gray-200 px-1 rounded">PUT</code>, <code className="bg-gray-200 px-1 rounded">DELETE</code></li>
                  <li>• Search by data fields: <code className="bg-gray-200 px-1 rounded">title</code>, <code className="bg-gray-200 px-1 rounded">email</code>, <code className="bg-gray-200 px-1 rounded">password</code></li>
                  <li>• Search by authentication: <code className="bg-gray-200 px-1 rounded">authenticated</code>, <code className="bg-gray-200 px-1 rounded">public</code></li>
                  <li>• Search by functionality: <code className="bg-gray-200 px-1 rounded">upload</code>, <code className="bg-gray-200 px-1 rounded">download</code>, <code className="bg-gray-200 px-1 rounded">stats</code></li>
                </ul>
              </div>
              
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredEndpoints.map((endpoint, index) => (
            <div key={index} className="bg-white border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                    {endpoint.auth && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        Auth Required
                      </span>
                    )}
                    {endpoint.path.includes('/admin/') && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEndpoint(selectedEndpoint?.path === endpoint.path ? null : endpoint)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {selectedEndpoint?.path === endpoint.path ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
                <p className="text-gray-600 mt-2">{endpoint.description}</p>
                
                {/* Quick info about parameters and data */}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {endpoint.parameters.length} param{endpoint.parameters.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {endpoint.requestBody && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Request body
                    </span>
                  )}
                  {endpoint.responseExample && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Response example
                    </span>
                  )}
                </div>
              </div>

              {selectedEndpoint?.path === endpoint.path && (
                <div className="px-6 py-4 space-y-4">
                  {endpoint.parameters && (
                    <div>
                      <h4 className="font-semibold mb-2">Parameters</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Name</th>
                              <th className="text-left py-2">Type</th>
                              <th className="text-left py-2">Required</th>
                              <th className="text-left py-2">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.parameters.map((param, i) => (
                              <tr key={i} className="border-b">
                                <td className="py-2 font-mono">{param.name}</td>
                                <td className="py-2">{param.type}</td>
                                <td className="py-2">{param.required ? 'Yes' : 'No'}</td>
                                <td className="py-2">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {endpoint.requestBody && (
                    <div>
                      <h4 className="font-semibold mb-2">Request Body</h4>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-sm text-gray-600 mb-2">Content-Type: {endpoint.requestBody.type}</div>
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(endpoint.requestBody.example, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Response Example</h4>
                    <div className="bg-gray-50 rounded p-3">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(endpoint.responseExample, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
          )}
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">cURL Examples</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Get all workflows</h4>
                <div className="bg-gray-900 text-green-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`curl -X GET "https://naqashthaheem.com/api/workflows" \\
  -H "Accept: application/json"`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Create a workflow (Admin)</h4>
                <div className="bg-gray-900 text-green-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`curl -X POST "https://naqashthaheem.com/api/admin/workflows" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflow_category_id": 1,
    "title": "New Workflow",
    "summary": "Workflow summary",
    "tools": ["Tool 1", "Tool 2"],
    "benefits": ["Benefit 1", "Benefit 2"],
    "status": "draft"
  }'`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Login and get token</h4>
                <div className="bg-gray-900 text-green-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`curl -X POST "https://naqashthaheem.com/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Upload a file</h4>
                <div className="bg-gray-900 text-green-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`curl -X POST "https://naqashthaheem.com/api/files" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@/path/to/image.png" \\
  -F "is_public=true"`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Complete Workflow: Create Workflow with Files</h4>
                <div className="bg-gray-900 text-green-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`# Step 1: Upload file and get file_id
FILE_ID=$(curl -s -X POST "https://naqashthaheem.com/api/files" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@diagram.png" | jq -r '.file.id')

# Step 2: Create workflow and get workflow_id
WF_ID=$(curl -s -X POST "https://naqashthaheem.com/api/admin/workflows" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Customer Onboarding",
    "summary": "Automated onboarding process",
    "description": "<p>Complete workflow</p>",
    "slug": "customer-onboarding",
    "workflow_category_id": 1,
    "status": "draft"
  }' | jq -r '.id')

# Step 3: Attach file to workflow
curl -X POST "https://naqashthaheem.com/api/admin/workflows/$WF_ID/files" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"file_id\\": $FILE_ID,
    \\"display_name\\": \\"Process Diagram\\",
    \\"description\\": \\"Main workflow diagram\\",
    \\"sort_order\\": 1
  }"

# Step 4: Publish workflow
curl -X PUT "https://naqashthaheem.com/api/admin/workflows/$WF_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "published", "is_published": true}'`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">JavaScript Examples</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Fetch workflows</h4>
                <div className="bg-gray-900 text-blue-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`fetch('https://naqashthaheem.com/api/workflows')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Create workflow with authentication</h4>
                <div className="bg-gray-900 text-blue-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`const token = 'YOUR_TOKEN';

fetch('https://naqashthaheem.com/api/admin/workflows', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workflow_category_id: 1,
    title: 'New Workflow',
    summary: 'Workflow summary',
    tools: ['Tool 1', 'Tool 2'],
    benefits: ['Benefit 1', 'Benefit 2'],
    status: 'draft'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Complete Workflow: Upload & Attach Files</h4>
                <div className="bg-gray-900 text-blue-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`const token = 'YOUR_TOKEN';

// Step 1: Upload file
async function createWorkflowWithFiles() {
  // Upload file
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  
  const fileResponse = await fetch('https://naqashthaheem.com/api/files', {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${token}\` },
    body: formData
  });
  const { file } = await fileResponse.json();
  
  // Create workflow
  const workflowResponse = await fetch('https://naqashthaheem.com/api/admin/workflows', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Customer Onboarding',
      summary: 'Automated process',
      description: '<p>Complete workflow</p>',
      slug: 'customer-onboarding',
      workflow_category_id: 1,
      status: 'draft'
    })
  });
  const workflow = await workflowResponse.json();
  
  // Attach file to workflow
  const attachResponse = await fetch(\`https://naqashthaheem.com/api/admin/workflows/\${workflow.id}/files\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_id: file.id,
      display_name: 'Process Diagram',
      description: 'Main workflow diagram',
      sort_order: 1
    })
  });
  
  const attachedFile = await attachResponse.json();
  console.log('Workflow created with file:', attachedFile);
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Course Management with Lessons</h4>
                <div className="bg-gray-900 text-blue-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`const token = 'YOUR_TOKEN';

// Create course with lessons
async function createCourseWithLessons() {
  // Create course
  const courseResponse = await fetch('https://naqashthaheem.com/api/admin/courses', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Complete React Course',
      description: 'Learn React from basics to advanced',
      duration_hours: 40,
      level: 'beginner',
      is_published: true
    })
  });
  const course = await courseResponse.json();
  
  // Add lessons
  const lessons = [
    { title: 'Introduction to React', order: 1, duration_minutes: 30 },
    { title: 'Components and Props', order: 2, duration_minutes: 45 },
    { title: 'State and Lifecycle', order: 3, duration_minutes: 60 }
  ];
  
  for (const lessonData of lessons) {
    await fetch(\`https://naqashthaheem.com/api/admin/courses/\${course.id}/lessons\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...lessonData,
        content: \`<h1>\${lessonData.title}</h1><p>Lesson content...</p>\`,
        is_published: true
      })
    });
  }
  
  console.log('Course created with lessons:', course.id);
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">User Management & Analytics</h4>
                <div className="bg-gray-900 text-blue-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`const token = 'YOUR_TOKEN';

// Get comprehensive analytics
async function getAnalytics() {
  const [postsStats, workflowsStats, usersStats, activityLogs] = await Promise.all([
    fetch('https://naqashthaheem.com/api/admin/posts/stats', {
      headers: { 'Authorization': \`Bearer \${token}\` }
    }).then(r => r.json()),
    
    fetch('https://naqashthaheem.com/api/admin/workflows/stats', {
      headers: { 'Authorization': \`Bearer \${token}\` }
    }).then(r => r.json()),
    
    fetch('https://naqashthaheem.com/api/admin/users/stats', {
      headers: { 'Authorization': \`Bearer \${token}\` }
    }).then(r => r.json()),
    
    fetch('https://naqashthaheem.com/api/admin/activity-logs/stats', {
      headers: { 'Authorization': \`Bearer \${token}\` }
    }).then(r => r.json())
  ]);
  
  return {
    posts: postsStats,
    workflows: workflowsStats,
    users: usersStats,
    activity: activityLogs
  };
}

// Bulk operations
async function bulkUpdatePosts() {
  const response = await fetch('https://naqashthaheem.com/api/admin/bulk/posts/status', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      post_ids: [1, 2, 3, 4, 5],
      status: 'published'
    })
  });
  
  const result = await response.json();
  console.log(\`Updated \${result.updated_count} posts\`);
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">CV AI Integration</h4>
                <div className="bg-gray-900 text-blue-400 rounded p-4 overflow-x-auto">
                  <pre className="text-sm">
{`// Extract data from CV using AI
async function extractCvData(cvFile) {
  const formData = new FormData();
  formData.append('cv_file', cvFile);
  
  const response = await fetch('https://naqashthaheem.com/api/cv-ai/extract', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log('Extracted data:', result.extracted_data);
  console.log('Confidence score:', result.confidence_score);
  
  return result.extracted_data;
}

// Tailor CV for specific job
async function tailorCv(cvData, jobDescription) {
  const response = await fetch('https://naqashthaheem.com/api/cv-ai/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cv_data: cvData,
      job_description: jobDescription,
      target_role: 'Senior React Developer'
    })
  });
  
  const result = await response.json();
  console.log('Tailored CV:', result.tailored_cv);
  
  return result;
}

// Get available CV templates
async function getCvTemplates() {
  const response = await fetch('https://naqashthaheem.com/api/cv-templates');
  const templates = await response.json();
  
  console.log('Available templates:', templates);
  return templates;
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
