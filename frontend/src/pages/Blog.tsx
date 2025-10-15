import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { PostCard } from '../components/PostCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { PostCardSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { useSEO } from '../utils/seo';

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

interface Category {
  id: number;
  name: string;
  posts_count?: number;
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('category') ? Number(searchParams.get('category')) : null
  );
  const [currentPage, setCurrentPage] = useState(1);

  useSEO({
    title: 'Blog - AI Automation & Business Intelligence | Naqash Thaheem',
    description: 'Expert insights on AI automation, CRM integration, Power BI dashboards, and business process optimization from Systems Analyst Naqash Thaheem.',
    keywords: ['AI automation', 'CRM integration', 'Power BI', 'business intelligence', 'workflow automation', 'n8n', 'Zoho CRM', 'systems analysis', 'UAE tech'],
    url: '/blog'
  });

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // Fetch categories using TanStack Query
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/categories');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch posts using TanStack Query
  const { data: postsData, isLoading: loading } = useQuery({
    queryKey: ['posts', selectedCategory, debouncedSearch, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory) params.append('category_id', String(selectedCategory));
      params.append('page', String(currentPage));
      params.append('per_page', '9');

      const response = await apiClient.get(`/posts?${params.toString()}`);
      return response.data;
    },
    staleTime: 30 * 1000, // Reduced to 30 seconds
    gcTime: 2 * 60 * 1000, // Reduced to 2 minutes
    enabled: !debouncedSearch || debouncedSearch.length >= 3,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  const posts = postsData?.data || [];
  const pagination = {
    lastPage: postsData?.last_page || 1,
    total: postsData?.total || 0,
    perPage: postsData?.per_page || 9
  };

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    if (categoryId) {
      searchParams.set('category', String(categoryId));
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    if (search) {
      searchParams.set('search', search);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Blog</h1>

        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <PostCardSkeleton key={index} />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {posts.map((post: Post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {pagination.lastPage > 1 && (
              <Pagination
                currentPage={currentPage}
                lastPage={pagination.lastPage}
                total={pagination.total}
                perPage={pagination.perPage}
                onPageChange={setCurrentPage}
                loading={loading}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No posts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
