import { useState } from 'react';

export default function ColorConverter() {
  const [hexColor, setHexColor] = useState<string>('#000000');
  const [rgbColor, setRgbColor] = useState<{ r: number; g: number; b: number }>({ r: 0, g: 0, b: 0 });
  const [hslColor, setHslColor] = useState<{ h: number; s: number; l: number }>({ h: 0, s: 0, l: 0 });

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
    let h = 0, s = 0;
    const l = (max + min) / 2;

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

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  const handleHexChange = (hex: string) => {
    setHexColor(hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      setRgbColor(rgb);
      setHslColor(rgbToHsl(rgb.r, rgb.g, rgb.b));
    }
  };

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgbColor, [component]: Math.max(0, Math.min(255, value)) };
    setRgbColor(newRgb);
    setHexColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHslColor(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (component: 'h' | 's' | 'l', value: number) => {
    const newHsl = { ...hslColor, [component]: Math.max(0, Math.min(component === 'h' ? 360 : 100, value)) };
    setHslColor(newHsl);
    const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgbColor(rgb);
    setHexColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Color Preview */}
      <div className="bg-gray-100 rounded-lg p-4 sm:p-8 flex items-center justify-center">
        <div
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg shadow-lg border-4 border-white"
          style={{ backgroundColor: hexColor }}
        />
      </div>

      {/* HEX Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">HEX Color</label>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="color"
            value={hexColor}
            onChange={(e) => handleHexChange(e.target.value)}
            className="w-full sm:w-20 h-12 border border-gray-300 rounded-lg cursor-pointer touch-manipulation"
          />
          <input
            type="text"
            value={hexColor}
            onChange={(e) => handleHexChange(e.target.value)}
            className="flex-1 min-w-0 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm sm:text-base"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* RGB Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">RGB Color</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Red (0-255)</label>
            <input
              type="number"
              value={rgbColor.r}
              onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="255"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Green (0-255)</label>
            <input
              type="number"
              value={rgbColor.g}
              onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="255"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Blue (0-255)</label>
            <input
              type="number"
              value={rgbColor.b}
              onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="255"
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 font-mono">
          rgb({rgbColor.r}, {rgbColor.g}, {rgbColor.b})
        </p>
      </div>

      {/* HSL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">HSL Color</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hue (0-360)</label>
            <input
              type="number"
              value={hslColor.h}
              onChange={(e) => handleHslChange('h', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="360"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Saturation (0-100)</label>
            <input
              type="number"
              value={hslColor.s}
              onChange={(e) => handleHslChange('s', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Lightness (0-100)</label>
            <input
              type="number"
              value={hslColor.l}
              onChange={(e) => handleHslChange('l', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 font-mono">
          hsl({hslColor.h}, {hslColor.s}%, {hslColor.l}%)
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Color Format Reference</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>HEX:</strong> #RRGGBB format (e.g., #FF0000 for red)</li>
          <li>• <strong>RGB:</strong> Red, Green, Blue values from 0-255</li>
          <li>• <strong>HSL:</strong> Hue (0-360), Saturation (0-100%), Lightness (0-100%)</li>
        </ul>
      </div>

      {/* SEO & AI-Friendly Content */}
      <div className="mt-8 space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About Color Conversion</h3>
          <p className="text-gray-700 mb-4">
            Color conversion is essential for web design, graphic design, digital art, and CSS styling. Different color formats serve 
            different purposes: HEX for web colors, RGB for digital displays, and HSL for intuitive color manipulation.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Color Formats:</strong> HEX (#RRGGBB) is standard for CSS and HTML. RGB (Red, Green, Blue) represents colors 
            as additive light. HSL (Hue, Saturation, Lightness) provides intuitive color control, making it easier to create color 
            variations and palettes.
          </p>
          <p className="text-gray-700">
            <strong>Use Cases:</strong> Web development, CSS styling, graphic design, digital art, UI/UX design, brand color management, 
            and creating color palettes. Our converter includes a live color preview to see your colors instantly.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How do I convert RGB to HEX?</h4>
              <p className="text-sm text-gray-600">
                Convert each RGB component (0-255) to hexadecimal (00-FF), then combine with a # prefix. For example, RGB(255, 0, 0) = #FF0000. 
                Our converter does this automatically - just enter RGB values and see the HEX result.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">What is the difference between RGB and HSL?</h4>
              <p className="text-sm text-gray-600">
                RGB represents colors as red, green, and blue light values. HSL represents colors as hue (color type), saturation (intensity), 
                and lightness (brightness). HSL is more intuitive for creating color variations - adjusting lightness creates shades/tints easily.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Can I use the color picker to select colors?</h4>
              <p className="text-sm text-gray-600">
                Yes! Click the color box in the HEX section to open a visual color picker. Select any color and see it converted to RGB and HSL 
                formats instantly. This is perfect for finding colors visually.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

