import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import Pagination from '../../components/Pagination';
import EnhancedImageUpload from '../../components/EnhancedImageUpload';
import AdvancedFilters from '../../components/AdvancedFilters';
import { useSEO } from '../../utils/seo';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  is_published: boolean;
  category_id: number;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    tags: [] as string[],
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    category_id: '',
    is_published: false,
    meta_description: '',
    meta_keywords: '',
    tags: [] as number[],
  });

  useSEO({ title: 'Manage Posts | Admin' });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTags();
  }, []);

  // Filter configuration
  const filterConfigs = [
    {
      name: 'category',
      label: 'Category',
      type: 'select' as const,
      options: categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' }
      ]
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'multiselect' as const,
      options: tags.map(tag => ({ value: tag.id.toString(), label: tag.name }))
    },
    {
      name: 'dateFrom',
      label: 'From Date',
      type: 'date' as const
    },
    {
      name: 'dateTo',
      label: 'To Date',
      type: 'date' as const
    }
  ];

  // Apply filters
  useEffect(() => {
    let filtered = [...posts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(post => post.category_id.toString() === filters.category);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(post => 
        filters.status === 'published' ? post.is_published : !post.is_published
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(post =>
        post.tags?.some(tag => filters.tags.includes(tag.id.toString()))
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(post => {
        const postDate = new Date(post.created_at || post.updated_at);
        const fromDate = new Date(filters.dateFrom);
        return postDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(post => {
        const postDate = new Date(post.created_at || post.updated_at);
        const toDate = new Date(filters.dateTo);
        return postDate <= toDate;
      });
    }

    setFilteredPosts(filtered);
  }, [posts, filters]);

  const fetchPosts = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/posts?page=${page}&per_page=${pagination.perPage}`);
      setPosts(response.data.data || []);
      setPagination({
        currentPage: response.data.current_page || 1,
        lastPage: response.data.last_page || 1,
        total: response.data.total || 0,
        perPage: response.data.per_page || 10
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await apiClient.get('/tags');
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
      // Fallback to default tags if API fails
      setTags([
        { id: 1, name: 'AI', color: '#3B82F6', slug: 'ai', description: 'Artificial Intelligence' },
        { id: 2, name: 'Automation', color: '#10B981', slug: 'automation', description: 'Process Automation' },
        { id: 3, name: 'Technology', color: '#8B5CF6', slug: 'technology', description: 'General Technology' },
        { id: 4, name: 'Programming', color: '#F59E0B', slug: 'programming', description: 'Programming and Development' },
        { id: 5, name: 'Machine Learning', color: '#EF4444', slug: 'machine-learning', description: 'Machine Learning' },
        { id: 6, name: 'Data Science', color: '#06B6D4', slug: 'data-science', description: 'Data Science and Analytics' },
        { id: 7, name: 'Web Development', color: '#84CC16', slug: 'web-development', description: 'Web Development' },
        { id: 8, name: 'Mobile', color: '#F97316', slug: 'mobile', description: 'Mobile Development' },
        { id: 9, name: 'Cloud', color: '#6366F1', slug: 'cloud', description: 'Cloud Computing' },
        { id: 10, name: 'Security', color: '#DC2626', slug: 'security', description: 'Cybersecurity' },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, category_id: Number(formData.category_id) };
      if (editingId) {
        await apiClient.put(`/admin/posts/${editingId}`, data);
      } else {
        await apiClient.post('/admin/posts', data);
      }
      resetForm();
      fetchPosts(pagination.currentPage);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      featured_image: '',
      category_id: '',
      is_published: false,
      meta_description: '',
      meta_keywords: '',
      tags: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (post: any) => {
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featured_image: post.featured_image || '',
      category_id: String(post.category_id),
      is_published: post.is_published,
      meta_description: post.meta_description || '',
      meta_keywords: post.meta_keywords || '',
      tags: post.tags ? post.tags.map((tag: Tag) => tag.id) : [],
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await apiClient.delete(`/admin/posts/${id}`);
        fetchPosts(pagination.currentPage);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Blog Posts Management</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Post'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, tag.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              tags: formData.tags.filter(id => id !== tag.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span 
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.tags.length === 0 && (
                  <p className="text-sm text-gray-500">No tags selected</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
              <p className="text-xs text-gray-500 mb-2">
                💡 To add images: Use <code className="bg-gray-100 px-1 rounded">&lt;img src="URL" alt="description" class="w-full rounded-lg my-4" /&gt;</code>
              </p>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
                rows={10}
                required
              />
            </div>
            <EnhancedImageUpload
              onImageUploaded={(imageUrl) => setFormData({ ...formData, featured_image: imageUrl })}
              currentImage={formData.featured_image}
              label="Featured Image"
              maxSize={5}
            />
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={2}
                    placeholder="Brief description for search engines (150-160 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-700">
                Published
              </label>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Advanced Filters */}
      <AdvancedFilters
        filterConfigs={filterConfigs}
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(newFilters as typeof filters)}
        onApply={() => {}} // Filters are applied automatically via useEffect
        onClearAll={() => setFilters({
          search: '',
          category: '',
          status: '',
          tags: [],
          dateFrom: '',
          dateTo: ''
        })}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        resultsCount={filteredPosts.length}
      />

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <tr key={post.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{post.title}</td>
                <td className="px-6 py-4">
                  {post.featured_image ? (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${post.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {post.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <Pagination
          currentPage={pagination.currentPage}
          lastPage={pagination.lastPage}
          total={pagination.total}
          perPage={pagination.perPage}
          onPageChange={fetchPosts}
          loading={loading}
        />
      </div>
    </div>
  );
}
