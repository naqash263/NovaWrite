import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import type { Post } from '../types';

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await apiClient.get(`/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!post) return <div className="error">Post not found</div>;

  return (
    <article className="blog-post">
      <header>
        <div className="post-meta">
          <Link to={`/blog?category_id=${post.category_id}`} className="category">
            {post.category?.name}
          </Link>
          <span className="date">{new Date(post.published_at!).toLocaleDateString()}</span>
        </div>
        <h1>{post.title}</h1>
        <div className="author-info">
          <span>By {post.user?.name}</span>
          <span>{post.views} views</span>
        </div>
      </header>

      {post.featured_image && (
        <img src={post.featured_image} alt={post.title} className="featured-image" />
      )}

      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

      <footer>
        <Link to="/blog" className="back-link">← Back to Blog</Link>
      </footer>
    </article>
  );
}
