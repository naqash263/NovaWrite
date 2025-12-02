import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

export default function HashGenerator() {
  const [inputText, setInputText] = useState<string>('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [hashResult, setHashResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileHash, setFileHash] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  useSEO({
    title: 'Free Hash Generator - MD5, SHA-1, SHA-256, SHA-512 Hash Generator | Online Hash Tool',
    description: 'Free online hash generator. Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files. Compare hashes, copy to clipboard. Perfect for developers and security professionals. No registration required.',
    url: '/resources/utility-tools/hash-generator',
    keywords: [
      'hash generator', 'MD5 generator', 'SHA-256 generator', 'SHA-1 generator', 'SHA-512 generator',
      'hash calculator', 'online hash tool', 'text hash', 'file hash', 'hash converter',
      'cryptographic hash', 'hash function', 'checksum generator'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Hash Generator',
      'description': 'Free online hash generator. Generate MD5, SHA-1, SHA-256, and SHA-512 hashes.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/hash-generator',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'MD5, SHA-1, SHA-256, SHA-512 hash generation',
        'Text and file hashing',
        'Hash comparison',
        'Copy to clipboard',
        'Real-time hash generation'
      ]
    }
  });

  const generateHash = async (text: string, algorithm: HashAlgorithm): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    let hashBuffer: ArrayBuffer;
    
    // MD5 is not natively supported in Web Crypto API
    if (algorithm === 'MD5') {
      return Promise.resolve('MD5 is not natively supported in browsers. Please use SHA-256 or SHA-512 for better security.');
    }

    switch (algorithm) {
      case 'SHA-1':
        hashBuffer = await crypto.subtle.digest('SHA-1', data);
        break;
      
      case 'SHA-256':
        hashBuffer = await crypto.subtle.digest('SHA-256', data);
        break;
      
      case 'SHA-512':
        hashBuffer = await crypto.subtle.digest('SHA-512', data);
        break;
      
      default:
        hashBuffer = await crypto.subtle.digest('SHA-256', data);
    }
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // MD5 is not natively supported in Web Crypto API
  // Users should use SHA-256 or SHA-512 instead


  const handleFileHash = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      let hashBuffer: ArrayBuffer;
      
      if (selectedAlgorithm === 'MD5') {
        setFileHash('MD5 is not natively supported in browsers. Please use SHA-256 or SHA-512.');
        setIsProcessing(false);
        return;
      }
      
      switch (selectedAlgorithm) {
        case 'SHA-1':
          hashBuffer = await crypto.subtle.digest('SHA-1', data);
          break;
        case 'SHA-256':
          hashBuffer = await crypto.subtle.digest('SHA-256', data);
          break;
        case 'SHA-512':
          hashBuffer = await crypto.subtle.digest('SHA-512', data);
          break;
        default:
          hashBuffer = await crypto.subtle.digest('SHA-256', data);
      }
      
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setFileHash(hash);
    } catch (error) {
      setFileHash('Error generating file hash. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Hash copied to clipboard!');
    } catch (err) {
      alert('Failed to copy hash. Please select and copy manually.');
    }
  };


  useEffect(() => {
    const generateTextHash = async () => {
      if (!inputText.trim()) {
        setHashResult('');
        return;
      }

      setIsProcessing(true);
      try {
        if (selectedAlgorithm === 'MD5') {
          setHashResult('MD5 is not natively supported in browsers. Please use SHA-256 or SHA-512, or use an external MD5 library.');
        } else {
          const hash = await generateHash(inputText, selectedAlgorithm);
          setHashResult(hash);
        }
      } catch (error) {
        setHashResult('Error generating hash. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    generateTextHash();
  }, [inputText, selectedAlgorithm]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hash Generator</h1>
        <p className="text-gray-600 mb-6">
          Generate cryptographic hashes from text or files. Supports SHA-1, SHA-256, and SHA-512 algorithms.
        </p>

        <div className="space-y-6">
          {/* Algorithm Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Hash Algorithm
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['SHA-256', 'SHA-512', 'SHA-1'] as HashAlgorithm[]).map((algo) => (
                <button
                  key={algo}
                  onClick={() => setSelectedAlgorithm(algo)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedAlgorithm === algo
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: MD5 is deprecated for security. SHA-256 and SHA-512 are recommended.
            </p>
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Input
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to hash..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{inputText.length} characters</span>
              <button
                onClick={() => setInputText('')}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Text Hash Result */}
          {hashResult && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {selectedAlgorithm} Hash
                </label>
                <button
                  onClick={() => copyToClipboard(hashResult)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Copy Hash
                </button>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <code className="text-sm font-mono break-all text-gray-900">{hashResult}</code>
              </div>
            </div>
          )}

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Input
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileHash(file);
                  }
                }}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose File
              </label>
              <p className="text-sm text-gray-500 mt-2">
                {fileName || 'No file selected'}
              </p>
            </div>
          </div>

          {/* File Hash Result */}
          {fileHash && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {selectedAlgorithm} Hash ({fileName})
                </label>
                <button
                  onClick={() => copyToClipboard(fileHash)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Copy Hash
                </button>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <code className="text-sm font-mono break-all text-gray-900">{fileHash}</code>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center text-gray-600">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Generating hash...</span>
            </div>
          )}
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Hash Generator</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            A hash generator creates a fixed-size string (hash) from input data using cryptographic hash functions. 
            Hashes are commonly used for data integrity verification, password storage, and digital signatures.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported Algorithms</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>SHA-256</strong> - Secure Hash Algorithm 256-bit (recommended)</li>
            <li><strong>SHA-512</strong> - Secure Hash Algorithm 512-bit (most secure)</li>
            <li><strong>SHA-1</strong> - Secure Hash Algorithm 1 (deprecated, use SHA-256)</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Verify file integrity and detect corruption</li>
            <li>Generate checksums for downloads</li>
            <li>Create unique identifiers from data</li>
            <li>Password hashing (server-side only)</li>
            <li>Digital signatures and authentication</li>
            <li>Blockchain and cryptocurrency applications</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Security Notes</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>SHA-256 and SHA-512 are cryptographically secure</li>
            <li>MD5 and SHA-1 are deprecated for security purposes</li>
            <li>Hashing is one-way - you cannot reverse a hash to get the original data</li>
            <li>Use strong algorithms (SHA-256 or SHA-512) for security-sensitive applications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

