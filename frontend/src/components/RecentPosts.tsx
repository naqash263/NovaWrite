import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { generateDateBasedUrl } from '../utils/urlHelpers';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  category: {
    id: number;
    name: string;
  };
}

export default function RecentPosts({ limit = 5 }: { limit?: number }) {
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['recent-posts', limit],
    queryFn: async () => {
      const response = await apiClient.get(`/posts?per_page=${limit}&order_by=published_at&order=desc`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const posts = postsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No recent posts available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Posts</h3>
      {posts.map((post: Post) => (
        <Link
          key={post.id}
          to={generateDateBasedUrl('blog', post.slug, post.published_at)}
          className="block group hover:bg-gray-50 p-2 rounded-lg transition-colors"
        >
          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-1">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {post.category.name}
            </span>
            <span>
              {new Date(post.published_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

