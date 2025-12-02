import { useState, type FormEvent } from 'react';
import apiClient from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Input from '../ui/Input';

interface CommentFormProps {
  commentableType: 'Post' | 'Workflow' | 'Project' | 'Issue';
  commentableId: number;
  parentId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  commentableType,
  commentableId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = 'Write your comment...'
}: CommentFormProps) {
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    // Validation
    if (!content.trim() || content.trim().length < 3) {
      setErrors({ content: 'Comment must be at least 3 characters long' });
      return;
    }

    if (!isAuthenticated) {
      if (!guestName.trim()) {
        setErrors({ guestName: 'Name is required' });
        return;
      }
      if (!guestEmail.trim() || !guestEmail.includes('@')) {
        setErrors({ guestEmail: 'Valid email is required' });
        return;
      }
    }

    setLoading(true);

    try {
      const payload: any = {
        commentable_type: commentableType,
        commentable_id: commentableId,
        content: content.trim(),
      };

      if (parentId) {
        payload.parent_id = parentId;
      }

      if (!isAuthenticated) {
        payload.guest_name = guestName.trim();
        payload.guest_email = guestEmail.trim();
      }

      const response = await apiClient.post('/comments', payload);

      if (response.data.success) {
        setContent('');
        setGuestName('');
        setGuestEmail('');
        setError(null);
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Error submitting comment:', err);
      
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to submit comment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            error={errors.guestName}
            required
            placeholder="Your name"
            disabled={loading}
          />
          <Input
            label="Email"
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            error={errors.guestEmail}
            required
            placeholder="your.email@example.com"
            disabled={loading}
          />
        </div>
      )}

      <Textarea
        label={isAuthenticated ? `Commenting as ${user?.name}` : 'Your Comment'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        error={errors.content}
        placeholder={placeholder}
        required
        minLength={3}
        maxLength={5000}
        rows={4}
        disabled={loading}
        helperText={`${content.length}/5000 characters`}
      />

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          loading={loading}
          disabled={loading || !content.trim()}
        >
          {parentId ? 'Reply' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}

