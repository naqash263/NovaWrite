import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { useSEO } from '../utils/seo';
import WorkflowDownloadModal from '../components/WorkflowDownloadModal';

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
  tools: string[];
  benefits: string[];
  is_featured: boolean;
  is_premium: boolean;
  category?: WorkflowCategory;
  files: WorkflowFile[];
}

export default function Workflows() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadModal, setDownloadModal] = useState<{
    isOpen: boolean;
    workflowFile: { id: number; name: string } | null;
    workflowName: string;
  }>({
    isOpen: false,
    workflowFile: null,
    workflowName: '',
  });

  useSEO({
    title: 'Automation Workflows | Naqash Thaheem',
    description: 'Explore automation workflow examples including AI agents, CRM integrations, data processing pipelines, and business process automation.',
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<WorkflowCategory[]>({
    queryKey: ['workflow-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/workflow-categories');
      return response.data;
    },
  });

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await apiClient.get(`/workflows?${params.toString()}`);
      return response.data;
    },
  });

  const handleDownload = (workflowFile: any, workflowName: string) => {
    setDownloadModal({
      isOpen: true,
      workflowFile: { id: workflowFile.id, name: workflowFile.name },
      workflowName,
    });
  };

  const closeModal = () => {
    setDownloadModal({
      isOpen: false,
      workflowFile: null,
      workflowName: '',
    });
  };

  const isLoading = categoriesLoading || workflowsLoading;

  return (
    <div className="bg-gray-50">
      <div 
        className="relative bg-cover bg-center py-20 mb-16"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.9), rgba(30, 64, 175, 0.9)), url('/images/ai_artificial_intell_c522e573.jpg')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Automation Workflows</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Real-world examples of intelligent automation solutions that streamline operations, eliminate repetitive tasks, and drive business efficiency
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 text-lg">No workflows found</p>
            <p className="text-gray-500 mt-2">
              {searchQuery || selectedCategory
                ? 'Try adjusting your filters or search query'
                : 'Check back soon for new automation workflows!'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  {workflow.is_featured && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold">
                      ⭐ Featured
                    </span>
                  )}
                  {workflow.is_premium && (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold">
                      👑 Premium
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{workflow.title}</h3>
                <p className="text-gray-600 mb-6">{workflow.summary || workflow.description}</p>
                
                {workflow.category && (
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">
                      {workflow.category.name}
                    </span>
                  </div>
                )}
                
                {workflow.tools && workflow.tools.length > 0 && (
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
                
                {workflow.benefits && workflow.benefits.length > 0 && (
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

                {workflow.files && workflow.files.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Downloads:</h4>
                    <div className="space-y-2">
                      {workflow.files.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => handleDownload(file, workflow.title)}
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
            ))}
          </div>
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
        />
      )}
    </div>
  );
}
