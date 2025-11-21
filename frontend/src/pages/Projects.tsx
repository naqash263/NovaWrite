import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import AdPlacement from '../components/AdPlacement';
import { useSEO } from '../utils/seo';
import LazyImage from '../components/LazyImage';
import { useHomeSettings } from '../hooks/useHomeSettings';

interface Project {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  description: string;
  product_description?: string;
  image_url?: string;
  project_url?: string;
  github_url?: string;
  technologies?: string[];
  features?: string[];
  status: string;
  is_featured: boolean;
  start_date?: string;
  end_date?: string;
}

export default function Projects() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const { getImageUrl } = useHomeSettings();

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useSEO({
    title: 'My Projects - Portfolio Showcase | Naqash Thaheem',
    description: 'Explore my portfolio of AI automation projects, web applications, and business intelligence solutions. Real-world projects showcasing expertise in automation, CRM integration, and data analytics.',
    keywords: ['portfolio projects', 'AI automation projects', 'web development projects', 'business intelligence projects', 'CRM integration projects', 'data analytics projects', 'Naqash Thaheem projects'],
    url: '/projects',
    image: '/images/projects-og.jpg',
    structuredData: 'website',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'My Projects',
      'description': 'Portfolio showcase of AI automation and business intelligence projects',
      'url': 'https://naqashthaheem.com/projects',
      'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': []
      }
    }
  });

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', searchQuery, featuredOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (featuredOnly) params.append('featured', 'true');
      
      const response = await apiClient.get(`/projects?${params.toString()}`);
      if (response.data.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !searchQuery || searchQuery.length >= 3,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const featuredProjects = projects.filter(p => p.is_featured);
  const regularProjects = projects.filter(p => !p.is_featured);

  return (
    <div className="bg-gray-50">
      <div 
        className="relative bg-cover bg-center py-20 mb-16"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.9), rgba(30, 64, 175, 0.9))`
        }}
      >
        <LazyImage
          src={getImageUrl('projects_image', '/images/projects-bg.jpg')}
          alt="Projects Background"
          className="absolute inset-0 w-full h-full object-cover -z-10"
          placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzI1NjNlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TXkgUHJvamVjdHM8L3RleHQ+PC9zdmc+"
        />
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">My Projects</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            A showcase of my work in AI automation, web development, and business intelligence solutions
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <AdPlacement position="content-top" className="mb-8" />
        
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFeaturedOnly(!featuredOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                featuredOnly
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {featuredOnly ? '⭐ Featured Only' : 'Show All'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-600 text-lg">No projects found</p>
            <p className="text-gray-500 mt-2">
              {searchInput || featuredOnly
                ? 'Try adjusting your filters or search query'
                : 'More projects coming soon!'}
            </p>
          </div>
        ) : (
          <>
            {featuredProjects.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">⭐ Featured Projects</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            {regularProjects.length > 0 && (
              <div>
                {featuredProjects.length > 0 && (
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">All Projects</h2>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <AdPlacement position="content-bottom" className="mt-8" />
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
    >
      {project.image_url && (
        <div className="relative h-48 overflow-hidden">
          <LazyImage
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {project.is_featured && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
              ⭐ Featured
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            project.status === 'completed' ? 'bg-green-100 text-green-800' :
            project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>
        
        {project.summary && (
          <p className="text-gray-600 mb-4 line-clamp-2">{project.summary}</p>
        )}

        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies.slice(0, 3).map((tech, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="text-gray-500 text-xs">+{project.technologies.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="text-blue-600 font-medium group-hover:text-blue-700">
            View Details →
          </span>
          {project.start_date && (
            <span>{new Date(project.start_date).getFullYear()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

