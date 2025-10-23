import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { PostCard } from '../components/PostCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { PostCardSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import AdvancedFilters from '../components/AdvancedFilters';
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

interface Tag {
  id: number;
  name: string;
  color: string;
  posts_count?: number;
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('category') ? Number(searchParams.get('category')) : null
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    searchParams.get('tags') ? searchParams.get('tags')!.split(',').map(Number) : []
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [showFilters, setShowFilters] = useState(false);
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
      // Handle both old format (array) and new format (object with data property)
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch tags using TanStack Query
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await apiClient.get('/tags');
      // Handle both old format (array) and new format (object with data property)
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch posts using TanStack Query
  const { data: postsData, isLoading: loading } = useQuery({
    queryKey: ['posts', selectedCategory, selectedTags, dateFrom, dateTo, debouncedSearch, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory) params.append('category_id', String(selectedCategory));
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', String(currentPage));
      params.append('per_page', '9');

      const response = await apiClient.get(`/posts?${params.toString()}`);
      return response.data;
    },
    staleTime: 30 * 1000, // Reduced to 30 seconds
    gcTime: 2 * 60 * 1000, // Reduced to 2 minutes
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

  // Filter configuration
  const filterConfigs = [
    {
      name: 'category',
      label: 'Category',
      type: 'select' as const,
      options: (categories || []).map(cat => ({ value: cat.id.toString(), label: cat.name }))
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'multiselect' as const,
      options: (tags || []).map(tag => ({ value: tag.id.toString(), label: tag.name }))
    },
    {
      name: 'dateFrom',
      label: 'From Date',
      type: 'date' as const,
      placeholder: 'Start date'
    },
    {
      name: 'dateTo',
      label: 'To Date',
      type: 'date' as const,
      placeholder: 'End date'
    }
  ];

  const filters = {
    search: debouncedSearch,
    category: selectedCategory ? selectedCategory.toString() : '',
    tags: selectedTags.map(String),
    dateFrom,
    dateTo
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

  const handleFiltersChange = (newFilters: any) => {
    setCurrentPage(1);
    
    // Update category
    if (newFilters.category !== undefined) {
      const categoryId = newFilters.category ? Number(newFilters.category) : null;
      setSelectedCategory(categoryId);
      if (categoryId) {
        searchParams.set('category', String(categoryId));
      } else {
        searchParams.delete('category');
      }
    }

    // Update tags
    if (newFilters.tags !== undefined) {
      const tagIds = Array.isArray(newFilters.tags) ? newFilters.tags.map(Number) : [];
      setSelectedTags(tagIds);
      if (tagIds.length > 0) {
        searchParams.set('tags', tagIds.join(','));
      } else {
        searchParams.delete('tags');
      }
    }

    // Update date filters
    if (newFilters.dateFrom !== undefined) {
      setDateFrom(newFilters.dateFrom);
      if (newFilters.dateFrom) {
        searchParams.set('dateFrom', newFilters.dateFrom);
      } else {
        searchParams.delete('dateFrom');
      }
    }

    if (newFilters.dateTo !== undefined) {
      setDateTo(newFilters.dateTo);
      if (newFilters.dateTo) {
        searchParams.set('dateTo', newFilters.dateTo);
      } else {
        searchParams.delete('dateTo');
      }
    }

    setSearchParams(searchParams);
  };

  const handleClearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Blog</h1>

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <form onSubmit={handleSearchSubmit} className="flex-1">
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
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              Filters
            </button>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />

          {showFilters && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <AdvancedFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                filterConfigs={filterConfigs}
                onClearAll={handleClearAllFilters}
                onApply={() => setShowFilters(false)}
                isOpen={showFilters}
                resultsCount={pagination.total}
              />
            </div>
          )}
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
