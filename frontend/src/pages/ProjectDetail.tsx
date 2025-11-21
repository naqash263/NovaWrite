import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import AdPlacement from '../components/AdPlacement';
import { useSEO } from '../utils/seo';
import { PageLoader } from '../components/LoadingComponents';
import LazyImage from '../components/LazyImage';

interface Project {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  description: string;
  product_description?: string;
  meta_description?: string;
  meta_keywords?: string | string[];
  seo_title?: string;
  image_url?: string;
  project_url?: string;
  github_url?: string;
  technologies?: string[];
  features?: string[];
  status: string;
  is_featured: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getDescription = () => {
    if (!project) return 'Loading project details...';
    
    let description = project.meta_description || 
                     project.product_description || 
                     project.description || 
                     project.summary || 
                     '';
    
    if (description.length < 120) {
      description = `${project.title} - ${project.summary || 'A project by Naqash Thaheem showcasing expertise in AI automation and business intelligence.'}`;
    }
    
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }
    
    return description;
  };

  const getKeywords = () => {
    if (!project) return [];
    
    let keywords: string[] = [];
    
    if (project.meta_keywords) {
      if (typeof project.meta_keywords === 'string') {
        keywords = project.meta_keywords.split(',').map(k => k.trim()).filter(k => k);
      } else if (Array.isArray(project.meta_keywords)) {
        keywords = project.meta_keywords;
      }
    }
    
    if (project.technologies && Array.isArray(project.technologies)) {
      keywords = [...keywords, ...project.technologies];
    }
    
    return [...new Set(keywords)];
  };

  const getTitle = () => {
    if (!project) return 'Loading...';
    return project.seo_title || `${project.title} | Project by Naqash Thaheem`;
  };

  useSEO({
    title: getTitle(),
    description: getDescription(),
    keywords: getKeywords(),
    url: `/projects/${slug || ''}`,
    image: project?.image_url || '/images/projects-og.jpg',
    type: 'article',
    publishedTime: project?.created_at,
    modifiedTime: project?.updated_at,
    author: 'Naqash Thaheem',
    structuredData: project ? 'custom' as const : undefined,
    customStructuredData: project ? {
      '@context': 'https://schema.org',
      '@type': ['CreativeWork', 'SoftwareApplication'],
      'name': project.title,
      'description': project.product_description || project.meta_description || project.description || project.summary || '',
      'url': `https://naqashthaheem.com/projects/${slug}`,
      'image': project.image_url ? `https://naqashthaheem.com${project.image_url}` : 'https://naqashthaheem.com/images/projects-og.jpg',
      'applicationCategory': 'WebApplication',
      'author': {
        '@type': 'Person',
        'name': 'Naqash Thaheem',
        'url': 'https://naqashthaheem.com/about',
        'jobTitle': 'Systems Analyst & AI Automation Specialist'
      },
      'datePublished': project.created_at,
      'dateModified': project.updated_at,
      'keywords': getKeywords().join(', '),
      'inLanguage': 'en-US',
      'programmingLanguage': project.technologies?.join(', ') || '',
      'featureList': project.features || []
    } : undefined
  });

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    if (!slug) {
      setError('No project slug provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/projects/${slug}`);
      setProject(response.data);
    } catch (err: any) {
      console.error('Failed to fetch project:', err);
      setError(err.response?.data?.message || 'Project not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-gray-600 mb-8">{error || "The project you're looking for does not exist."}</p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-4">
              <AdPlacement position="sidebar" />
            </div>
          </aside>

          <div className="lg:col-span-3">
            <nav className="mb-8">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <button onClick={() => navigate('/projects')} className="hover:text-gray-900">
                    Projects
                  </button>
                </li>
                <li>/</li>
                <li className="text-gray-900">{project.title}</li>
              </ol>
            </nav>

            <article className="bg-white rounded-lg shadow-lg overflow-hidden">
              {project.image_url && (
                <div className="relative h-96 overflow-hidden">
                  <LazyImage
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  {project.is_featured && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
                      ⭐ Featured Project
                    </div>
                  )}
                </div>
              )}

              <div className="p-8">
                <AdPlacement position="content-top" className="mb-8" />

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      project.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    {project.start_date && project.end_date && (
                      <span className="text-sm text-gray-500">
                        {new Date(project.start_date).getFullYear()} - {new Date(project.end_date).getFullYear()}
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{project.title}</h1>
                  
                  {project.summary && (
                    <p className="text-xl text-gray-600 font-medium mb-6">{project.summary}</p>
                  )}
                </div>

                {project.product_description && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
                    <div 
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: project.product_description }}
                    />
                  </div>
                )}

                {project.description && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                    <div 
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  </div>
                )}

                <AdPlacement position="content-middle" className="my-8" />

                {project.technologies && project.technologies.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Technologies Used</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.features && project.features.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
                    <ul className="space-y-2">
                      {project.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                          <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(project.project_url || project.github_url) && (
                  <div className="mb-8 pt-8 border-t border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Links</h2>
                    <div className="flex flex-wrap gap-4">
                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Live Project
                        </a>
                      )}
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          View on GitHub
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <AdPlacement position="content-bottom" className="mt-8" />

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to All Projects
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

