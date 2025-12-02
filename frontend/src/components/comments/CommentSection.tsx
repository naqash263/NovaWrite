import { useState } from 'react';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

interface CommentSectionProps {
  commentableType: 'Post' | 'Workflow' | 'Project' | 'Issue';
  commentableId: number;
  title?: string;
  showTitle?: boolean;
}

export default function CommentSection({
  commentableType,
  commentableId,
  title = 'Comments',
  showTitle = true
}: CommentSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCommentSuccess = () => {
    // Refresh the comment list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="comment-section mt-8">
      {showTitle && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm
          commentableType={commentableType}
          commentableId={commentableId}
          onSuccess={handleCommentSuccess}
        />
      </div>

      {/* Comments List */}
      <div key={refreshKey}>
        <CommentList
          commentableType={commentableType}
          commentableId={commentableId}
          onCommentUpdate={handleCommentSuccess}
        />
      </div>
    </div>
  );
}

