import { useSEO } from '../utils/seo';

export default function TermsOfService() {
  useSEO({
    title: 'Terms of Service | Naqash Thaheem',
    description: 'Terms of Service for Naqash Thaheem - Systems Analyst & Automation Specialist. Read our terms and conditions for using our services.',
    url: '/terms-of-service'
  });

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-6">
              By accessing and using this website, you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to abide by the above, please do not 
              use this service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
            <p className="text-gray-700 mb-4">
              Permission is granted to temporarily download one copy of the materials on Naqash Thaheem's 
              website for personal, non-commercial transitory viewing only. This is the grant of a license, 
              not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
              <li>attempt to decompile or reverse engineer any software contained on the website</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Services Description</h2>
            <p className="text-gray-700 mb-4">
              Naqash Thaheem provides the following services:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>AI-powered automation workflow development</li>
              <li>CRM integration and customization</li>
              <li>Business intelligence dashboard creation</li>
              <li>Data analysis and processing services</li>
              <li>Web application development</li>
              <li>Consulting and advisory services</li>
              <li>Educational content and courses</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Accounts</h2>
            <p className="text-gray-700 mb-4">
              When you create an account with us, you must provide information that is accurate, complete, 
              and current at all times. You are responsible for safeguarding the password and for all 
              activities that occur under your account.
            </p>
            <p className="text-gray-700 mb-6">
              You agree not to disclose your password to any third party. You must notify us immediately 
              upon becoming aware of any breach of security or unauthorized use of your account.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
            <p className="text-gray-700 mb-4">
              The Service and its original content, features, and functionality are and will remain the 
              exclusive property of Naqash Thaheem and its licensors. The Service is protected by copyright, 
              trademark, and other laws.
            </p>
            <p className="text-gray-700 mb-6">
              Our trademarks and trade dress may not be used in connection with any product or service 
              without our prior written consent.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Uses</h2>
            <p className="text-gray-700 mb-4">You may not use our Service:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
              <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              <li>For any obscene or immoral purpose</li>
              <li>To interfere with or circumvent the security features of the Service</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Payment Terms</h2>
            <p className="text-gray-700 mb-4">
              For paid services, payment is due as specified in the service agreement. All fees are 
              non-refundable unless otherwise specified in writing.
            </p>
            <p className="text-gray-700 mb-6">
              We reserve the right to change our prices at any time. Price changes will be communicated 
              to existing clients with reasonable notice.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
            <p className="text-gray-700 mb-6">
              We strive to provide continuous service availability but cannot guarantee uninterrupted access. 
              We reserve the right to modify, suspend, or discontinue the Service at any time without notice.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              In no event shall Naqash Thaheem, nor its directors, employees, partners, agents, suppliers, 
              or affiliates, be liable for any indirect, incidental, special, consequential, or punitive 
              damages, including without limitation, loss of profits, data, use, goodwill, or other 
              intangible losses, resulting from your use of the Service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimer</h2>
            <p className="text-gray-700 mb-6">
              The information on this website is provided on an "as is" basis. To the fullest extent 
              permitted by law, this Company excludes all representations, warranties, conditions and 
              terms relating to our website and the use of this website.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 mb-6">
              These Terms shall be interpreted and governed by the laws of the United Arab Emirates, 
              without regard to its conflict of law provisions. Our failure to enforce any right or 
              provision of these Terms will not be considered a waiver of those rights.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
              If a revision is material, we will try to provide at least 30 days notice prior to any new 
              terms taking effect.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us:
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
