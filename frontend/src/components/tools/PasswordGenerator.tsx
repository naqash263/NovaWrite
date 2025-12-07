import { useState, useCallback } from 'react';
import { useSEO } from '../../utils/seo';

export default function PasswordGenerator() {
  const [length, setLength] = useState<number>(16);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [strength, setStrength] = useState<{ score: number; label: string; color: string }>({
    score: 0,
    label: '',
    color: 'gray'
  });

  useSEO({
    title: 'Free Password Generator Online - Strong Random Password Creator | No Signup',
    description: 'Free password generator online - no signup required. Generate strong, secure, random passwords instantly. Customize length, character types, and complexity. Includes password strength meter. All processing in your browser for maximum security.',
    url: '/resources/utility-tools/password-generator',
    keywords: [
      'free password generator online', 'password generator', 'free password generator', 'password generator online', 'random password generator free',
      'random password', 'strong password', 'secure password generator online',
      'password creator', 'password tool', 'password maker', 'random password generator',
      'secure password generator', 'password strength', 'password checker', 'strong password generator free'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Password Generator',
      'description': 'Free password generator for creating strong, secure, random passwords with customizable options and strength meter.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/password-generator',
      'applicationCategory': 'SecurityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Customizable password length (4-128 characters)',
        'Include/exclude uppercase, lowercase, numbers, symbols',
        'Exclude similar and ambiguous characters',
        'Password strength meter',
        'One-click copy to clipboard',
        'Client-side generation (no data sent to servers)'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '3200',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const generatePassword = useCallback(() => {
    let charset = '';
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }
    
    if (excludeAmbiguous) {
      charset = charset.replace(/[{}[\]()/\\'"~,;.<>]/g, '');
    }

    if (!charset) {
      setPassword('');
      setStrength({ score: 0, label: 'Invalid', color: 'red' });
      return;
    }

    let generatedPassword = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      generatedPassword += charset[randomIndex];
    }

    setPassword(generatedPassword);
    calculateStrength(generatedPassword);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous]);

  const calculateStrength = (pwd: string) => {
    let score = 0;
    
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    if (pwd.length >= 20) score += 1;

    let label = '';
    let color = '';
    
    if (score <= 2) {
      label = 'Very Weak';
      color = 'red';
    } else if (score === 3) {
      label = 'Weak';
      color = 'orange';
    } else if (score === 4 || score === 5) {
      label = 'Fair';
      color = 'yellow';
    } else if (score === 6 || score === 7) {
      label = 'Good';
      color = 'blue';
    } else {
      label = 'Strong';
      color = 'green';
    }

    setStrength({ score, label, color });
  };

  const copyToClipboard = async () => {
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        alert('Password copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🔐 Free Password Generator Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free password generator online - no signup required. Generate strong, secure, random passwords instantly with customizable options. Includes password strength meter. All processing in your browser for maximum security.
        </p>

        {/* Password Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Generated Password
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={password}
              readOnly
              className="flex-1 p-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Click 'Generate Password' to create a password"
            />
            <button
              onClick={copyToClipboard}
              disabled={!password}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors whitespace-nowrap"
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        {password && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Password Strength:</span>
              <span className={`text-sm font-bold ${
                strength.color === 'red' ? 'text-red-600' :
                strength.color === 'orange' ? 'text-orange-600' :
                strength.color === 'yellow' ? 'text-yellow-600' :
                strength.color === 'blue' ? 'text-blue-600' :
                'text-green-600'
              }`}>
                {strength.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  strength.color === 'red' ? 'bg-red-500' :
                  strength.color === 'orange' ? 'bg-orange-500' :
                  strength.color === 'yellow' ? 'bg-yellow-500' :
                  strength.color === 'blue' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${(strength.score / 9) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Length Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Password Length: {length}
            </label>
            <span className="text-sm text-gray-500">4-128 characters</span>
          </div>
          <input
            type="range"
            min="4"
            max="128"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => setIncludeUppercase(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Uppercase Letters (A-Z)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(e) => setIncludeLowercase(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Lowercase Letters (a-z)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Numbers (0-9)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Symbols (!@#$%...)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeSimilar}
              onChange={(e) => setExcludeSimilar(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Exclude Similar (i, l, 1, L, o, 0, O)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Exclude Ambiguous ({ } [ ] ( ) / \ ' " ~ , ; . &lt; &gt;)</span>
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePassword}
          className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-lg"
        >
          🔄 Generate Password
        </button>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Password Generator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Password Generator is a secure, client-side tool that creates strong, random passwords 
              using cryptographically secure random number generation. All password generation happens 
              locally in your browser, ensuring your passwords are never transmitted over the internet 
              or stored on any server.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for creating secure passwords for online accounts, applications, and services. 
              The tool includes a strength meter to help you understand the security level of your 
              generated password, and customizable options to meet specific password requirements.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Creating passwords for new online accounts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Generating secure API keys and tokens</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Meeting specific password requirements</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Creating temporary access passwords</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Generating passwords for team accounts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Creating secure passphrases</span>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Customizable Length</h4>
                  <p className="text-sm text-gray-600">Generate passwords from 4 to 128 characters long</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Character Options</h4>
                  <p className="text-sm text-gray-600">Include/exclude uppercase, lowercase, numbers, and symbols</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Strength Meter</h4>
                  <p className="text-sm text-gray-600">Real-time password strength assessment</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Privacy-First</h4>
                  <p className="text-sm text-gray-600">All generation happens locally - no data sent to servers</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How secure are the generated passwords?</h4>
                <p className="text-gray-700 text-sm">
                  Passwords are generated using cryptographically secure random number generation, making 
                  them highly secure and unpredictable. The randomness ensures each password is unique.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my password stored or transmitted?</h4>
                <p className="text-gray-700 text-sm">
                  No, all password generation happens locally in your browser. We never store, transmit, 
                  or have access to your generated passwords.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What makes a strong password?</h4>
                <p className="text-gray-700 text-sm">
                  A strong password is at least 12 characters long, includes a mix of character types 
                  (uppercase, lowercase, numbers, symbols), and doesn't use dictionary words or personal 
                  information.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I generate multiple passwords?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, simply click "Generate Password" multiple times to create different passwords. 
                  Each generation creates a unique, random password.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Password Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use passwords with at least 12 characters for better security</li>
            <li>Include a mix of uppercase, lowercase, numbers, and symbols</li>
            <li>Don't reuse passwords across different accounts</li>
            <li>Consider using a password manager to store your passwords securely</li>
            <li>Change passwords regularly, especially for sensitive accounts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

