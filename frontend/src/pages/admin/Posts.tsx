import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import type { Post, Category } from '../../types';
import HtmlEditor from '../../components/HtmlEditor';

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category_id: '',
    featured_image: '',
    is_published: false,
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    const response = await apiClient.get('/admin/posts');
    setPosts(response.data.data);
  };

  const fetchCategories = async () => {
    const response = await apiClient.get('/categories');
    setCategories(response.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, category_id: Number(formData.category_id) };
      if (editingId) {
        await apiClient.put(`/posts/${editingId}`, data);
      } else {
        await apiClient.post('/posts', data);
      }
      resetForm();
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category_id: '',
      featured_image: '',
      is_published: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (post: Post) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      category_id: String(post.category_id),
      featured_image: post.featured_image || '',
      is_published: post.is_published,
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      await apiClient.delete(`/posts/${id}`);
      fetchPosts();
    }
  };

  return (
    <div className="admin-page">
      <header>
        <h1>Posts</h1>
        <button onClick={() => {
          setShowForm(!showForm);
          resetForm();
        }}>
          {showForm ? 'Cancel' : 'Add Post'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Content (Rich Text Editor)</label>
            <HtmlEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
            />
          </div>
          <div className="form-group">
            <label>Featured Image URL</label>
            <input
              type="text"
              value={formData.featured_image}
              onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
            />
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              />
              Published
            </label>
          </div>
          <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Views</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id}>
              <td>
                <Link to={`/blog/${post.id}`}>{post.title}</Link>
              </td>
              <td>{post.category?.name}</td>
              <td>{post.is_published ? 'Published' : 'Draft'}</td>
              <td>{post.views}</td>
              <td>
                <button onClick={() => handleEdit(post)}>Edit</button>
                <button onClick={() => handleDelete(post.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
