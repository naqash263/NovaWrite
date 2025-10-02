import { useEffect, useState } from 'react';
import apiClient from '../../api/axios';
import type { Category } from '../../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const response = await apiClient.get('/categories');
    setCategories(response.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/categories/${editingId}`, formData);
      } else {
        await apiClient.post('/categories', formData);
      }
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description || '' });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      await apiClient.delete(`/categories/${id}`);
      fetchCategories();
    }
  };

  return (
    <div className="admin-page">
      <header>
        <h1>Categories</h1>
        <button onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          setFormData({ name: '', description: '' });
        }}>
          {showForm ? 'Cancel' : 'Add Category'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Posts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td>{cat.description}</td>
              <td>{cat.posts_count || 0}</td>
              <td>
                <button onClick={() => handleEdit(cat)}>Edit</button>
                <button onClick={() => handleDelete(cat.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
