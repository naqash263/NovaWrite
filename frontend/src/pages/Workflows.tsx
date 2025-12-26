import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import AdPlacement from '../components/AdPlacement';
import { useSEO } from '../utils/seo';
import { WorkflowCardSkeleton } from '../components/Skeleton';
import WorkflowDownloadModal from '../components/WorkflowDownloadModal';
import LazyImage from '../components/LazyImage';
import { useHomeSettings } from '../hooks/useHomeSettings';
import { generateDateBasedUrl } from '../utils/urlHelpers';

interface WorkflowCategory {
  id: number;
  name: string;
  slug: string;
  workflows_count?: number;
}

interface WorkflowFile {
  id: number;
  display_name?: string;
  description?: string;
  file?: {
    name: string;
    size: number;
  };
}

interface Workflow {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  instructions?: string;
  tools: string[];
  benefits: string[];
  estimated_time?: string;
  difficulty?: string;
  tags?: string[];
  is_premium: boolean;
  category?: WorkflowCategory;
  files: WorkflowFile[];
  created_at?: string;
  published_at?: string;
}

export default function Workflows() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { getImageUrl } = useHomeSettings();
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<number>>(new Set());
  const [downloadModal, setDownloadModal] = useState<{
    isOpen: boolean;
    workflowFile: { id: number; name: string } | null;
    workflowName: string;
    isPremium?: boolean;
  }>({
    isOpen: false,
    workflowFile: null,
    workflowName: '',
    isPremium: false,
  });

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useSEO({
    title: 'AI Automation Workflows & Solutions - Download Free Templates | Naqash Thaheem',
    description: 'Download free AI automation workflows, CRM integration templates, data processing pipelines, and business automation solutions. Includes n8n, Make.com, Zapier workflow examples for businesses. Created by Systems Analyst Naqash Thaheem with 8+ years experience.',
    keywords: ['AI automation workflows', 'workflow templates', 'CRM automation', 'business process automation', 'n8n workflows', 'Make.com workflows', 'Zapier automation', 'Zoho CRM integration', 'data pipelines', 'workflow examples', 'automation solutions', 'download workflow templates', 'free automation tools', 'business intelligence workflows', 'data processing automation', 'workflow library'],
    url: '/workflows',
    image: '/images/AI Automation.png',
    structuredData: 'website',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'AI Automation Workflows',
      'description': 'Free AI automation workflow templates and solutions for businesses',
      'url': 'https://naqashthaheem.com/workflows',
      'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': []
      }
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<WorkflowCategory[]>({
    queryKey: ['workflow-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/workflow-categories');
      // Handle both response structures
      if (response.data.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await apiClient.get(`/workflows?${params.toString()}`);
      // Handle both response structures
      if (response.data.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !searchQuery || searchQuery.length >= 3, // Only search when query is at least 3 characters
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleDownload = (workflowFile: any, workflowName: string, isPremium?: boolean) => {
    setDownloadModal({
      isOpen: true,
      workflowFile: { id: workflowFile.id, name: workflowFile.name },
      workflowName,
      isPremium: isPremium || false,
    });
  };

  const toggleExpanded = (workflowId: number) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    setExpandedWorkflows(newExpanded);
  };

  const closeModal = () => {
    setDownloadModal({
      isOpen: false,
      workflowFile: null,
      workflowName: '',
      isPremium: false,
    });
  };

  const isLoading = categoriesLoading || workflowsLoading;

  return (
    <div className="bg-gray-50">
      <div 
        className="relative bg-cover bg-center py-24 md:py-32 mb-16 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(147, 51, 234, 0.8) 50%, rgba(219, 39, 119, 0.85) 100%), url('${getImageUrl('workflows_image', '/images/AI Automation.png')}')`
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <LazyImage
          src={getImageUrl('workflows_image', '/images/AI Automation.png')}
          alt="AI Automation Background"
          className="absolute inset-0 w-full h-full object-cover -z-10 opacity-0"
          placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzI1NjNlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QXV0b21hdGlvbiBXb3JrZmxvd3M8L3RleHQ+PC9zdmc+"
        />
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Automation Workflows</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Real-world examples of intelligent automation solutions that streamline operations, eliminate repetitive tasks, and drive business efficiency
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Ad: Content Top */}
        <AdPlacement position="content-top" className="mb-8" />
        
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
                {category.workflows_count !== undefined && category.workflows_count > 0 && (
                  <span className="ml-2 text-sm opacity-75">({category.workflows_count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <WorkflowCardSkeleton key={index} />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 text-lg">No workflows found</p>
            <p className="text-gray-500 mt-2">
              {searchInput || selectedCategory
                ? 'Try adjusting your filters or search query'
                : 'Check back soon for new automation workflows!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-8">
              {workflows.map((workflow) => {
              const isExpanded = expandedWorkflows.has(workflow.id);
              const shouldShowReadMore = workflow.description && workflow.description.length > 150;
              const displayDescription = isExpanded ? workflow.description : 
                (shouldShowReadMore ? workflow.description.substring(0, 150) + '...' : workflow.description);
              
              return (
              <div key={workflow.id} className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  {workflow.is_premium && (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold">
                      👑 Premium
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{workflow.title}</h3>
                
                {workflow.summary && (
                  <p className="text-gray-600 mb-4 font-medium">{workflow.summary}</p>
                )}
                
                {workflow.description && (
                  <div className="mb-6">
                    <p className="text-gray-600 leading-relaxed">
                      {displayDescription}
                    </p>
                    <div className="mt-2 flex gap-3">
                      {shouldShowReadMore && (
                        <button
                          onClick={() => toggleExpanded(workflow.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          {isExpanded ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const date = workflow.published_at || workflow.created_at || new Date().toISOString();
                          window.location.href = generateDateBasedUrl('workflows', workflow.slug, date);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                )}
                
                {workflow.category && (
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">
                      {workflow.category.name}
                    </span>
                  </div>
                )}

                {/* Estimated Time & Difficulty */}
                {(workflow.estimated_time || workflow.difficulty) && (
                  <div className="mb-4 flex gap-4">
                    {workflow.estimated_time && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{workflow.estimated_time}</span>
                      </div>
                    )}
                    {workflow.difficulty && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="capitalize">{workflow.difficulty}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {workflow.tools && Array.isArray(workflow.tools) && workflow.tools.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tools & Technologies:</h4>
                    <div className="flex flex-wrap gap-2">
                      {workflow.tools.map((tool, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {workflow.benefits && Array.isArray(workflow.benefits) && workflow.benefits.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Benefits:</h4>
                    <ul className="space-y-1">
                      {workflow.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {workflow.tags && Array.isArray(workflow.tags) && workflow.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {workflow.tags.map((tag, idx) => (
                        <span key={idx} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded border border-purple-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {workflow.files && workflow.files.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Downloads:</h4>
                    <div className="space-y-2">
                      {workflow.files.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => handleDownload(file, workflow.title, workflow.is_premium)}
                          className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-900">{file.display_name || file.file?.name || 'Download Workflow'}</p>
                              {file.description && (
                                <p className="text-xs text-gray-500">{file.description}</p>
                              )}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
              })}
            </div>
            
            {/* Ad: Content Middle - After every 4 workflows */}
            {workflows.length > 4 && (
              <AdPlacement position="content-middle" className="my-8" />
            )}
            
            {/* Ad: Content Bottom */}
            <AdPlacement position="content-bottom" className="mt-8 mb-8" />
          </>
        )}
        
        <div className="mt-16 bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Business?</h2>
          <p className="text-xl mb-6 text-blue-100">
            Let's discuss how custom automation workflows can transform your operations
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
          >
            Get Started
          </a>
        </div>
      </div>

      {downloadModal.workflowFile && (
        <WorkflowDownloadModal
          workflowFile={downloadModal.workflowFile}
          workflowName={downloadModal.workflowName}
          isOpen={downloadModal.isOpen}
          onClose={closeModal}
          isPremium={downloadModal.isPremium}
        />
      )}
    </div>
  );
}