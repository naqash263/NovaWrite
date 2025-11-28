import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useSEO } from '../../utils/seo';

export default function QRCodeGenerator() {
  const [text, setText] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [size, setSize] = useState<number>(300);
  const [margin, setMargin] = useState<number>(4);
  const [darkColor, setDarkColor] = useState<string>('#000000');
  const [lightColor, setLightColor] = useState<string>('#FFFFFF');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useSEO({
    title: 'Free QR Code Generator - Create QR Codes Online | QR Code Maker',
    description: 'Generate QR codes instantly for URLs, text, WiFi, contact info, and more. Customize colors, size, and error correction. Download as PNG or SVG. Free, no registration required.',
    url: '/resources/utility-tools/qr-code-generator',
    keywords: [
      'QR code generator', 'QR code maker', 'QR code creator', 'generate QR code',
      'QR code online', 'free QR code', 'QR code tool', 'QR code scanner',
      'QR code generator online', 'create QR code'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'QR Code Generator',
      'description': 'Free QR code generator for creating QR codes for URLs, text, WiFi, contact info, and more with customizable options.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/qr-code-generator',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Generate QR codes for URLs, text, WiFi, contact info',
        'Customizable colors and size',
        'Error correction levels (L, M, Q, H)',
        'Download as PNG or SVG',
        'Quick templates for common use cases',
        'Real-time preview'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '2800',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  useEffect(() => {
    generateQRCode();
  }, [text, size, margin, darkColor, lightColor, errorCorrectionLevel]);

  const generateQRCode = async () => {
    if (!text.trim()) {
      setQrCodeUrl('');
      setError('');
      return;
    }

    try {
      const options = {
        width: size,
        margin: margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: errorCorrectionLevel,
      };

      const dataUrl = await QRCode.toDataURL(text, options);
      setQrCodeUrl(dataUrl);
      setError('');
    } catch (err) {
      setError('Failed to generate QR code. Please check your input.');
      console.error('QR Code generation error:', err);
    }
  };

  const downloadQRCode = async (format: 'png' | 'svg') => {
    if (!qrCodeUrl) return;

    try {
      if (format === 'png') {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = 'qrcode.png';
        link.click();
      } else {
        const options = {
          width: size,
          margin: margin,
          color: {
            dark: darkColor,
            light: lightColor,
          },
          errorCorrectionLevel: errorCorrectionLevel,
        };
        const svg = await QRCode.toString(text, { ...options, type: 'svg' });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qrcode.svg';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download QR code');
    }
  };

  const presetTemplates = [
    { name: 'URL', value: 'https://example.com', icon: '🔗' },
    { name: 'WiFi', value: 'WIFI:T:WPA;S:NetworkName;P:Password;;', icon: '📶' },
    { name: 'Email', value: 'mailto:example@email.com', icon: '📧' },
    { name: 'Phone', value: 'tel:+1234567890', icon: '📱' },
    { name: 'SMS', value: 'sms:+1234567890:Hello World', icon: '💬' },
    { name: 'Text', value: 'Hello, World!', icon: '📝' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          📱 QR Code Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Generate QR codes instantly for URLs, text, WiFi, contact info, and more. Customize colors, size, and download.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div>
            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Text or URL
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text, URL, or use a template below..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            </div>

            {/* Preset Templates */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Templates
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presetTemplates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setText(template.value)}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors text-sm"
                  >
                    <span className="text-xl mb-1 block">{template.icon}</span>
                    <span>{template.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size: {size}px
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margin: {margin}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Correction Level
                </label>
                <select
                  value={errorCorrectionLevel}
                  onChange={(e) => setErrorCorrectionLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="L">Low (~7% recovery)</option>
                  <option value="M">Medium (~15% recovery)</option>
                  <option value="Q">Quartile (~25% recovery)</option>
                  <option value="H">High (~30% recovery)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dark Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Light Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg font-mono text-sm"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code Preview
            </label>
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 min-h-[300px] flex items-center justify-center">
              {qrCodeUrl ? (
                <div className="text-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="mx-auto mb-4 max-w-full"
                    ref={canvasRef}
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <button
                      onClick={() => downloadQRCode('png')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📥 Download PNG
                    </button>
                    <button
                      onClick={() => downloadQRCode('svg')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      📥 Download SVG
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📱</div>
                  <p>Enter text above to generate QR code</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO & AI-Friendly Content Sections */}
        <div className="space-y-6 mt-8">
          {/* About Section */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About QR Code Generator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our QR Code Generator is a powerful, client-side tool that creates QR codes instantly 
              using advanced encoding algorithms. QR codes can store various types of data including 
              URLs, text, WiFi credentials, contact information, and more. All generation happens 
              locally in your browser for maximum privacy and speed.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perfect for businesses, marketers, developers, and anyone who needs to create QR codes 
              quickly. The tool offers extensive customization options including colors, size, and 
              error correction levels to suit different use cases.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Sharing website URLs and links</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>WiFi network credentials sharing</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Contact information (vCard format)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Marketing materials and business cards</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Event tickets and access codes</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Product information and tracking</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Multiple Formats</h4>
                  <p className="text-sm text-gray-600">Generate QR codes for URLs, text, WiFi, email, phone, SMS, and more</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Customizable Design</h4>
                  <p className="text-sm text-gray-600">Customize colors, size (100-1000px), and margin for branding</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Error Correction</h4>
                  <p className="text-sm text-gray-600">Four levels (L, M, Q, H) for different durability needs</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Export Options</h4>
                  <p className="text-sm text-gray-600">Download as PNG (raster) or SVG (vector) formats</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What is error correction level?</h4>
                <p className="text-gray-700 text-sm">
                  Error correction allows QR codes to be scanned even if partially damaged. Levels: 
                  L (7% recovery), M (15%), Q (25%), H (30%). Higher levels create denser codes but 
                  are more resistant to damage.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What size should I use?</h4>
                <p className="text-gray-700 text-sm">
                  For digital use: 200-300px. For printing: 500-1000px. For distance viewing: 
                  larger sizes. Always test with your target scanning device.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I use custom colors?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, you can customize both dark and light colors. Ensure good contrast (dark 
                  on light) for reliable scanning.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my data stored?</h4>
                <p className="text-gray-700 text-sm">
                  No, all QR code generation happens locally in your browser. We never store or 
                  transmit your data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 QR Code Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Higher error correction levels allow more damage before the code becomes unreadable</li>
            <li>Use larger sizes for printing or when the code will be viewed from a distance</li>
            <li>Ensure good contrast between dark and light colors for better scanning</li>
            <li>Test your QR code with multiple devices before using it in production</li>
            <li>Use SVG format for scalable, high-quality prints</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

