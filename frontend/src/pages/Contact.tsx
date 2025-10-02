import { useSEO } from '../utils/seo';

export default function Contact() {
  useSEO({
    title: 'Contact | Naqash Thaheem',
    description: 'Get in touch with Naqash Thaheem for automation, AI, and CRM integration projects.',
  });

  return (
    <div className="bg-gray-50">
      {/* Hero Section with Background Image */}
      <div 
        className="relative bg-cover bg-center py-20 mb-16"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.9), rgba(30, 64, 175, 0.9)), url('/images/business_analytics_d_948bb4c2.jpg')`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Get In Touch</h1>
          <p className="text-xl text-blue-100">Let's discuss your next automation project</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-700 text-lg mb-8 text-center">
            I'm always interested in discussing new projects, automation opportunities, and innovative ideas.
            Feel free to reach out!
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <a href="mailto:naqash263@gmail.com" className="text-blue-600 hover:underline">
                  naqash263@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <a href="tel:+971544747121" className="text-blue-600 hover:underline">
                  +971 54 474 7121
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                <p className="text-gray-600">Ajman, United Arab Emirates</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Professional Networks</h3>
                <div className="space-y-1">
                  <p className="text-gray-600">LinkedIn / GitHub</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Areas of Expertise</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">AI Automation</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">CRM Integration</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Data Processing</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Web Development</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Business Intelligence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
