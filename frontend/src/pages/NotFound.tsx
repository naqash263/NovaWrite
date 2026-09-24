import { Link } from 'react-router-dom';
import { useSEO } from '../utils/seo';

export default function NotFound() {
  useSEO({
    title: '404 - Page Not Found | Naqash Thaheem',
    description: 'The page you are looking for does not exist or has been moved. Explore services, case studies, or get in touch with Naqash Thaheem.',
    robots: 'noindex, follow',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-16">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            to="/services"
            className="inline-block border border-slate-300 text-slate-700 px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            View services
          </Link>
          <Link
            to="/case-studies"
            className="inline-block border border-slate-300 text-slate-700 px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Case studies
          </Link>
        </div>
      </div>
    </div>
  );
}
