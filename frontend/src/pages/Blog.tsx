import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/axios';
import type { Post, Category, PaginatedResponse } from '../types';

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [search, categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryId) params.append('category_id', categoryId);
      
      const response = await apiClient.get<PaginatedResponse<Post>>(`/posts?${params}`);
      setPosts(response.data.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    setSearchParams({ search: searchValue, ...(categoryId && { category_id: categoryId }) });
  };

  return (
    <div className="blog-page">
      <header>
        <h1>Blog</h1>
        <div className="filters">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              name="search"
              placeholder="Search posts..."
              defaultValue={search}
            />
            <button type="submit">Search</button>
          </form>
          
          <select
            value={categoryId}
            onChange={(e) => setSearchParams({ ...(search && { search }), category_id: e.target.value })}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="posts-list">
          {posts.map(post => (
            <article key={post.id} className="post-item">
              <div className="post-meta">
                <span className="category">{post.category?.name}</span>
                <span className="date">{new Date(post.published_at!).toLocaleDateString()}</span>
              </div>
              <h2><Link to={`/blog/${post.id}`}>{post.title}</Link></h2>
              <p>{post.excerpt}</p>
              <div className="post-footer">
                <span>By {post.user?.name}</span>
                <span>{post.views} views</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
