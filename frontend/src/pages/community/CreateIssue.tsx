import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { useSEO } from '../../utils/seo';

interface IssueCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
}

export default function CreateIssue() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<IssueCategory[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
    labels: [] as string[],
    guest_name: '',
    guest_email: '',
  });

  const [labelInput, setLabelInput] = useState('');

  useSEO({
    title: 'Ask a Question - IT Community Forum | Naqash Thaheem',
    description: 'Ask technical questions, get programming help, or discuss IT topics with our community.',
    url: '/community/issues/create'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/issue-categories');
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    // Validation
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      setErrors({ title: 'Title must be at least 5 characters long' });
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setErrors({ description: 'Description must be at least 10 characters long' });
      return;
    }

    if (!isAuthenticated) {
      if (!formData.guest_name.trim()) {
        setErrors({ guest_name: 'Name is required' });
        return;
      }
      if (!formData.guest_email.trim() || !formData.guest_email.includes('@')) {
        setErrors({ guest_email: 'Valid email is required' });
        return;
      }
    }

    setLoading(true);

    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
      };

      if (formData.category_id) {
        payload.category_id = parseInt(formData.category_id);
      }

      if (formData.labels.length > 0) {
        payload.labels = formData.labels;
      }

      if (!isAuthenticated) {
        payload.guest_name = formData.guest_name.trim();
        payload.guest_email = formData.guest_email.trim();
      }

      const response = await apiClient.post('/issues', payload);

      if (response.data.success) {
        // Navigate to the created issue
        const issue = response.data.data;
        navigate(`/community/issues/${issue.slug || issue.id}`);
      }
    } catch (err: any) {
      console.error('Error creating issue:', err);
      
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to create issue. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addLabel = () => {
    if (labelInput.trim() && !formData.labels.includes(labelInput.trim())) {
      setFormData({
        ...formData,
        labels: [...formData.labels, labelInput.trim()]
      });
      setLabelInput('');
    }
  };

  const removeLabel = (label: string) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter(l => l !== label)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Ask a Question</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isAuthenticated && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  error={errors.guest_name}
                  required
                  placeholder="Your name"
                  disabled={loading}
                />
                <Input
                  label="Your Email"
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  error={errors.guest_email}
                  required
                  placeholder="your.email@example.com"
                  disabled={loading}
                />
              </div>
            )}

            <Input
              label="Question Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              required
              placeholder="Brief, descriptive question title"
              disabled={loading}
              helperText="Be specific and concise"
            />

            <Textarea
              label="Question Details"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={errors.description}
              required
              placeholder="Describe your question or problem in detail. Include any relevant code, error messages, or context that might help others understand and answer your question."
              minLength={10}
              maxLength={10000}
              rows={10}
              disabled={loading}
              helperText={`${formData.description.length}/10000 characters`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                    disabled={loading}
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                  disabled={loading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labels (optional)
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLabel();
                    }
                  }}
                  placeholder="Add a label and press Enter"
                  disabled={loading}
                />
                <Button type="button" onClick={addLabel} disabled={loading || !labelInput.trim()}>
                  Add
                </Button>
              </div>
              {formData.labels.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.labels.map((label, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeLabel(label)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/community/issues')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
              >
                Ask a Question
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

