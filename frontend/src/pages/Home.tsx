import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import type { Post } from '../types';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get('/posts');
      setPosts(response.data.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home">
      <header className="hero">
        <h1>Welcome to Our Blog</h1>
        <p>Discover amazing stories and insights</p>
        <Link to="/blog" className="cta-button">Explore Blog</Link>
      </header>

      <section className="featured-posts">
        <h2>Latest Posts</h2>
        <div className="posts-grid">
          {posts.map(post => (
            <article key={post.id} className="post-card">
              {post.featured_image && (
                <img src={post.featured_image} alt={post.title} />
              )}
              <div className="post-content">
                <span className="category">{post.category?.name}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <Link to={`/blog/${post.id}`}>Read More</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
