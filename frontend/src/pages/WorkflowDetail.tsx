import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useSEO } from '../utils/seo';
import { PageLoader } from '../components/LoadingComponents';
import WorkflowDownloadModal from '../components/WorkflowDownloadModal';
import { useHomeSettings } from '../hooks/useHomeSettings';

interface WorkflowCategory {
  id: number;
  name: string;
  slug: string;
}

interface WorkflowFile {
  id: number;
  display_name?: string;
  description?: string;
  file?: {
    id: number;
    name: string;
    path: string;
    mime_type: string;
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
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export default function WorkflowDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getImageUrl } = useHomeSettings();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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

  useSEO({
    title: workflow ? `${workflow.title} | Naqash Thaheem` : 'Loading...',
    description: workflow?.summary || '',
    keywords: (workflow?.tags && Array.isArray(workflow.tags) ? workflow.tags : []) || [],
    url: `/workflows/${slug || ''}`,
  });

  useEffect(() => {
    if (slug) {
      fetchWorkflow();
    }
  }, [slug]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageModalOpen) {
        setIsImageModalOpen(false);
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isImageModalOpen]);

  const fetchWorkflow = async () => {
    if (!slug) {
      setError('No workflow slug provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/workflows/${slug}`);
      setWorkflow(response.data);
    } catch (err: any) {
      console.error('Failed to fetch workflow:', err);
      setError(err.response?.data?.message || 'Workflow not found');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (workflowFile: WorkflowFile, workflowName: string, isPremium?: boolean) => {
    setDownloadModal({
      isOpen: true,
      workflowFile: { id: workflowFile.id, name: workflowFile.file?.name || workflowFile.display_name || 'Download' },
      workflowName,
      isPremium,
    });
  };

  const closeModal = () => {
    setDownloadModal({
      isOpen: false,
      workflowFile: null,
      workflowName: '',
      isPremium: false,
    });
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Workflow Not Found</h1>
          <p className="text-gray-600 mb-8">{error || "The workflow you're looking for does not exist."}</p>
          <button
            onClick={() => navigate('/workflows')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <button onClick={() => navigate('/workflows')} className="hover:text-gray-900">
                Workflows
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900">{workflow.title}</li>
          </ol>
        </nav>

        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200">
            {/* Premium Badge */}
            {workflow.is_premium && (
              <div className="mb-4">
                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold">
                  👑 Premium Workflow
                </span>
              </div>
            )}

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{workflow.title}</h1>
            
            {/* Meta Information */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
              {workflow.category && (
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                  {workflow.category.name}
                </span>
              )}
              {workflow.estimated_time && (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {workflow.estimated_time}
                </span>
              )}
              {workflow.difficulty && (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="capitalize">{workflow.difficulty}</span>
                </span>
              )}
            </div>

            {/* Summary */}
            {workflow.summary && (
              <p className="text-xl text-gray-600 font-medium">{workflow.summary}</p>
            )}

            {/* Tags */}
            {workflow.tags && Array.isArray(workflow.tags) && workflow.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {workflow.tags.map((tag, idx) => (
                  <span key={idx} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded border border-purple-200">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image */}
          {workflow.image_url && (
            <>
              <div 
                className="article-featured-image cursor-pointer hover:opacity-90 transition-opacity duration-300 group" 
                onClick={() => setIsImageModalOpen(true)}
              >
                <img
                  src={getImageUrl(workflow.image_url)}
                  alt={workflow.title}
                  loading="lazy"
                  className="group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"%3E%3Crect width="1200" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="18" fill="%239CA3AF" text-anchor="middle" dy=".3em"%3ELoading...%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>

              {/* Image Lightbox Modal */}
              {isImageModalOpen && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                  onClick={() => setIsImageModalOpen(false)}
                >
                  <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                    <img
                      src={getImageUrl(workflow.image_url)}
                      alt={workflow.title}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={() => setIsImageModalOpen(false)}
                      className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                      aria-label="Close image viewer"
                    >
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-4 left-4 right-4 text-center text-white bg-black bg-opacity-50 rounded-lg px-4 py-2">
                      <p className="text-sm">{workflow.title}</p>
                      <p className="text-xs text-gray-300 mt-1">Click outside to close</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Description */}
            {workflow.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: workflow.description }}
                />
              </div>
            )}

            {/* Tools */}
            {workflow.tools && Array.isArray(workflow.tools) && workflow.tools.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tools & Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {workflow.tools.map((tool, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {workflow.benefits && Array.isArray(workflow.benefits) && workflow.benefits.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Benefits</h2>
                <ul className="space-y-2">
                  {workflow.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {workflow.instructions && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use This Workflow</h2>
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: workflow.instructions }}
                />
              </div>
            )}

            {/* Download Section */}
            {workflow.files && workflow.files.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Downloads</h2>
                <div className="space-y-4">
                  {workflow.files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleDownload(file, workflow.title, workflow.is_premium)}
                      className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="text-left">
                          <p className="text-lg font-semibold text-gray-900">
                            {file.display_name || file.file?.name || 'Download Workflow'}
                          </p>
                          {file.description && (
                            <p className="text-sm text-gray-600">{file.description}</p>
                          )}
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-700 group-hover:translate-y-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => navigate('/workflows')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to All Workflows
              </button>
            </div>
          </div>
        </article>
      </div>

      {/* Download Modal */}
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

