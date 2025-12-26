import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { useSEO } from '../utils/seo';

interface SearchResult {
  type: 'workflow' | 'project' | 'issue' | 'post';
  id: number;
  title: string;
  description?: string;
  slug: string;
  url: string;
  category?: string;
  published_at?: string;
  status?: string;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [results, setResults] = useState<{
    workflows: SearchResult[];
    projects: SearchResult[];
    issues: SearchResult[];
    posts: SearchResult[];
  }>({
    workflows: [],
    projects: [],
    issues: [],
    posts: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'workflows' | 'projects' | 'issues' | 'posts'>('all');

  useSEO({
    title: `Search${search ? `: ${search}` : ''} | Naqash Thaheem`,
    description: `Search across workflows, projects, issues, and blog posts`,
    url: `/search?q=${encodeURIComponent(search)}`
  });

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // Update URL when search changes
  useEffect(() => {
    if (debouncedSearch) {
      searchParams.set('q', debouncedSearch);
      setSearchParams(searchParams);
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams);
    }
  }, [debouncedSearch, searchParams, setSearchParams]);

  // Fetch search results
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setResults({ workflows: [], projects: [], issues: [], posts: [] });
      return;
    }

    setLoading(true);
    const searchQuery = debouncedSearch.trim();

    Promise.all([
      // Search workflows
      apiClient.get(`/workflows?search=${encodeURIComponent(searchQuery)}&per_page=10`)
        .then(res => res.data.data || res.data || [])
        .then(data => data.map((item: any) => ({
          type: 'workflow' as const,
          id: item.id,
          title: item.title,
          description: item.description,
          slug: item.slug,
          url: `/workflows/${item.slug}`,
          category: item.category?.name,
          published_at: item.published_at,
        })))
        .catch(() => []),
      
      // Search projects
      apiClient.get(`/projects?search=${encodeURIComponent(searchQuery)}&per_page=10`)
        .then(res => res.data.data || res.data || [])
        .then(data => data.map((item: any) => ({
          type: 'project' as const,
          id: item.id,
          title: item.title,
          description: item.description || item.summary,
          slug: item.slug,
          url: `/projects/${item.slug}`,
          category: item.category?.name,
          published_at: item.published_at,
          status: item.status,
        })))
        .catch(() => []),
      
      // Search issues
      apiClient.get(`/issues?search=${encodeURIComponent(searchQuery)}&per_page=10`)
        .then(res => res.data.data || res.data || [])
        .then(data => data.map((item: any) => ({
          type: 'issue' as const,
          id: item.id,
          title: item.title,
          description: item.description,
          slug: item.slug || `issue-${item.id}`,
          url: `/community/issues/${item.id}`,
          category: item.category?.name,
          published_at: item.created_at,
          status: item.status,
        })))
        .catch(() => []),
      
      // Search posts
      apiClient.get(`/posts?search=${encodeURIComponent(searchQuery)}&per_page=10`)
        .then(res => res.data.data || res.data || [])
        .then(data => data.map((item: any) => ({
          type: 'post' as const,
          id: item.id,
          title: item.title,
          description: item.excerpt,
          slug: item.slug,
          url: `/blog/${item.slug}`,
          category: item.category?.name,
          published_at: item.published_at,
        })))
        .catch(() => []),
    ]).then(([workflows, projects, issues, posts]) => {
      setResults({ workflows, projects, issues, posts });
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [debouncedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setDebouncedSearch(search.trim());
    }
  };

  const allResults: SearchResult[] = [
    ...results.workflows,
    ...results.projects,
    ...results.issues,
    ...results.posts,
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow':
        return '⚡';
      case 'project':
        return '📁';
      case 'issue':
        return '🐛';
      case 'post':
        return '📝';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'workflow':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'project':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'issue':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'post':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredResults = activeTab === 'all' 
    ? allResults 
    : results[activeTab];

  const tabs = [
    { id: 'all', label: 'All', count: allResults.length },
    { id: 'workflows', label: 'Workflows', count: results.workflows.length },
    { id: 'projects', label: 'Projects', count: results.projects.length },
    { id: 'issues', label: 'Issues', count: results.issues.length },
    { id: 'posts', label: 'Posts', count: results.posts.length },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Search</h1>
          <form onSubmit={handleSearchSubmit} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows, projects, issues, and blog posts..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-32"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Search
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to search
            </div>
          </form>
        </div>

        {/* Results Tabs */}
        {debouncedSearch && (
          <div className="mb-6 border-b border-gray-200">
            <div className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        )}

        {/* Results */}
        {!loading && debouncedSearch && (
          <>
            {filteredResults.length > 0 ? (
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    to={result.url}
                    className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${getTypeColor(result.type)} flex items-center justify-center text-2xl border-2`}>
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {result.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        {result.description && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {result.category && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {result.category}
                            </span>
                          )}
                          {result.published_at && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(result.published_at).toLocaleDateString()}
                            </span>
                          )}
                          {result.status && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              result.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              result.status === 'open' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {result.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !debouncedSearch && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start searching</h3>
            <p className="text-gray-600">
              Search across workflows, projects, issues, and blog posts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

