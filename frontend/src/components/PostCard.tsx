import { Link } from 'react-router-dom';
import { API_CONFIG } from '../config/api';

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
  user: {
    name: string;
  };
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // Array of fallback images
  const fallbackImages = [
    '/images/technology_coding_pr_27f67dc5.jpg',
    '/images/business_analytics_d_948bb4c2.jpg',
    '/images/ai_artificial_intell_c522e573.jpg',
    '/images/modern_technology_ab_8cef6e70.jpg',
  ];
  
  // Select a fallback image based on post ID for consistency
  const fallbackImage = fallbackImages[post.id % fallbackImages.length];
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <img
        src={post.featured_image 
          ? (post.featured_image.startsWith('http') 
            ? post.featured_image 
            : API_CONFIG.getStorageUrl(post.featured_image))
          : fallbackImage
        }
        alt={post.title}
        className="w-full h-48 object-cover"
        onError={(e) => {
          // If the featured image fails to load, use fallback
          (e.target as HTMLImageElement).src = fallbackImage;
        }}
      />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">
            {post.category.name}
          </span>
          <span className="text-gray-500 text-sm">
            {new Date(post.published_at).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">By {post.user.name}</span>
          <Link
            to={`/blog/${post.slug}`}
            className="text-blue-600 font-semibold hover:text-blue-700"
          >
            Read More →
          </Link>
        </div>
      </div>
    </div>
  );
}
