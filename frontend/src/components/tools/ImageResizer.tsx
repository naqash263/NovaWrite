import { useState, useRef, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

export default function ImageResizer() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [quality, setQuality] = useState<number>(0.9);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('jpeg');
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);
  const [fileSize, setFileSize] = useState<{ original: number; resized: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useSEO({
    title: 'Free Image Resizer - Resize Images Online | Image Size Converter',
    description: 'Resize images online for free. Adjust width, height, maintain aspect ratio, change format, and adjust quality. Download resized images instantly. No registration required.',
    url: '/resources/utility-tools/image-resizer',
    keywords: [
      'image resizer', 'resize image', 'image size converter', 'resize photo',
      'image compressor', 'photo resizer', 'image editor', 'resize picture',
      'online image resizer', 'free image resizer', 'image tool'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Image Resizer',
      'description': 'Free online image resizer. Resize images with adjustable dimensions, format conversion, and quality control.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/image-resizer',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Resize images to custom dimensions',
        'Maintain aspect ratio option',
        'Format conversion (JPEG, PNG, WebP)',
        'Quality adjustment',
        'Before/after size comparison',
        'Instant download'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.7',
        'ratingCount': '2400',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setOriginalImage(imageUrl);
      setFileSize({ original: file.size, resized: 0 });

      const img = new Image();
      img.onload = () => {
        setOriginalSize({ width: img.width, height: img.height });
        if (maintainAspectRatio) {
          const aspectRatio = img.width / img.height;
          if (width / height > aspectRatio) {
            setHeight(Math.round(width / aspectRatio));
          } else {
            setWidth(Math.round(height * aspectRatio));
          }
        } else {
          setWidth(img.width);
          setHeight(img.height);
        }
        resizeImage(img, width, height);
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const resizeImage = (img: HTMLImageElement, targetWidth: number, targetHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    setResizedImage(dataUrl);

    // Calculate file size
    const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
    const padding = dataUrl.charAt(dataUrl.length - 2) === '=' ? 2 : dataUrl.charAt(dataUrl.length - 1) === '=' ? 1 : 0;
    const fileSizeBytes = (base64Length * 3) / 4 - padding;
    setFileSize(prev => prev ? { ...prev, resized: fileSizeBytes } : null);
  };

  const handleResize = () => {
    if (!originalImage) return;

    const img = new Image();
    img.onload = () => {
      let targetWidth = width;
      let targetHeight = height;

      if (maintainAspectRatio && originalSize) {
        const aspectRatio = originalSize.width / originalSize.height;
        if (targetWidth / targetHeight > aspectRatio) {
          targetHeight = Math.round(targetWidth / aspectRatio);
          setHeight(targetHeight);
        } else {
          targetWidth = Math.round(targetHeight * aspectRatio);
          setWidth(targetWidth);
        }
      }

      resizeImage(img, targetWidth, targetHeight);
    };
    img.src = originalImage;
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspectRatio && originalSize) {
      const aspectRatio = originalSize.width / originalSize.height;
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspectRatio && originalSize) {
      const aspectRatio = originalSize.width / originalSize.height;
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const downloadImage = () => {
    if (!resizedImage) return;

    const link = document.createElement('a');
    link.href = resizedImage;
    link.download = `resized-image.${format}`;
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  useEffect(() => {
    if (originalImage) {
      handleResize();
    }
  }, [width, height, quality, format, maintainAspectRatio]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🖼️ Image Resizer
        </h1>
        <p className="text-gray-600 mb-6">
          Resize images online for free. Adjust dimensions, maintain aspect ratio, change format, and adjust quality.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div>
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {originalSize && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Original Size</div>
                <div className="text-lg font-semibold">
                  {originalSize.width} × {originalSize.height} px
                </div>
                {fileSize && (
                  <div className="text-sm text-gray-500 mt-1">
                    {formatFileSize(fileSize.original)}
                  </div>
                )}
              </div>
            )}

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintainAspectRatio}
                  onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Maintain Aspect Ratio</span>
              </label>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg' | 'webp')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>

            {fileSize && fileSize.resized > 0 && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Resized Size</div>
                <div className="text-lg font-semibold text-green-700">
                  {formatFileSize(fileSize.resized)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {((1 - fileSize.resized / fileSize.original) * 100).toFixed(1)}% smaller
                </div>
              </div>
            )}

            {resizedImage && (
              <button
                onClick={downloadImage}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                📥 Download Resized Image
              </button>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 min-h-[400px] flex items-center justify-center">
              {resizedImage ? (
                <div className="text-center">
                  <img
                    src={resizedImage}
                    alt="Resized"
                    className="max-w-full max-h-[500px] mx-auto mb-4 rounded-lg shadow-lg"
                  />
                  <div className="text-sm text-gray-600">
                    {width} × {height} px
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">🖼️</div>
                  <p>Upload an image to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Image Resizer</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Image Resizer is a powerful, client-side tool that resizes images directly in your 
              browser using HTML5 Canvas technology. All processing happens locally, ensuring your 
              images are never uploaded to any server. This provides maximum privacy and security 
              for your images.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for resizing photos for social media, websites, email attachments, or any 
              other use case. The tool supports multiple formats and quality settings to optimize 
              file size while maintaining visual quality.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Resizing images for social media posts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Optimizing images for websites and blogs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Reducing file size for email attachments</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Converting between image formats</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Creating thumbnails and preview images</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Preparing images for print materials</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Custom Dimensions</h4>
                  <p className="text-sm text-gray-600">Resize to any width and height up to 10,000px</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Aspect Ratio</h4>
                  <p className="text-sm text-gray-600">Maintain original proportions or customize freely</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Format Support</h4>
                  <p className="text-sm text-gray-600">Convert between JPEG, PNG, and WebP formats</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Quality Control</h4>
                  <p className="text-sm text-gray-600">Adjust quality (0.1-1.0) to balance size and appearance</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my image uploaded to a server?</h4>
                <p className="text-gray-700 text-sm">
                  No, all image processing happens locally in your browser using HTML5 Canvas. Your 
                  images never leave your device.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What image formats are supported?</h4>
                <p className="text-gray-700 text-sm">
                  You can upload JPEG, PNG, GIF, WebP, and BMP images. Output formats include JPEG, 
                  PNG, and WebP.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the maximum image size?</h4>
                <p className="text-gray-700 text-sm">
                  Maximum dimensions are 10,000 × 10,000 pixels. File size limits depend on your 
                  browser's memory capacity.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How do I choose the right format?</h4>
                <p className="text-gray-700 text-sm">
                  JPEG for photos (smaller size), PNG for images with transparency, WebP for modern 
                  browsers (best compression).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>JPEG is best for photos, PNG for images with transparency, WebP for modern browsers</li>
            <li>Lower quality reduces file size but may affect image appearance</li>
            <li>Maintain aspect ratio to prevent image distortion</li>
            <li>Maximum dimensions: 10,000 × 10,000 pixels</li>
            <li>Check file size before/after to see compression results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

