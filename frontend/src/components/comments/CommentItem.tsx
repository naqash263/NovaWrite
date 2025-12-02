import { useState } from 'react';
import apiClient from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import CommentForm from './CommentForm';

interface Comment {
  id: number;
  content: string;
  is_edited: boolean;
  edited_at?: string;
  is_pinned: boolean;
  likes_count: number;
  replies_count: number;
  is_liked?: boolean;
  created_at: string;
  commentable_type?: string;
  commentable_id?: number;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
  guest_name?: string;
  guest_email?: string;
  parent_id?: number;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  onUpdate?: () => void;
  onDelete?: () => void;
  depth?: number;
  maxDepth?: number;
}

export default function CommentItem({
  comment,
  onUpdate,
  onDelete,
  depth = 0,
  maxDepth = 3
}: CommentItemProps) {
  const { isAuthenticated, user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.is_liked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);

  const authorName = comment.user?.name || comment.guest_name || 'Anonymous';
  const canDelete = isAuthenticated && (user?.role === 'admin' || user?.id === comment.user?.id);
  const canReply = depth < maxDepth;

  const handleLike = async () => {
    if (liking) return;

    setLiking(true);
    try {
      const response = await apiClient.post(`/comments/${comment.id}/like`);
      if (response.data.success) {
        setIsLiked(response.data.liked);
        setLikesCount(response.data.likes_count);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await apiClient.delete(`/comments/${comment.id}`);
      if (response.data.success) {
        onDelete?.();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete comment');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`comment-item ${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{authorName}</span>
                {comment.is_pinned && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    Pinned
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
                {comment.is_edited && (
                  <span className="ml-2 italic">(edited)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Content */}
        <div className="text-gray-800 mb-3 whitespace-pre-wrap break-words">
          {comment.content}
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              isLiked
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <svg
              className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span>{likesCount}</span>
          </button>

          {canReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-gray-600 hover:text-blue-600 px-2 py-1 rounded transition-colors"
            >
              Reply
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && canReply && comment.commentable_type && comment.commentable_id && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <CommentForm
              commentableType={comment.commentable_type as any}
              commentableId={comment.commentable_id}
              parentId={comment.id}
              onSuccess={() => {
                setShowReplyForm(false);
                onUpdate?.();
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Write your reply..."
            />
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onUpdate={onUpdate}
                onDelete={onDelete}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

