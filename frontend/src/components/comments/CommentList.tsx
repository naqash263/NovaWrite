import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import CommentItem from './CommentItem';

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

interface CommentListProps {
  commentableType: 'Post' | 'Workflow' | 'Project' | 'Issue';
  commentableId: number;
  parentId?: number;
  onCommentUpdate?: () => void;
}

export default function CommentList({
  commentableType,
  commentableId,
  parentId,
  onCommentUpdate
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        commentable_type: commentableType,
        commentable_id: commentableId,
        approved_only: true
      };

      if (parentId) {
        params.parent_id = parentId;
      }

      const response = await apiClient.get('/comments', { params });

      if (response.data.success) {
        // Load replies for each comment
        const commentsWithReplies = await Promise.all(
          response.data.data.map(async (comment: Comment) => {
            if (comment.replies_count > 0) {
              try {
                const repliesResponse = await apiClient.get(`/comments/${comment.id}/replies`);
                if (repliesResponse.data.success) {
                  return {
                    ...comment,
                    replies: repliesResponse.data.data
                  };
                }
              } catch (err) {
                console.error('Error loading replies:', err);
              }
            }
            return comment;
          })
        );

        setComments(commentsWithReplies);
      }
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [commentableType, commentableId, parentId]);

  const handleCommentUpdate = () => {
    fetchComments();
    onCommentUpdate?.();
  };

  const handleCommentDelete = () => {
    fetchComments();
    onCommentUpdate?.();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={{
            ...comment,
            commentable_type: commentableType,
            commentable_id: commentableId
          }}
          onUpdate={handleCommentUpdate}
          onDelete={handleCommentDelete}
        />
      ))}
    </div>
  );
}

