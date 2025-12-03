import { Link } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
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
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group" itemScope itemType="https://schema.org/BlogPosting">
      <Link to={generateDateBasedUrl('blog', post.slug, post.published_at)} aria-label={`Read article: ${post.title}`} className="block overflow-hidden">
        <div className="relative w-full h-48 overflow-hidden bg-gray-100">
          <img
            src={post.featured_image 
              ? (post.featured_image.startsWith('http') 
                ? post.featured_image 
                : API_CONFIG.getStorageUrl(post.featured_image))
              : fallbackImage
            }
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              // If the featured image fails to load, use fallback
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
            itemProp="image"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
        </div>
      </Link>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold" itemProp="articleSection">
            {post.category.name}
          </span>
          <time 
            className="text-gray-500 text-sm" 
            dateTime={post.published_at}
            itemProp="datePublished"
          >
            {new Date(post.published_at).toLocaleDateString()}
          </time>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
          <Link to={generateDateBasedUrl('blog', post.slug, post.published_at)} itemProp="headline">
            {post.title}
          </Link>
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-3" itemProp="description">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500" itemProp="author" itemScope itemType="https://schema.org/Person">
            <span className="sr-only" itemProp="name">{post.user.name}</span>
            <span aria-label={`Article by ${post.user.name}`}>By {post.user.name}</span>
          </div>
          <Link
            to={generateDateBasedUrl('blog', post.slug, post.published_at)}
            className="text-blue-600 font-semibold hover:text-blue-700"
            aria-label={`Read full article: ${post.title}`}
          >
            Read More →
          </Link>
        </div>
      </div>
      
      {/* Hidden metadata for Schema.org */}
      <meta itemProp="url" content={`https://naqashthaheem.com${generateDateBasedUrl('blog', post.slug, post.published_at)}`} />
      <div itemProp="publisher" itemScope itemType="https://schema.org/Organization" className="hidden">
        <meta itemProp="name" content="Naqash Thaheem" />
      </div>
    </article>
  );
}
