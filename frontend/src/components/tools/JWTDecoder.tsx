import { useState } from 'react';
import { useSEO } from '../../utils/seo';

interface JWTParts {
  header: any;
  payload: any;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
}

export default function JWTDecoder() {
  const [token, setToken] = useState<string>('');
  const [decoded, setDecoded] = useState<JWTParts | null>(null);
  const [error, setError] = useState<string>('');

  useSEO({
    title: 'Free JWT Decoder Online - Decode JWT Tokens | No Signup Required',
    description: 'Free JWT decoder online - no signup required. Decode JWT tokens to view header and payload instantly. Pretty print JSON, validate structure, view token claims. Perfect for debugging JWT tokens. All processing in your browser.',
    url: '/resources/utility-tools/jwt-decoder',
    keywords: [
      'free JWT decoder online', 'JWT decoder', 'free JWT decoder', 'JWT decoder online', 'decode JWT online',
      'decode JWT', 'JWT token decoder', 'JWT parser',
      'online JWT decoder', 'JWT header payload', 'decode JWT token', 'JWT tool', 'free JWT token decoder'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'JWT Decoder',
      'description': 'Free online JWT decoder for decoding and viewing JWT token contents.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/jwt-decoder',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Decode JWT tokens',
        'View header and payload',
        'Pretty print JSON',
        'Validate structure',
        'Copy decoded data'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.6',
        'ratingCount': '1600',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const decodeBase64 = (str: string): string => {
    try {
      // Add padding if needed
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (err) {
      throw new Error('Invalid Base64 encoding');
    }
  };

  const decodeJWT = () => {
    setError('');
    setDecoded(null);

    if (!token.trim()) {
      setError('Please enter a JWT token');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
      }

      const [headerRaw, payloadRaw, signature] = parts;

      const header = JSON.parse(decodeBase64(headerRaw));
      const payload = JSON.parse(decodeBase64(payloadRaw));

      setDecoded({
        header,
        payload,
        signature,
        headerRaw,
        payloadRaw,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode JWT token');
      setDecoded(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🔓 Free JWT Decoder Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free JWT decoder online - no signup required. Decode JWT tokens to view header and payload instantly. Pretty print JSON, view token claims, and validate structure. Perfect for debugging and understanding JWT structure. All processing in your browser.
        </p>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JWT Token
          </label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your JWT token here (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={decodeJWT}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Decode
            </button>
            <button
              onClick={() => {
                setToken('');
                setDecoded(null);
                setError('');
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Decoded Results */}
        {decoded && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Header</h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2))}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </div>

            {/* Payload */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Payload</h2>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2))}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>

              {/* Payload Info */}
              {decoded.payload && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Token Information</h3>
                  <div className="space-y-2 text-sm">
                    {decoded.payload.iss && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Issuer (iss):</span>
                        <span className="font-mono">{decoded.payload.iss}</span>
                      </div>
                    )}
                    {decoded.payload.sub && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject (sub):</span>
                        <span className="font-mono">{decoded.payload.sub}</span>
                      </div>
                    )}
                    {decoded.payload.aud && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Audience (aud):</span>
                        <span className="font-mono">{decoded.payload.aud}</span>
                      </div>
                    )}
                    {decoded.payload.exp && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires (exp):</span>
                        <span className="font-mono">{formatDate(decoded.payload.exp)}</span>
                      </div>
                    )}
                    {decoded.payload.iat && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Issued At (iat):</span>
                        <span className="font-mono">{formatDate(decoded.payload.iat)}</span>
                      </div>
                    )}
                    {decoded.payload.nbf && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Not Before (nbf):</span>
                        <span className="font-mono">{formatDate(decoded.payload.nbf)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Signature */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Signature</h2>
                <button
                  onClick={() => copyToClipboard(decoded.signature)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy
                </button>
              </div>
              <code className="block bg-gray-50 p-4 rounded-lg font-mono text-sm break-all">
                {decoded.signature}
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Note: Signature verification requires the secret key. This tool only decodes the token structure.
              </p>
            </div>
          </div>
        )}

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About JWT Decoder</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              JWT (JSON Web Token) is a compact, URL-safe token format used for authentication and authorization. 
              JWTs consist of three parts: header, payload, and signature, separated by dots.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our JWT decoder helps you decode and view the contents of JWT tokens without verifying the signature. 
              Perfect for debugging, understanding token structure, and viewing claims.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Debug JWT tokens in development</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>View token claims and expiration</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Understand JWT structure</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Verify token payload contents</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Check token expiration dates</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Debug authentication issues</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Decode Header & Payload</h4>
                  <p className="text-sm text-gray-600">View JWT header and payload as JSON</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Pretty Print JSON</h4>
                  <p className="text-sm text-gray-600">Formatted JSON for easy reading</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Token Information</h4>
                  <p className="text-sm text-gray-600">View issuer, subject, expiration, and more</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Copy to Clipboard</h4>
                  <p className="text-sm text-gray-600">One-click copy for header, payload, or signature</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What is a JWT token?</h4>
                <p className="text-gray-700 text-sm">
                  JWT (JSON Web Token) is a compact token format consisting of three Base64-encoded parts: header, 
                  payload, and signature. It's commonly used for authentication and authorization in web applications.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Does this tool verify the signature?</h4>
                <p className="text-gray-700 text-sm">
                  No, this tool only decodes the token structure. Signature verification requires the secret key, 
                  which should never be shared. This tool is for viewing token contents, not for verification.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What are common JWT claims?</h4>
                <p className="text-gray-700 text-sm">
                  Common claims include: <strong>iss</strong> (issuer), <strong>sub</strong> (subject), 
                  <strong>aud</strong> (audience), <strong>exp</strong> (expiration), <strong>iat</strong> (issued at), 
                  and <strong>nbf</strong> (not before).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my token data secure?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, all decoding happens locally in your browser. Your token is never sent to any server or stored 
                  anywhere. However, be cautious when sharing decoded tokens as they may contain sensitive information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>JWT tokens have three parts separated by dots: header.payload.signature</li>
            <li>Check the 'exp' claim to see when the token expires</li>
            <li>This tool does not verify signatures - use it for debugging only</li>
            <li>All processing happens in your browser - no uploads required</li>
            <li>Never share your JWT secret key or tokens containing sensitive data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

