import { useState, useRef } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export default function ImageCompressor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [quality, setQuality] = useState<number>(0.8);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [maxHeight, setMaxHeight] = useState<number>(1080);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [useApi, setUseApi] = useState<boolean>(false);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressionRatio, setCompressionRatio] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free Image Compressor - Reduce Image File Size Online | Compress Images',
    description: 'Free online image compressor. Reduce image file size while maintaining quality. Compress JPEG, PNG, WebP images. Adjust quality, resize dimensions. Download compressed images instantly. No registration required.',
    url: '/resources/utility-tools/image-compressor',
    keywords: [
      'image compressor', 'compress image', 'reduce image size', 'image file size reducer',
      'online image compressor', 'free image compressor', 'compress JPEG', 'compress PNG',
      'compress WebP', 'image optimizer', 'photo compressor'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Image Compressor',
      'description': 'Free online image compressor. Reduce image file size while maintaining quality.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/image-compressor',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Compress JPEG, PNG, WebP images',
        'Adjust quality (0.1 to 1.0)',
        'Resize while compressing',
        'Maintain aspect ratio',
        'Before/after comparison',
        'Download compressed image'
      ]
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setOriginalFile(file);
      setOriginalSize(file.size);
      setCompressedImage(null);
      setCompressedFile(null);
      setCompressionRatio(0);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = async () => {
    if (!originalFile || !originalImage) return;

    setIsProcessing(true);

    try {
      if (useApi) {
        await compressViaAPI();
      } else {
        await compressClientSide();
      }
    } catch (error) {
      console.error('Compression error:', error);
      alert('Failed to compress image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const compressClientSide = async () => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          if (maintainAspectRatio) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          } else {
            width = Math.min(width, maxWidth);
            height = Math.min(height, maxHeight);
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified format and quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            setCompressedFile(blob);
            setCompressedSize(blob.size);
            setCompressionRatio(((originalSize - blob.size) / originalSize) * 100);

            const reader = new FileReader();
            reader.onload = (event) => {
              setCompressedImage(event.target?.result as string);
            };
            reader.readAsDataURL(blob);
            resolve();
          },
          `image/${format}`,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      if (originalImage) {
        img.src = originalImage;
      } else {
        reject(new Error('No image to compress'));
      }
    });
  };

  const compressViaAPI = async () => {
    if (!originalFile) return;

    const formData = new FormData();
    formData.append('image', originalFile);
    formData.append('quality', quality.toString());
    formData.append('maxWidth', maxWidth.toString());
    formData.append('maxHeight', maxHeight.toString());
    formData.append('maintainAspectRatio', maintainAspectRatio.toString());
    formData.append('format', format);

    try {
      const response = await fetch(`${API_URL}/utility-tools/image-compressor/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API compression failed');
      }

      const blob = await response.blob();
      setCompressedFile(blob);
      setCompressedSize(blob.size);
      setCompressionRatio(((originalSize - blob.size) / originalSize) * 100);

      const reader = new FileReader();
      reader.onload = (event) => {
        setCompressedImage(event.target?.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('API compression error:', error);
      throw error;
    }
  };

  const downloadCompressed = () => {
    if (!compressedFile || !originalFile) return;

    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-${originalFile.name}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setOriginalImage(null);
    setCompressedImage(null);
    setOriginalFile(null);
    setCompressedFile(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setCompressionRatio(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Compressor</h1>
        <p className="text-gray-600 mb-6">
          Reduce image file size while maintaining quality. Compress JPEG, PNG, and WebP images instantly.
        </p>

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-input"
              />
              <label
                htmlFor="image-input"
                className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose Image
              </label>
              <p className="text-sm text-gray-500 mt-2">
                {originalFile ? originalFile.name : 'No file selected'}
              </p>
            </div>
          </div>

          {/* Compression Settings */}
          {originalImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quality Slider */}
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low (10%)</span>
                  <span>High (100%)</span>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <div className="flex gap-3">
                  {(['jpeg', 'png', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                        format === fmt
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Width: {maxWidth}px
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Height: {maxHeight}px
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Maintain Aspect Ratio */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintainAspectRatio"
                  checked={maintainAspectRatio}
                  onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="maintainAspectRatio" className="text-sm text-gray-700">
                  Maintain Aspect Ratio
                </label>
              </div>

              {/* Use API Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useApi"
                  checked={useApi}
                  onChange={(e) => setUseApi(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="useApi" className="text-sm text-gray-700">
                  Use Server-Side Compression (for large files)
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {originalImage && (
            <div className="flex gap-3">
              <button
                onClick={compressImage}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Compressing...' : 'Compress Image'}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Reset
              </button>
            </div>
          )}

          {/* Before/After Comparison */}
          {(originalImage || compressedImage) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Image */}
              {originalImage && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Original Image
                  </h3>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="max-w-full h-auto rounded"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Size: {formatBytes(originalSize)}
                    </p>
                  </div>
                </div>
              )}

              {/* Compressed Image */}
              {compressedImage && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Compressed Image
                  </h3>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img
                      src={compressedImage}
                      alt="Compressed"
                      className="max-w-full h-auto rounded"
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Size: {formatBytes(compressedSize)}
                      </p>
                      {compressionRatio > 0 && (
                        <p className="text-sm text-green-600 font-medium">
                          Reduced by {compressionRatio.toFixed(1)}%
                        </p>
                      )}
                      <button
                        onClick={downloadCompressed}
                        className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Download Compressed Image
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Image Compressor</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Image Compressor reduces image file size while maintaining visual quality. 
            Perfect for optimizing images for web, email, or storage without significant quality loss.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Compress JPEG, PNG, and WebP images</li>
            <li>Adjustable quality (10% to 100%)</li>
            <li>Resize images while compressing</li>
            <li>Maintain aspect ratio option</li>
            <li>Before/after comparison</li>
            <li>Client-side and server-side compression options</li>
            <li>Download compressed images instantly</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Optimize images for websites and blogs</li>
            <li>Reduce email attachment sizes</li>
            <li>Save storage space</li>
            <li>Improve page load times</li>
            <li>Prepare images for social media</li>
            <li>Batch compress multiple images</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

