import { useState, useRef } from 'react';
import { useSEO } from '../../utils/seo';
import { API_CONFIG } from '../../config/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export default function WebPConverter() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<'webp' | 'avif'>('webp');
  const [quality, setQuality] = useState<number>(85);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [conversionStats, setConversionStats] = useState<{
    originalSize: number;
    convertedSize: number;
    reductionPercent: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free WebP & AVIF Converter Online - Convert Images to WebP/AVIF | No Signup',
    description: 'Free WebP and AVIF converter online - no signup required. Convert images to WebP or AVIF format for better performance and smaller file sizes. Automatic optimization, quality control, and instant download. Perfect for web optimization.',
    url: '/resources/utility-tools/webp-converter',
    keywords: [
      'free webp converter online', 'webp converter', 'convert to webp', 'webp converter free',
      'avif converter', 'convert to avif', 'image optimizer', 'webp converter online',
      'image format converter webp', 'webp image converter', 'optimize images webp',
      'convert jpg to webp', 'convert png to webp', 'webp converter tool'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'WebP & AVIF Converter',
      'description': 'Free online WebP and AVIF converter. Convert images to modern formats for better performance and smaller file sizes.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/webp-converter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Convert images to WebP format',
        'Convert images to AVIF format',
        'Adjust quality settings',
        'Automatic file size optimization',
        'Before/after size comparison',
        'Instant download'
      ]
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF, WebP, AVIF, BMP)');
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    setOriginalFile(file);
    setConvertedImage(null);
    setConversionStats(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const convertImage = async () => {
    if (!originalFile) {
      setError('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setConvertedImage(null);
    setConversionStats(null);

    try {
      // Use the dedicated WebP/AVIF converter endpoint
      const formData = new FormData();
      formData.append('image', originalFile);
      formData.append('format', targetFormat);
      formData.append('quality', (quality / 100).toString());

      const response = await fetch(`${API_URL}/utility-tools/webp-converter/convert`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to convert image');
      }

      // Get the converted file URL
      const fullUrl = data.data.url.startsWith('http') 
        ? data.data.url 
        : API_CONFIG.getStorageUrl(data.data.path);

      setConvertedImage(fullUrl);

      // Set conversion stats
      setConversionStats({
        originalSize: data.data.original_size,
        convertedSize: data.data.converted_size,
        reductionPercent: Math.round(data.data.reduction_percent),
      });

    } catch (err: any) {
      setError(err.message || 'Failed to convert image. Please try again.');
      console.error('Conversion error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!convertedImage) return;

    const link = document.createElement('a');
    link.href = convertedImage;
    link.download = originalFile 
      ? `${originalFile.name.split('.')[0]}.${targetFormat}`
      : `converted.${targetFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          WebP & AVIF Converter
        </h1>
        <p className="text-gray-600 mb-8">
          Convert images to WebP or AVIF format for better performance and smaller file sizes. 
          Modern image formats that provide superior compression while maintaining quality.
        </p>

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,image/bmp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-gray-600 hover:text-blue-600"
          >
            {originalFile ? originalFile.name : 'Click to select an image file'}
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Format
          </label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as 'webp' | 'avif')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="webp">WebP (Better browser support)</option>
            <option value="avif">AVIF (Best compression, newer format)</option>
          </select>
          <p className="text-sm text-gray-500 mt-2">
            {targetFormat === 'webp' 
              ? 'WebP provides excellent compression with wide browser support.'
              : 'AVIF offers the best compression but requires modern browsers.'}
          </p>
        </div>

        {/* Quality Slider (for reference, actual conversion uses backend defaults) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality: {quality}% (Backend optimized)
          </label>
          <input
            type="range"
            min="50"
            max="100"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            className="w-full"
            disabled
          />
          <p className="text-sm text-gray-500 mt-1">
            Quality is automatically optimized by the backend for best file size reduction.
          </p>
        </div>

        {/* Convert Button */}
        <div className="mb-6">
          <button
            onClick={convertImage}
            disabled={!originalFile || isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Converting...' : 'Convert to ' + targetFormat.toUpperCase()}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* File Size Info - Show before conversion */}
        {originalFile && !convertedImage && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">Original File Size:</span>
                <p className="text-lg font-semibold text-gray-900">{formatFileSize(originalFile.size)}</p>
              </div>
              <div className="text-sm text-gray-500">
                {originalFile.name}
              </div>
            </div>
          </div>
        )}

        {/* Images Preview */}
        {originalImage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Original Image
              </h3>
              <div className="mb-2 p-2 bg-gray-100 rounded">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">File Size:</span>
                  <span className="font-semibold text-gray-900">
                    {originalFile ? formatFileSize(originalFile.size) : 'N/A'}
                  </span>
                </div>
                {originalFile && (
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>Format:</span>
                    <span>{originalFile.type.split('/')[1]?.toUpperCase() || 'Unknown'}</span>
                  </div>
                )}
              </div>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-w-full h-auto rounded"
                />
              </div>
            </div>

            {convertedImage && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Converted Image ({targetFormat.toUpperCase()})
                </h3>
                <div className="mb-2 p-2 bg-green-100 rounded">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">File Size:</span>
                    <span className="font-semibold text-green-700">
                      {conversionStats ? formatFileSize(conversionStats.convertedSize) : 'N/A'}
                    </span>
                  </div>
                  {conversionStats && (
                    <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                      <span>Reduction:</span>
                      <span className="font-semibold text-green-700">
                        {conversionStats.reductionPercent > 0 ? '-' : '+'}
                        {Math.abs(conversionStats.reductionPercent)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                  <img
                    src={convertedImage}
                    alt="Converted"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conversion Stats - Enhanced Display */}
        {conversionStats && (
          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg shadow-sm">
            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Conversion Results
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Original Size</div>
                <div className="text-2xl font-bold text-gray-900">{formatFileSize(conversionStats.originalSize)}</div>
                <div className="text-xs text-gray-400 mt-1">Before conversion</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Converted Size</div>
                <div className="text-2xl font-bold text-green-700">{formatFileSize(conversionStats.convertedSize)}</div>
                <div className="text-xs text-gray-400 mt-1">After conversion</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Size Reduction</div>
                <div className="text-2xl font-bold text-blue-700">
                  {conversionStats.reductionPercent > 0 ? '-' : '+'}
                  {Math.abs(conversionStats.reductionPercent)}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Space saved</div>
              </div>
            </div>
            {conversionStats.reductionPercent > 0 && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                <p className="text-sm text-green-800">
                  <strong>Great!</strong> You saved {formatFileSize(conversionStats.originalSize - conversionStats.convertedSize)} 
                  ({conversionStats.reductionPercent}% reduction) by converting to {targetFormat.toUpperCase()}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Download Button */}
        {convertedImage && (
          <div className="mb-6">
            <button
              onClick={downloadImage}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Download {targetFormat.toUpperCase()} Image
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">About WebP & AVIF</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>WebP:</strong> Developed by Google, provides 25-35% better compression than JPEG while maintaining quality</li>
            <li>• <strong>AVIF:</strong> Next-generation format offering 50% better compression than JPEG with superior quality</li>
            <li>• Both formats support transparency and animation</li>
            <li>• Perfect for web optimization and faster page loads</li>
            <li>• All conversions are processed securely on our servers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

