import { useSEO } from '../utils/seo';

export default function CookiePolicy() {
  useSEO({
    title: 'Cookie Policy | Naqash Thaheem',
    description: 'Cookie Policy for Naqash Thaheem - Systems Analyst & Automation Specialist. Learn about how we use cookies and similar technologies.',
    url: '/cookie-policy'
  });

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-700 mb-6">
              Cookies are small text files that are placed on your computer or mobile device when you visit 
              a website. They are widely used to make websites work more efficiently and to provide information 
              to website owners about how users interact with their site.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our website</li>
              <li>Improve our website's performance and functionality</li>
              <li>Provide personalized content and advertisements</li>
              <li>Analyze website traffic and user behavior</li>
              <li>Ensure website security</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Essential Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are necessary for the website to function properly. They enable basic functions 
              like page navigation, access to secure areas, and remembering your login status.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 text-sm">
                <strong>Examples:</strong> Authentication cookies, security cookies, load balancing cookies
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Performance Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies collect information about how visitors use our website, such as which pages 
              are visited most often and if users get error messages from web pages.
            </p>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 text-sm">
                <strong>Examples:</strong> Google Analytics cookies, website performance monitoring cookies
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Functionality Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies allow the website to remember choices you make and provide enhanced, more 
              personal features.
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 text-sm">
                <strong>Examples:</strong> Language preferences, region settings, user interface preferences
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.4 Marketing Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are used to track visitors across websites to display relevant and engaging 
              advertisements.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 text-sm">
                <strong>Examples:</strong> Google AdSense cookies, social media advertising cookies
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              We may also use third-party services that set cookies on our website:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Google Analytics:</strong> To analyze website usage and performance</li>
              <li><strong>Google AdSense:</strong> To display relevant advertisements</li>
              <li><strong>Social Media Platforms:</strong> For social sharing and integration features</li>
              <li><strong>Email Services:</strong> For newsletter and communication features</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookie Duration</h2>
            <p className="text-gray-700 mb-4">
              Cookies may be either "session" cookies or "persistent" cookies:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li><strong>Session Cookies:</strong> These are temporary cookies that expire when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> These remain on your device for a set period or until you delete them</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies in various ways:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              Most web browsers allow you to control cookies through their settings preferences. You can:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Block all cookies</li>
              <li>Allow only first-party cookies</li>
              <li>Delete all cookies when you close your browser</li>
              <li>Set up notifications when cookies are set</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Cookie Consent</h3>
            <p className="text-gray-700 mb-6">
              When you first visit our website, you may see a cookie consent banner. You can choose to 
              accept or decline non-essential cookies. You can change your preferences at any time.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Impact of Disabling Cookies</h2>
            <p className="text-gray-700 mb-6">
              If you choose to disable cookies, some features of our website may not function properly. 
              This may include:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Inability to stay logged in</li>
              <li>Loss of personalized settings</li>
              <li>Reduced website functionality</li>
              <li>Inability to access certain features</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Updates to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this Cookie Policy from time to time to reflect changes in our practices or 
              for other operational, legal, or regulatory reasons. We will notify you of any material 
              changes by posting the updated policy on our website.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> contact@naqashthaheem.com</p>
              <p className="text-gray-700"><strong>Address:</strong> Ajman, United Arab Emirates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
