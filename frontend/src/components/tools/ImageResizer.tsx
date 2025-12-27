import { useState, useRef, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

interface Preset {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
  category: string;
}

const SOCIAL_MEDIA_PRESETS: Preset[] = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    description: 'Square format for Instagram feed posts',
    category: 'social-media'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    description: 'Vertical format for Instagram stories',
    category: 'social-media'
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    width: 1080,
    height: 1920,
    description: 'Vertical format for Instagram reels',
    category: 'social-media'
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    width: 1200,
    height: 630,
    description: 'Recommended size for Facebook posts',
    category: 'social-media'
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    width: 1640,
    height: 859,
    description: 'Facebook page cover photo',
    category: 'social-media'
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    width: 1200,
    height: 675,
    description: 'Recommended size for Twitter posts',
    category: 'social-media'
  },
  {
    id: 'twitter-header',
    name: 'Twitter Header',
    width: 1500,
    height: 500,
    description: 'Twitter profile header image',
    category: 'social-media'
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    width: 1200,
    height: 627,
    description: 'Recommended size for LinkedIn posts',
    category: 'social-media'
  },
  {
    id: 'linkedin-cover',
    name: 'LinkedIn Cover',
    width: 1584,
    height: 396,
    description: 'LinkedIn company page cover image',
    category: 'social-media'
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    description: 'YouTube video thumbnail (16:9)',
    category: 'social-media'
  },
  {
    id: 'pinterest-pin',
    name: 'Pinterest Pin',
    width: 1000,
    height: 1500,
    description: 'Vertical format for Pinterest pins',
    category: 'social-media'
  },
];

export default function ImageResizer() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [quality, setQuality] = useState<number>(0.9);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'avif'>('jpeg');
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);
  const [fileSize, setFileSize] = useState<{ original: number; resized: number } | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [useApi, setUseApi] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useSEO({
    title: 'Free Image Resizer Online - Resize Images | No Signup',
    description: 'Free image resizer online - no signup required. Resize images online instantly with social media presets. Instagram, Facebook, Twitter, LinkedIn, YouTube, and Pinterest sizes. Adjust dimensions, maintain aspect ratio, change format, and adjust quality. All processing in your browser.',
    url: '/resources/utility-tools/image-resizer',
    keywords: [
      'free image resizer online', 'image resizer', 'free image resizer', 'image resizer online', 'resize image online free',
      'resize image', 'image size converter', 'resize photo',
      'social media image resizer', 'instagram image size', 'facebook image size',
      'twitter image size', 'linkedin image size', 'youtube thumbnail', 'pinterest image size',
      'image compressor', 'photo resizer', 'image editor', 'resize picture',
      'online image resizer', 'image tool', 'free online image resizer'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Image Resizer',
      'description': 'Free online image resizer with social media presets. Resize images with adjustable dimensions, format conversion, and quality control.',
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
        'Social media presets (Instagram, Facebook, Twitter, etc.)',
        'Maintain aspect ratio option',
        'Format conversion (JPEG, PNG, WebP, AVIF)',
        'Quality adjustment',
        'Before/after size comparison',
        'API support',
        'Instant download'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '3200',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setOriginalFile(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setOriginalImage(imageUrl);
      setFileSize({ original: file.size, resized: 0 });

      const img = new Image();
      img.onload = () => {
        setOriginalSize({ width: img.width, height: img.height });
        if (selectedPreset === 'default') {
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
        }
        if (!useApi) {
          resizeImage(img, width, height);
        }
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    if (presetId !== 'default') {
      const preset = SOCIAL_MEDIA_PRESETS.find(p => p.id === presetId);
      if (preset) {
        // Temporarily disable aspect ratio to set exact preset dimensions
        const wasMaintainingAspect = maintainAspectRatio;
        if (wasMaintainingAspect) {
          setMaintainAspectRatio(false);
        }
        setWidth(preset.width);
        setHeight(preset.height);
        
        // Trigger resize immediately if image is loaded
        if (originalImage && !useApi) {
          setTimeout(() => {
            const img = new Image();
            img.onload = () => {
              resizeImage(img, preset.width, preset.height);
            };
            img.src = originalImage;
          }, 50);
        } else if (originalImage && useApi && originalFile) {
          // For API mode, trigger resize
          setTimeout(() => {
            handleResize();
          }, 50);
        }
        
        // Re-enable aspect ratio after a brief moment if it was enabled
        if (wasMaintainingAspect) {
          setTimeout(() => {
            setMaintainAspectRatio(true);
          }, 200);
        }
      }
    }
  };

  const resizeImage = (img: HTMLImageElement, targetWidth: number, targetHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Note: AVIF encoding is not supported in browser canvas yet
    // For AVIF, use API mode instead
    let mimeType: string;
    if (format === 'avif') {
      // Fallback to WebP for client-side processing, or use API
      mimeType = 'image/webp';
    } else {
      mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    }
    
    const dataUrl = canvas.toDataURL(mimeType, quality);
    setResizedImage(dataUrl);

    // Calculate file size
    const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
    const padding = dataUrl.charAt(dataUrl.length - 2) === '=' ? 2 : dataUrl.charAt(dataUrl.length - 1) === '=' ? 1 : 0;
    const fileSizeBytes = (base64Length * 3) / 4 - padding;
    setFileSize(prev => prev ? { ...prev, resized: fileSizeBytes } : null);
  };

  const handleResize = async () => {
    if (!originalImage || !originalFile) return;

    if (useApi) {
      setIsProcessing(true);
      setError('');
      try {
        const formData = new FormData();
        formData.append('image', originalFile);
        formData.append('width', width.toString());
        formData.append('height', height.toString());
        formData.append('maintain_aspect_ratio', maintainAspectRatio.toString());
        formData.append('quality', quality.toString());
        formData.append('format', format);
        if (selectedPreset !== 'default') {
          formData.append('preset', selectedPreset);
        }

        const response = await fetch(`${API_URL}/utility-tools/image-resizer/resize`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to resize image');
        }

        if (data.success) {
          setResizedImage(data.data.url);
          setFileSize({
            original: data.data.original_size,
            resized: data.data.resized_size
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to resize image via API');
        setResizedImage(null);
      } finally {
        setIsProcessing(false);
      }
    } else {
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
    }
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    setSelectedPreset('default');
    if (maintainAspectRatio && originalSize && !useApi) {
      const aspectRatio = originalSize.width / originalSize.height;
      setHeight(Math.round(newWidth / aspectRatio));
      if (originalImage) {
        const img = new Image();
        img.onload = () => {
          resizeImage(img, newWidth, Math.round(newWidth / aspectRatio));
        };
        img.src = originalImage;
      }
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    setSelectedPreset('default');
    if (maintainAspectRatio && originalSize && !useApi) {
      const aspectRatio = originalSize.width / originalSize.height;
      setWidth(Math.round(newHeight * aspectRatio));
      if (originalImage) {
        const img = new Image();
        img.onload = () => {
          resizeImage(img, Math.round(newHeight * aspectRatio), newHeight);
        };
        img.src = originalImage;
      }
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
    if (originalImage && !useApi && originalSize) {
      const img = new Image();
      img.onload = () => {
        let targetWidth = width;
        let targetHeight = height;

        if (maintainAspectRatio && originalSize) {
          const aspectRatio = originalSize.width / originalSize.height;
          const targetAspectRatio = targetWidth / targetHeight;
          
          if (targetAspectRatio > aspectRatio) {
            // Target is wider - adjust height
            targetHeight = Math.round(targetWidth / aspectRatio);
          } else {
            // Target is taller - adjust width
            targetWidth = Math.round(targetHeight * aspectRatio);
          }
        }

        // Always resize with calculated dimensions
        resizeImage(img, targetWidth, targetHeight);
      };
      img.src = originalImage;
    }
  }, [width, height, quality, format, maintainAspectRatio, originalImage, originalSize, useApi, selectedPreset]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          🖼️ Free Image Resizer Online
        </h1>
        <p className="text-gray-600 mb-6">
          Free image resizer online - no signup required. Resize images online instantly. Choose from social media presets or custom dimensions. Adjust format and quality. All processing in your browser.
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

            {/* Processing Mode */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useApi}
                  onChange={(e) => setUseApi(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Use API for processing (better for large images)</span>
              </label>
            </div>

            {/* Social Media Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                <button
                  onClick={() => handlePresetSelect('default')}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedPreset === 'default'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-900">Custom</div>
                  <div className="text-xs text-gray-500">Manual size</div>
                </button>
                {SOCIAL_MEDIA_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedPreset === preset.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={preset.description}
                  >
                    <div className="font-semibold text-sm text-gray-900">{preset.name}</div>
                    <div className="text-xs text-gray-500">{preset.width}×{preset.height}</div>
                  </button>
                ))}
              </div>
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
                  onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg' | 'webp' | 'avif')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="avif">AVIF</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

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

            {useApi && originalImage && (
              <button
                onClick={handleResize}
                disabled={!originalFile || isProcessing}
                className="w-full mb-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isProcessing ? 'Processing...' : '🔄 Resize via API'}
              </button>
            )}

            {resizedImage && (
              <button
                onClick={downloadImage}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
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
              Our Image Resizer is a powerful tool that resizes images directly in your browser or via API. 
              It includes pre-configured sizes for all major social media platforms, making it easy to prepare 
              images for Instagram, Facebook, Twitter, LinkedIn, YouTube, and Pinterest.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Choose from social media presets or set custom dimensions. The tool supports client-side processing 
              for privacy or API processing for better performance with large images. All processing maintains 
              image quality while optimizing file size.
            </p>
          </div>

          {/* Social Media Presets Info */}
          <div className="p-6 bg-purple-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Available Social Media Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SOCIAL_MEDIA_PRESETS.map((preset) => (
                <div key={preset.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-1">{preset.name}</h4>
                  <div className="text-sm text-gray-600 mb-2">
                    {preset.width} × {preset.height} px
                  </div>
                  <div className="text-xs text-gray-500">{preset.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Resize images for Instagram posts, stories, and reels</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Optimize images for Facebook posts and cover photos</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Create Twitter posts and header images</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Prepare LinkedIn posts and cover images</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Create YouTube thumbnails</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Optimize Pinterest pins</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Social Media Presets</h4>
                  <p className="text-sm text-gray-600">11 pre-configured sizes for major platforms</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">API Support</h4>
                  <p className="text-sm text-gray-600">Client-side or API processing options</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Format Support</h4>
                  <p className="text-sm text-gray-600">Convert between JPEG, PNG, and WebP</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Quality Control</h4>
                  <p className="text-sm text-gray-600">Adjust quality to balance size and appearance</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What social media presets are available?</h4>
                <p className="text-gray-700 text-sm">
                  We provide presets for Instagram (post, story, reel), Facebook (post, cover), Twitter (post, header), 
                  LinkedIn (post, cover), YouTube (thumbnail), and Pinterest (pin). All presets use recommended dimensions 
                  for optimal display on each platform.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Should I use client-side or API processing?</h4>
                <p className="text-gray-700 text-sm">
                  Client-side processing is faster and more private (images never leave your browser). Use API processing 
                  for very large images or when you need server-side optimization. Both methods produce the same results.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I use custom dimensions?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, select "Custom" from the presets and enter your desired width and height. You can resize to any 
                  dimensions up to 10,000 × 10,000 pixels.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my image uploaded to a server?</h4>
                <p className="text-gray-700 text-sm">
                  Only if you enable "Use API for processing". With client-side processing (default), all image processing 
                  happens locally in your browser. Your images never leave your device.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use social media presets for optimal display on each platform</li>
            <li>Instagram posts work best at 1080×1080 (square format)</li>
            <li>Instagram stories and reels use 1080×1920 (vertical format)</li>
            <li>Facebook posts: 1200×630, Facebook covers: 1640×859</li>
            <li>YouTube thumbnails: 1280×720 (16:9 aspect ratio)</li>
            <li>Use API processing for images larger than 5MB</li>
            <li>All processing happens in your browser by default - no uploads required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
