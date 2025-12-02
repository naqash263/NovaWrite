import { useState, useRef, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

export default function ImageFormatConverter() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('jpeg');
  const [quality, setQuality] = useState<number>(0.9);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free Image Format Converter - Convert JPEG, PNG, GIF, WebP Online | Image Converter',
    description: 'Free online image format converter. Convert images between JPEG, PNG, GIF, WebP, and BMP formats. Maintain quality, adjust compression. Download converted images instantly. No registration required.',
    url: '/resources/utility-tools/image-format-converter',
    keywords: [
      'image format converter', 'convert image format', 'JPEG to PNG', 'PNG to JPEG',
      'image converter', 'format converter', 'online image converter', 'free image converter',
      'convert image', 'image format changer'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Image Format Converter',
      'description': 'Free online image format converter. Convert images between JPEG, PNG, GIF, WebP, and BMP formats.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/image-format-converter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Convert between JPEG, PNG, GIF, WebP, BMP',
        'Maintain image quality',
        'Adjust compression quality',
        'Download converted images',
        'All processing in browser'
      ]
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setError('');
    setOriginalFile(file);
    setConvertedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const convertImage = () => {
    if (!originalImage || !originalFile) {
      setError('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setError('');

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(img, 0, 0);

        let mimeType = 'image/jpeg';
        let fileExtension = 'jpg';

        switch (targetFormat) {
          case 'jpeg':
            mimeType = 'image/jpeg';
            fileExtension = 'jpg';
            break;
          case 'png':
            mimeType = 'image/png';
            fileExtension = 'png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            fileExtension = 'webp';
            break;
          case 'gif':
            mimeType = 'image/gif';
            fileExtension = 'gif';
            break;
          case 'bmp':
            mimeType = 'image/bmp';
            fileExtension = 'bmp';
            break;
        }

        let dataUrl: string;
        if (targetFormat === 'png') {
          dataUrl = canvas.toDataURL(mimeType);
        } else if (targetFormat === 'webp') {
          dataUrl = canvas.toDataURL(mimeType, quality);
        } else if (targetFormat === 'jpeg') {
          dataUrl = canvas.toDataURL(mimeType, quality);
        } else {
          // For GIF and BMP, use PNG as fallback
          dataUrl = canvas.toDataURL('image/png');
        }

        setConvertedImage(dataUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to convert image');
      } finally {
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      setError('Failed to load image');
      setIsProcessing(false);
    };

    img.src = originalImage;
  };

  const downloadConverted = () => {
    if (!convertedImage || !originalFile) return;

    const link = document.createElement('a');
    link.href = convertedImage;
    link.download = `${originalFile.name.split('.')[0]}.${targetFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setOriginalFile(null);
    setOriginalImage(null);
    setConvertedImage(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (originalImage && originalFile) {
      convertImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFormat, quality]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Format Converter</h1>
        <p className="text-gray-600 mb-6">
          Convert images between different formats: JPEG, PNG, GIF, WebP, and BMP. All processing happens in your browser.
        </p>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Options */}
        {originalImage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="jpeg">JPEG (.jpg)</option>
                <option value="png">PNG (.png)</option>
                <option value="webp">WebP (.webp)</option>
                <option value="gif">GIF (.gif)</option>
                <option value="bmp">BMP (.bmp)</option>
              </select>
            </div>

            {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Images Preview */}
        {originalImage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Original Image
                {originalFile && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({originalFile.name})
                  </span>
                )}
              </h3>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            </div>

            {convertedImage && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Converted Image ({targetFormat.toUpperCase()})
                </h3>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img
                    src={convertedImage}
                    alt="Converted"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
                <button
                  onClick={downloadConverted}
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Download Converted Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {originalImage && (
          <div className="flex gap-4">
            <button
              onClick={convertImage}
              disabled={isProcessing}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Image Format Converter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Image Format Converter is a free online tool that converts images between different formats 
            including JPEG, PNG, GIF, WebP, and BMP. All processing happens in your browser for privacy and speed.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Convert between JPEG, PNG, GIF, WebP, and BMP formats</li>
            <li>Maintain image quality during conversion</li>
            <li>Adjust compression quality for JPEG and WebP</li>
            <li>All processing happens in your browser (privacy-friendly)</li>
            <li>Download converted images instantly</li>
            <li>No file size limits</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Convert images for web use (JPEG to WebP for better compression)</li>
            <li>Convert PNG to JPEG for smaller file sizes</li>
            <li>Prepare images for different platforms and requirements</li>
            <li>Batch convert images to a consistent format</li>
            <li>Optimize images for email attachments</li>
            <li>Convert images for social media platforms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

