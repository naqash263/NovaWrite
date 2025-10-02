import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/axios';
import { FileList } from '../components/FileList';
import { useSEO } from '../utils/seo';

interface Post {
  id: number;
  title: string;
  content: string;
  featured_image?: string;
  published_at: string;
  category: {
    id: number;
    name: string;
  };
  user: {
    name: string;
  };
  files?: any[];
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useSEO({
    title: post ? `${post.title} | Naqash Thaheem` : 'Loading...',
    description: post ? post.content.substring(0, 160) : '',
  });

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await apiClient.get(`/posts?search=${slug}`);
      const posts = response.data.data || [];
      const foundPost = posts.find((p: any) => p.slug === slug);
      
      if (foundPost) {
        setPost(foundPost);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
    <article className="bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          )}
          
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-4 py-1 rounded-full font-semibold">
                {post.category.name}
              </span>
              <span className="text-gray-500">
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
            
            <div className="flex items-center gap-2 mb-8 text-gray-600">
              <span>By</span>
              <span className="font-semibold">{post.user.name}</span>
            </div>

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.files && post.files.length > 0 && (
              <FileList
                files={post.files}
                apiBaseUrl={import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
