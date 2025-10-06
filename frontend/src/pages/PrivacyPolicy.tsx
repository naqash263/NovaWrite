import { useSEO } from '../utils/seo';

export default function PrivacyPolicy() {
  useSEO({
    title: 'Privacy Policy | Naqash Thaheem',
    description: 'Privacy Policy for Naqash Thaheem - Systems Analyst & Automation Specialist. Learn how we collect, use, and protect your personal information.',
    url: '/privacy-policy'
  });

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-6">
              Naqash Thaheem ("we," "our," or "us") operates the website naqashthaheem.com (the "Service"). 
              This page informs you of our policies regarding the collection, use, and disclosure of personal 
              data when you use our Service and the choices you have associated with that data.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">
              We may collect personally identifiable information, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Name and contact information (email address)</li>
              <li>Professional information (company, job title)</li>
              <li>Communication preferences</li>
              <li>Any other information you voluntarily provide to us</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Usage Data</h3>
            <p className="text-gray-700 mb-6">
              We may also collect information about how the Service is accessed and used ("Usage Data"). 
              This Usage Data may include information such as your computer's Internet Protocol address 
              (e.g. IP address), browser type, browser version, the pages of our Service that you visit, 
              the time and date of your visit, the time spent on those pages, unique device identifiers 
              and other diagnostic data.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the collected data for various purposes:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
              <li>To provide you with news, special offers and general information about our services</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 mb-6">
              The security of your data is important to us. We implement appropriate technical and 
              organizational measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. However, no method of transmission over the Internet 
              or method of electronic storage is 100% secure.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to track the activity on our Service and 
              hold certain information. Cookies are files with small amount of data which may include an 
              anonymous unique identifier.
            </p>
            <p className="text-gray-700 mb-6">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. 
              However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              We may use third-party services for various purposes, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Google Analytics for website analytics</li>
              <li>Email services for communication</li>
              <li>Cloud storage for data backup</li>
              <li>Payment processors for transactions</li>
            </ul>
            <p className="text-gray-700 mb-6">
              These third parties have access to your Personal Data only to perform these tasks on our behalf 
              and are obligated not to disclose or use it for any other purpose.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-6">
              We will retain your Personal Data only for as long as is necessary for the purposes set out in 
              this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply 
              with our legal obligations, resolve disputes, and enforce our legal agreements and policies.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-6">
              Our Service does not address anyone under the age of 13 ("Children"). We do not knowingly 
              collect personally identifiable information from anyone under the age of 13. If you are a 
              parent or guardian and you are aware that your Children have provided us with Personal Data, 
              please contact us.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update our Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date at the top 
              of this Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
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
