import { useState, useRef } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

type ImageFormat = 'heic' | 'jpg';

export default function HeicJpgConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<ImageFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('jpg');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free HEIC to JPG Converter Online - Convert iPhone Photos | No Signup',
    description: 'Free heic to jpg converter online - no signup required. Convert iPhone HEIC photos to JPG format instantly for better compatibility. Secure server-side processing, download converted images. Perfect for iPhone users.',
    url: '/resources/utility-tools/heic-jpg-converter',
    keywords: [
      'free heic to jpg converter', 'heic to jpg', 'free heic to jpg converter online', 'heic to jpg converter', 'convert heic to jpg',
      'heic converter', 'iphone photo converter', 'heic to jpeg',
      'convert heic', 'heic image converter', 'online heic converter', 'free heic converter',
      'heif to jpg', 'iphone image converter', 'free online heic converter'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'HEIC JPG Converter',
      'description': 'Free online HEIC to JPG converter. Convert iPhone HEIC photos to JPG format.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/heic-jpg-converter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Convert HEIC to JPG',
        'Convert JPG to HEIC',
        'iPhone photo conversion',
        'Download converted images',
        'Secure server-side processing'
      ]
    }
  });

  const detectFormat = (filename: string, mimeType?: string): ImageFormat | null => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'heic' || extension === 'heif' || mimeType?.includes('heic')) {
      return 'heic';
    }
    
    if (extension === 'jpg' || extension === 'jpeg') {
      return 'jpg';
    }
    
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSelectedFile(file);
    setDownloadUrl('');
    setFilename('');

    const format = detectFormat(file.name, file.type);
    if (!format) {
      setError('Unsupported file format. Please upload HEIC, HEIF, JPG, or JPEG files.');
      return;
    }

    setSourceFormat(format);
    
    // Set default target format
    if (format === 'heic') {
      setTargetFormat('jpg');
    } else {
      setTargetFormat('heic');
    }
  };

  const convertImage = async () => {
    if (!selectedFile || !sourceFormat) {
      setError('Please select a file first');
      return;
    }

    if (sourceFormat === targetFormat) {
      setError('Source and target formats are the same. Please select a different target format.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setDownloadUrl('');
    setFilename('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('target_format', targetFormat);

      const response = await fetch(`${API_URL}/utility-tools/heic-jpg-converter/convert`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to convert image');
      }

      if (data.success && data.data) {
        setDownloadUrl(data.data.url);
        setFilename(data.data.filename);
      } else {
        throw new Error(data.message || 'Failed to convert image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while converting the image');
      setDownloadUrl('');
      setFilename('');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadConverted = () => {
    if (!downloadUrl) return;
    window.open(downloadUrl, '_blank');
  };

  const reset = () => {
    setSelectedFile(null);
    setSourceFormat(null);
    setDownloadUrl('');
    setFilename('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Free HEIC to JPG Converter Online</h1>
        <p className="text-gray-600 mb-6">
          Free heic to jpg converter online - no signup required. Convert iPhone HEIC photos to JPG format instantly for better compatibility with all devices and applications. Secure server-side processing, download converted images. Perfect for iPhone users.
        </p>

        {/* Server Limitation Notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Note:</strong> HEIC conversion requires ImageMagick with HEIC support on the server. 
            On shared hosting, this may not be available. If conversion fails, please use a desktop application 
            or convert HEIC files on your device before uploading.
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select HEIC or JPG Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".heic,.heif,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {sourceFormat && (
            <p className="text-sm text-gray-600 mt-2">
              Detected format: <span className="font-semibold">{sourceFormat.toUpperCase()}</span>
            </p>
          )}
        </div>

        {/* Format Selection */}
        {selectedFile && sourceFormat && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Format
              </label>
              <input
                type="text"
                value={sourceFormat === 'heic' ? 'HEIC/HEIF' : 'JPG/JPEG'}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as ImageFormat)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sourceFormat !== 'jpg' && <option value="jpg">JPG (JPEG)</option>}
                {sourceFormat !== 'heic' && <option value="heic">HEIC</option>}
              </select>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {downloadUrl && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm mb-3">
              ✅ Image converted successfully!
            </p>
            <button
              onClick={downloadConverted}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Download Converted Image ({filename})
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {selectedFile && sourceFormat && (
          <div className="flex gap-4">
            <button
              onClick={convertImage}
              disabled={isProcessing || sourceFormat === targetFormat}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Converting...' : 'Convert Image'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About HEIC JPG Converter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            HEIC JPG Converter is a free online tool that converts iPhone HEIC photos to JPG format. 
            HEIC (High Efficiency Image Container) is the default format for photos taken on iPhones, 
            but JPG format is more widely compatible with all devices and applications.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported Formats</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>HEIC/HEIF:</strong> High Efficiency Image Container format used by iPhones and modern cameras.</li>
            <li><strong>JPG/JPEG:</strong> Universal image format compatible with all devices and applications.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Key Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>iPhone Photo Conversion:</strong> Convert HEIC photos from iPhones to JPG format.</li>
            <li><strong>Universal Compatibility:</strong> JPG format works on all devices, websites, and applications.</li>
            <li><strong>Secure Processing:</strong> All conversions happen on secure servers.</li>
            <li><strong>No Registration:</strong> Start converting images immediately without creating an account.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Website Uploads:</strong> Convert HEIC photos to JPG for uploading to websites and social media.</li>
            <li><strong>Device Compatibility:</strong> Convert HEIC files for use on Android devices or Windows computers.</li>
            <li><strong>Email Sharing:</strong> Convert HEIC photos to JPG for easier email sharing.</li>
            <li><strong>Photo Editing:</strong> Convert HEIC to JPG for use in photo editing software.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Server Requirements</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700 text-sm mb-2">
              <strong>Important:</strong> HEIC conversion requires ImageMagick with HEIC support on the server. 
              On shared hosting, this may not be available. If conversion fails, consider:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Converting HEIC files on your iPhone (Settings → Camera → Formats → Most Compatible)</li>
              <li>Using a desktop application like ImageMagick or online services</li>
              <li>Contacting your hosting provider to enable ImageMagick with HEIC support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

