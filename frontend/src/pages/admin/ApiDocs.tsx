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
    description: 'Get all published posts with pagination',
    auth: false,
    parameters: [
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
        description: 'Number of posts per page'
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
  }
];

export default function ApiDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'examples'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredEndpoints = API_ENDPOINTS.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {/* Search Bar */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search endpoints by path, method, or description..."
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
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                Found {filteredEndpoints.length} endpoint{filteredEndpoints.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
            )}
          </div>

          {filteredEndpoints.map((endpoint, index) => (
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
                  </div>
                  <button
                    onClick={() => setSelectedEndpoint(selectedEndpoint?.path === endpoint.path ? null : endpoint)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {selectedEndpoint?.path === endpoint.path ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
                <p className="text-gray-600 mt-2">{endpoint.description}</p>
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
          ))}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
