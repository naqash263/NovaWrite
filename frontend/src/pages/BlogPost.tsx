import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/axios';
import { FileList } from '../components/FileList';
import { useSEO } from '../utils/seo';
import { generateBlogPostSchema, generateBreadcrumbSchema, injectStructuredData } from '../utils/structuredData';
import LazyImage from '../components/LazyImage';
import { API_CONFIG } from '../config/api';

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
  updated_at: string;
  meta_description?: string;
  meta_keywords?: string;
  category: {
    id: number;
    name: string;
  };
  user: {
    name: string;
  };
  tags?: {
    id: number;
    name: string;
    color: string;
  }[];
  files?: any[];
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Calculate SEO values safely
  const getDescription = () => {
    if (!post) return '';
    return post.meta_description || post.excerpt || (post.content ? post.content.substring(0, 160).replace(/<[^>]+>/g, '') : '');
  };

  const getKeywords = () => {
    if (!post) return [];
    if (post.meta_keywords) {
      return post.meta_keywords.split(',').map(k => k.trim());
    }
    return post.category?.name ? [post.category.name] : [];
  };

  const getFeaturedImageUrl = () => {
    if (!post?.featured_image) return undefined;
    return post.featured_image.startsWith('http') 
      ? post.featured_image 
      : `${window.location.origin}${post.featured_image}`;
  };

  useSEO({
    title: post ? `${post.title} | Naqash Thaheem` : 'Loading...',
    description: getDescription(),
    type: 'article',
    image: getFeaturedImageUrl(),
    url: `/blog/${slug}`,
    author: post?.user?.name || 'Naqash Thaheem',
    publishedTime: post?.published_at,
    modifiedTime: post?.updated_at,
    keywords: getKeywords(),
    customStructuredData: post ? {
      article: generateBlogPostSchema({
        title: post.title,
        description: getDescription(),
        publishedAt: post.published_at,
        modifiedAt: post.updated_at,
        slug: slug || '',
        featuredImage: getFeaturedImageUrl(),
        author: post.user?.name || 'Naqash Thaheem',
        category: post.category?.name
      }),
      breadcrumb: generateBreadcrumbSchema([
        { name: 'Home', url: 'https://naqashthaheem.com' },
        { name: 'Blog', url: 'https://naqashthaheem.com/blog' },
        { name: post.category.name, url: `https://naqashthaheem.com/blog?category=${post.category.id}` },
        { name: post.title, url: `https://naqashthaheem.com/blog/${slug}` }
      ])
    } : undefined
  });

  useEffect(() => {
    if (post && slug) {
      // Inject structured data for the article
      const description = post.meta_description || post.excerpt || (post.content ? post.content.substring(0, 160).replace(/<[^>]+>/g, '') : '');
      const featuredImageUrl = post.featured_image 
        ? (post.featured_image.startsWith('http') ? post.featured_image : `${window.location.origin}${post.featured_image}`)
        : undefined;

      const articleSchema = generateBlogPostSchema({
        title: post.title,
        description: description,
        publishedAt: post.published_at,
        modifiedAt: post.updated_at,
        slug: slug || '',
        featuredImage: featuredImageUrl,
        author: post.user?.name || 'Naqash Thaheem',
        category: post.category?.name
      });

      const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://naqashthaheem.com' },
        { name: 'Blog', url: 'https://naqashthaheem.com/blog' },
        { name: post.category.name, url: `https://naqashthaheem.com/blog?category=${post.category.id}` },
        { name: post.title, url: `https://naqashthaheem.com/blog/${slug}` }
      ]);

      // Inject multiple schemas
      injectStructuredData(articleSchema);
      injectStructuredData(breadcrumbSchema);

      // Cleanup function to remove scripts when component unmounts
      return () => {
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => script.remove());
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, slug]);

  const fetchPost = async () => {
    try {
      const response = await apiClient.get(`/posts/${slug}`);
      setPost(response.data);
    } catch (err: any) {
      console.error('Error fetching post:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600">Sorry, the post you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 py-16" role="main">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="bg-white rounded-lg shadow-md overflow-hidden" itemScope itemType="https://schema.org/BlogPosting">
          
          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative w-full h-96 overflow-hidden">
              <div itemProp="image">
                <LazyImage
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+"
                />
              </div>
            </div>
          )}
          
          {/* Article Content */}
          <div className="p-8">
            
            {/* Category Badge - Schema.org compatible */}
            <div className="flex items-center gap-4 mb-6">
              <span 
                className="inline-block bg-blue-100 text-blue-800 text-sm px-4 py-1 rounded-full font-semibold"
                itemProp="articleSection"
              >
                {post.category.name}
              </span>
              
              {/* Publication Date - Semantic time element */}
              <time 
                className="text-gray-500" 
                dateTime={post.published_at}
                itemProp="datePublished"
              >
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>

            {/* Tags - if available */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6" aria-label="Post tags">
                {post.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-block text-xs px-3 py-1 rounded-full text-white font-medium"
                    style={{ backgroundColor: tag.color }}
                    role="listitem"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Article Title - H1 with Schema.org */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4" itemProp="headline">
              {post.title}
            </h1>
            
            {/* Author Information */}
            <div className="flex items-center gap-2 mb-8 text-gray-600" itemProp="author" itemScope itemType="https://schema.org/Person">
              <span className="sr-only" itemProp="name">{post.user.name}</span>
              <meta itemProp="url" content="https://naqashthaheem.com/about" />
              <span aria-hidden="true">By</span>
              <span className="font-semibold" aria-label="Article author">{post.user.name}</span>
            </div>

            {/* Publication Date and Modified Date Meta */}
            <meta itemProp="datePublished" content={post.published_at} />
            <meta itemProp="dateModified" content={post.updated_at} />

            {/* Article Description */}
            {post.excerpt && (
              <p className="text-lg text-gray-700 mb-6" itemProp="description">
                {post.excerpt}
              </p>
            )}

            {/* Main Article Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
              itemProp="articleBody"
            />

            {/* Associated Files */}
            {post.files && post.files.length > 0 && (
              <aside className="mt-8" aria-label="Article attachments">
                <FileList
                  files={post.files}
                  apiBaseUrl={API_CONFIG.BASE_URL}
                />
              </aside>
            )}

            {/* Publisher Information - Hidden for Schema.org */}
            <div itemProp="publisher" itemScope itemType="https://schema.org/Organization" className="hidden">
              <meta itemProp="name" content="Naqash Thaheem" />
              <div itemProp="logo" itemScope itemType="https://schema.org/ImageObject">
                <meta itemProp="url" content="https://naqashthaheem.com/images/professional_busines_b4d6588a.jpg" />
              </div>
            </div>

          </div>
        </article>
      </div>
    </main>
  );
}
