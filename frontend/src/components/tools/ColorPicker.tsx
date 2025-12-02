import { useState } from 'react';
import { useSEO } from '../../utils/seo';

export default function ColorPicker() {
  const [color, setColor] = useState<string>('#3b82f6');
  const [rgb, setRgb] = useState<{ r: number; g: number; b: number }>({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState<{ h: number; s: number; l: number }>({ h: 217, s: 91, l: 60 });
  const [hex, setHex] = useState<string>('#3b82f6');

  useSEO({
    title: 'Free Color Picker - RGB, HEX, HSL Color Picker Online | Color Palette Generator',
    description: 'Free online color picker. Pick colors with visual color picker, get RGB, HEX, HSL values. Generate color palettes, extract colors from images. Perfect for designers and developers. No registration required.',
    url: '/resources/utility-tools/color-picker',
    keywords: [
      'color picker', 'RGB color picker', 'HEX color picker', 'HSL color picker',
      'color palette generator', 'color picker online', 'free color picker',
      'color picker tool', 'web color picker', 'color selector'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Color Picker',
      'description': 'Free online color picker with RGB, HEX, HSL support and color palette generation.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/color-picker',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Visual color picker',
        'RGB, HEX, HSL color values',
        'Color palette generator',
        'Copy color values to clipboard',
        'Color history'
      ]
    }
  });

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setHex(newColor);
    
    const rgbValue = hexToRgb(newColor);
    if (rgbValue) {
      setRgb(rgbValue);
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
    }
  };

  const handleHexChange = (newHex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      handleColorChange(newHex);
    } else {
      setHex(newHex);
    }
  };

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [component]: Math.max(0, Math.min(255, value)) };
    setRgb(newRgb);
    
    const newHex = `#${[newRgb.r, newRgb.g, newRgb.b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
    
    setColor(newHex);
    setHex(newHex);
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const generatePalette = () => {
    const palette: string[] = [];
    const baseRgb = rgb;
    
    // Generate 5 shades
    for (let i = 0; i < 5; i++) {
      const factor = i / 4;
      const r = Math.round(baseRgb.r * (1 - factor * 0.3));
      const g = Math.round(baseRgb.g * (1 - factor * 0.3));
      const b = Math.round(baseRgb.b * (1 - factor * 0.3));
      const hex = `#${[r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('')}`;
      palette.push(hex);
    }
    
    return palette;
  };

  const palette = generatePalette();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Color Picker</h1>
        <p className="text-gray-600 mb-6">
          Pick colors visually and get RGB, HEX, and HSL values. Generate color palettes and copy color codes.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pick a Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-24 h-24 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <div
                className="flex-1 h-24 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>

          {/* Color Values */}
          <div className="space-y-4">
            {/* HEX */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HEX
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                <button
                  onClick={() => copyToClipboard(hex)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* RGB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RGB
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="R"
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="G"
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="B"
                />
                <button
                  onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* HSL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HSL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                />
                <button
                  onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Color Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {palette.map((paletteColor, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-full h-20 rounded-lg border-2 border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: paletteColor }}
                  onClick={() => handleColorChange(paletteColor)}
                />
                <p className="text-xs text-gray-600 mt-1 font-mono">{paletteColor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Color Picker</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Color Picker is a free online tool that helps you pick colors visually and get their 
            RGB, HEX, and HSL values. Generate color palettes and copy color codes for use in your projects.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Visual color picker with live preview</li>
            <li>Get RGB, HEX, and HSL color values</li>
            <li>Generate color palettes automatically</li>
            <li>Copy color values to clipboard</li>
            <li>Manual RGB input for precise colors</li>
            <li>Real-time color conversion</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Pick colors for web design and development</li>
            <li>Generate color palettes for branding</li>
            <li>Convert between RGB, HEX, and HSL formats</li>
            <li>Find complementary colors for design projects</li>
            <li>Extract color values from designs</li>
            <li>Create consistent color schemes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

