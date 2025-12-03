import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { PostCard } from '../components/PostCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { PostCardSkeleton } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import AdvancedFilters from '../components/AdvancedFilters';
import AdPlacement from '../components/AdPlacement';
import { useSEO } from '../utils/seo';
import DateGroupedPosts from '../components/DateGroupedPosts';
import RecentPosts from '../components/RecentPosts';
import EnhancedTagFilter from '../components/EnhancedTagFilter';
import EnhancedCategoryFilter from '../components/EnhancedCategoryFilter';

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
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grid');
  const [showSidebar, setShowSidebar] = useState(false);

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

  // Handle tag changes from EnhancedTagFilter
  const handleTagsChange = (tagIds: number[]) => {
    setSelectedTags(tagIds);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (tagIds.length > 0) {
      newParams.set('tags', tagIds.join(','));
    } else {
      newParams.delete('tags');
    }
    setSearchParams(newParams);
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

        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-700">Filters & Recent Posts</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showSidebar ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters & Recent Posts */}
          <aside className={`lg:w-80 flex-shrink-0 space-y-6 ${showSidebar ? 'block' : 'hidden lg:block'}`}>
            {/* Enhanced Category Filter */}
            <EnhancedCategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
              maxVisible={6}
            />

            {/* Enhanced Tag Filter */}
            <EnhancedTagFilter
              tags={tags}
              selectedTags={selectedTags}
              onTagsChange={handleTagsChange}
              maxVisible={10}
            />

            {/* Recent Posts */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <RecentPosts limit={5} />
            </div>

            {/* Ad: Sidebar */}
            <div className="hidden lg:block">
              <AdPlacement position="sidebar" />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Search and View Mode Toggle */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    Filters
                  </button>
                  
                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('grouped')}
                      className={`px-4 py-2 transition-colors ${
                        viewMode === 'grouped'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      title="Date Grouped View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showFilters && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <AdvancedFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    filterConfigs={filterConfigs}
                    onClearAll={handleClearAllFilters}
                    onApply={() => setShowFilters(false)}
                    onToggle={() => setShowFilters(!showFilters)}
                    isOpen={showFilters}
                    resultsCount={pagination.total}
                  />
                </div>
              )}

              {/* Active Filters Summary */}
              {(selectedCategory || selectedTags.length > 0 || dateFrom || dateTo) && (
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                  {selectedCategory && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Category: {categories.find(c => c.id === selectedCategory)?.name}
                    </span>
                  )}
                  {selectedTags.length > 0 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {(dateFrom || dateTo) && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Date range
                    </span>
                  )}
                  <button
                    onClick={handleClearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Posts Display */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <PostCardSkeleton key={index} />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <>
                {/* Ad: Content Top */}
                <AdPlacement position="content-top" className="mb-8" />
                
                {/* Grid View */}
                {viewMode === 'grid' ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {posts.map((post: Post, index: number) => (
                      <div key={post.id}>
                        <PostCard post={post} />
                        {/* Ad: Between Posts - Show after every 6 posts */}
                        {(index + 1) % 6 === 0 && (index + 1) < posts.length && (
                          <div className="col-span-full mt-8">
                            <AdPlacement position="between-posts" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Date Grouped View */
                  <DateGroupedPosts posts={posts} />
                )}

                {/* Ad: Content Bottom */}
                <AdPlacement position="content-bottom" className="mb-8" />

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
                {(selectedCategory || selectedTags.length > 0 || dateFrom || dateTo || debouncedSearch) && (
                  <button
                    onClick={handleClearAllFilters}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Mobile Ad: Sidebar (shown at bottom on mobile) */}
        <div className="lg:hidden mt-8">
          <AdPlacement position="sidebar" />
        </div>
      </div>
    </div>
  );
}
