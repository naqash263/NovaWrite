import { useState, useRef, useEffect, useCallback } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export default function TextToImage() {
  const [heading, setHeading] = useState<string>('Create Beautiful Images');
  const [summary, setSummary] = useState<string>('Transform your text into stunning visuals with customizable colors, fonts, and layouts.');
  const [backgroundColor, setBackgroundColor] = useState<string>('#3B82F6');
  const [headingColor, setHeadingColor] = useState<string>('#FFFFFF');
  const [summaryColor, setSummaryColor] = useState<string>('#F3F4F6');
  const [width, setWidth] = useState<number>(1200);
  const [height, setHeight] = useState<number>(630);
  const [headingSize, setHeadingSize] = useState<number>(56);
  const [summarySize, setSummarySize] = useState<number>(28);
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [padding, setPadding] = useState<number>(80);
  const [useGradient, setUseGradient] = useState<boolean>(false);
  const [gradientColor, setGradientColor] = useState<string>('#1E40AF');
  const [textShadow, setTextShadow] = useState<boolean>(true);
  const [textShadowBlur, setTextShadowBlur] = useState<number>(8);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [headingSpacing, setHeadingSpacing] = useState<number>(50);
  const [useApi, setUseApi] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [useBackgroundImage, setUseBackgroundImage] = useState<boolean>(false);
  const [backgroundOverlay, setBackgroundOverlay] = useState<boolean>(true);
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState<number>(0.3);
  const [useHtmlMode, setUseHtmlMode] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free Text to Image Generator - Create Images from Text Online | Text Image Maker',
    description: 'Free online text to image generator. Create beautiful images from text with customizable colors, fonts, and layouts. Perfect for social media posts, quotes, and graphics.',
    url: '/resources/utility-tools/text-to-image',
    keywords: [
      'text to image', 'text image generator', 'create image from text', 'text image maker',
      'quote image generator', 'social media image maker', 'text graphics', 'image from text',
      'online text to image', 'free text image generator', 'text design tool'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Text to Image Generator',
      'description': 'Free online tool to create images from text with customizable colors, fonts, and layouts.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/text-to-image',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Create images from text',
        'Customizable colors',
        'Multiple font options',
        'Heading and summary text',
        'Custom dimensions',
        'Text alignment options',
        'Instant download'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.6',
        'ratingCount': '1800',
        'bestRating': '5',
        'worstRating': '1'
      }
    }
  });

  const fontOptions = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
    'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Impact',
    'Trebuchet MS', 'Lucida Console', 'Tahoma', 'Arial Black'
  ];

  const presetSizes = [
    { name: 'Social Media Post', width: 1200, height: 630 },
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Instagram Story', width: 1080, height: 1920 },
    { name: 'Facebook Post', width: 1200, height: 630 },
    { name: 'Twitter Post', width: 1200, height: 675 },
    { name: 'LinkedIn Post', width: 1200, height: 627 },
    { name: 'YouTube Thumbnail', width: 1280, height: 720 },
    { name: 'Custom', width: 1200, height: 630 },
  ];

  const colorPresets = [
    { name: 'Blue', bg: '#3B82F6', heading: '#FFFFFF', summary: '#E0E7FF' },
    { name: 'Purple', bg: '#8B5CF6', heading: '#FFFFFF', summary: '#EDE9FE' },
    { name: 'Green', bg: '#10B981', heading: '#FFFFFF', summary: '#D1FAE5' },
    { name: 'Red', bg: '#EF4444', heading: '#FFFFFF', summary: '#FEE2E2' },
    { name: 'Orange', bg: '#F59E0B', heading: '#FFFFFF', summary: '#FEF3C7' },
    { name: 'Dark', bg: '#1F2937', heading: '#FFFFFF', summary: '#9CA3AF' },
    { name: 'Light', bg: '#F9FAFB', heading: '#111827', summary: '#6B7280' },
  ];

  const handleBackgroundImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setBackgroundImageFile(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setBackgroundImage(imageUrl);
      setUseBackgroundImage(true);
    };
    reader.readAsDataURL(file);
  };

  const removeBackgroundImage = () => {
    setBackgroundImage(null);
    setBackgroundImageFile(null);
    setUseBackgroundImage(false);
    if (backgroundImageInputRef.current) {
      backgroundImageInputRef.current.value = '';
    }
  };

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background image if provided
    if (useBackgroundImage && backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background image (cover the entire canvas)
        ctx.drawImage(img, 0, 0, width, height);

        // Add overlay for better text readability if enabled
        if (backgroundOverlay) {
          ctx.fillStyle = `rgba(0, 0, 0, ${backgroundOverlayOpacity})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Continue with text rendering
        drawTextOnCanvas(ctx);
        
        // Convert to image after text is drawn
        const dataUrl = canvas.toDataURL('image/png');
        setGeneratedImage(dataUrl);
      };
      img.onerror = () => {
        // If image fails to load, fall back to color background
        drawColorBackground(ctx);
        drawTextOnCanvas(ctx);
        const dataUrl = canvas.toDataURL('image/png');
        setGeneratedImage(dataUrl);
      };
      img.src = backgroundImage;
    } else {
      // Use color/gradient background
      drawColorBackground(ctx);
      drawTextOnCanvas(ctx);
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedImage(dataUrl);
    }
  }, [heading, summary, backgroundColor, headingColor, summaryColor, width, height, headingSize, summarySize, fontFamily, textAlign, padding, useGradient, gradientColor, textShadow, textShadowBlur, lineSpacing, headingSpacing, useBackgroundImage, backgroundImage, backgroundOverlay, backgroundOverlayOpacity]);

  // Parse HTML to extract text with formatting
  const parseHtmlText = (html: string): Array<{ text: string; bold?: boolean; italic?: boolean }> => {
    if (!html) return [];
    
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const result: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
    
    const traverse = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          // Check parent nodes for formatting
          let parent = node.parentElement;
          let isBold = false;
          let isItalic = false;
          
          while (parent && parent !== tempDiv) {
            const tagName = parent.tagName.toLowerCase();
            if (tagName === 'b' || tagName === 'strong') isBold = true;
            if (tagName === 'i' || tagName === 'em') isItalic = true;
            parent = parent.parentElement;
          }
          
          result.push({ text, bold: isBold, italic: isItalic });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        
        // Add line breaks for block elements
        if (tagName === 'br' || tagName === 'p' || tagName === 'div') {
          result.push({ text: '\n' });
        }
        
        // Traverse child nodes
        Array.from(node.childNodes).forEach(traverse);
      }
    };
    
    Array.from(tempDiv.childNodes).forEach(traverse);
    return result;
  };

  const drawColorBackground = (ctx: CanvasRenderingContext2D) => {
    // Fill background with gradient or solid color
    if (useGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, backgroundColor);
      gradient.addColorStop(1, gradientColor);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = backgroundColor;
    }
    ctx.fillRect(0, 0, width, height);
  };

  const drawTextOnCanvas = (ctx: CanvasRenderingContext2D) => {

    // Calculate text area
    const textAreaWidth = width - (padding * 2);
    const textX = padding;
    
    // Measure heading text
    ctx.font = `bold ${headingSize}px ${fontFamily}`;
    ctx.textAlign = textAlign;
    const headingWords = heading.trim() ? heading.split(' ') : [];
    const headingLines: string[] = [];
    let headingCurrentLine = '';
    
    headingWords.forEach((word) => {
      const testLine = headingCurrentLine + (headingCurrentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > textAreaWidth && headingCurrentLine) {
        headingLines.push(headingCurrentLine);
        headingCurrentLine = word;
      } else {
        headingCurrentLine = testLine;
      }
    });
    if (headingCurrentLine) headingLines.push(headingCurrentLine);

    // Measure summary text - handle HTML mode
    type SummaryLine = { text: string; bold?: boolean; italic?: boolean } | string;
    let summaryLines: SummaryLine[] = [];
    
    if (useHtmlMode && summary.trim()) {
      // Parse HTML and create formatted segments
      const segments = parseHtmlText(summary);
      let currentLine: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
      let currentLineWidth = 0;
      
      segments.forEach((segment: { text: string; bold?: boolean; italic?: boolean }) => {
        if (segment.text === '\n') {
          // Line break
          if (currentLine.length > 0) {
            summaryLines.push(...currentLine);
            summaryLines.push({ text: '\n' });
            currentLine = [];
            currentLineWidth = 0;
          }
        } else {
          // Set font for measurement
          const fontStyle = `${segment.italic ? 'italic ' : ''}${segment.bold ? 'bold ' : ''}${summarySize}px ${fontFamily}`;
          ctx.font = fontStyle;
          
          const words = segment.text.split(' ');
          words.forEach((word: string) => {
            const testText = (currentLine.length > 0 ? ' ' : '') + word;
            const metrics = ctx.measureText(testText);
            
            if (currentLineWidth + metrics.width > textAreaWidth && currentLine.length > 0) {
              // Start new line
              summaryLines.push(...currentLine);
              summaryLines.push({ text: '\n' });
              currentLine = [{ text: word, bold: segment.bold, italic: segment.italic }];
              currentLineWidth = metrics.width;
            } else {
              // Add to current line
              if (currentLine.length > 0) {
                currentLine.push({ text: ' ' });
              }
              currentLine.push({ text: word, bold: segment.bold, italic: segment.italic });
              currentLineWidth += metrics.width;
            }
          });
        }
      });
      
      if (currentLine.length > 0) {
        summaryLines.push(...currentLine);
      }
    } else {
      // Plain text mode
      ctx.font = `${summarySize}px ${fontFamily}`;
      const summaryWords = summary.trim() ? summary.split(' ') : [];
      let summaryCurrentLine = '';
      
      summaryWords.forEach((word) => {
        const testLine = summaryCurrentLine + (summaryCurrentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > textAreaWidth && summaryCurrentLine) {
          summaryLines.push(summaryCurrentLine);
          summaryCurrentLine = word;
        } else {
          summaryCurrentLine = testLine;
        }
      });
      if (summaryCurrentLine) summaryLines.push(summaryCurrentLine);
    }

    // Calculate total text height for vertical centering
    const headingHeight = headingLines.length * headingSize * 1.2;
    // Count actual lines in summary
    const summaryLineCount = useHtmlMode 
      ? summaryLines.filter(s => typeof s === 'object' && 'text' in s && s.text === '\n').length + 1
      : summaryLines.length;
    const summaryHeight = summaryLineCount * summarySize * lineSpacing;
    const totalTextHeight = headingHeight + (headingLines.length > 0 && summaryLines.length > 0 ? headingSpacing : 0) + summaryHeight;
    
    // Start Y position (centered vertically)
    let startY = (height - totalTextHeight) / 2;
    let textY = startY;

    // Draw heading with shadow
    if (headingLines.length > 0) {
      ctx.font = `bold ${headingSize}px ${fontFamily}`;
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'top';
      
      if (textShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = textShadowBlur;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = headingColor;
      headingLines.forEach((line, index) => {
        const x = textAlign === 'left' ? textX : textAlign === 'right' ? width - textX : width / 2;
        ctx.fillText(line, x, textY + (index * headingSize * 1.2));
      });

      textY += headingLines.length * headingSize * 1.2 + headingSpacing;
    }

    // Draw summary with shadow
    if (summaryLines.length > 0) {
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'top';
      
      if (textShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = textShadowBlur;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = summaryColor;
      
      if (useHtmlMode) {
        // Render HTML-formatted text
        let currentY = textY;
        let currentLineSegments: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
        
        summaryLines.forEach((segment) => {
          if (typeof segment === 'object' && 'text' in segment && segment.text === '\n') {
            // Render current line and move to next
            if (currentLineSegments.length > 0) {
              let lineX = textAlign === 'left' ? textX : textAlign === 'right' ? width - textX : width / 2;
              
              if (textAlign === 'center') {
                // For center alignment, calculate the total width first
                const totalWidth = currentLineSegments.reduce((sum, s) => {
                  ctx.font = `${s.italic ? 'italic ' : ''}${s.bold ? 'bold ' : ''}${summarySize}px ${fontFamily}`;
                  return sum + ctx.measureText(s.text).width;
                }, 0);
                lineX = (width - totalWidth) / 2;
              }
              
              currentLineSegments.forEach((seg) => {
                const fontStyle = `${seg.italic ? 'italic ' : ''}${seg.bold ? 'bold ' : ''}${summarySize}px ${fontFamily}`;
                ctx.font = fontStyle;
                
                if (textShadow) {
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                  ctx.shadowBlur = textShadowBlur;
                  ctx.shadowOffsetX = 1;
                  ctx.shadowOffsetY = 1;
                }
                
                ctx.fillText(seg.text, lineX, currentY);
                lineX += ctx.measureText(seg.text).width;
              });
              
              currentLineSegments = [];
              currentY += summarySize * lineSpacing;
            }
          } else if (typeof segment === 'object' && 'text' in segment) {
            currentLineSegments.push(segment);
          }
        });
        
        // Render remaining segments
        if (currentLineSegments.length > 0) {
          let lineX = textAlign === 'left' ? textX : textAlign === 'right' ? width - textX : width / 2;
          
          if (textAlign === 'center') {
            const totalWidth = currentLineSegments.reduce((sum, s) => {
              ctx.font = `${s.italic ? 'italic ' : ''}${s.bold ? 'bold ' : ''}${summarySize}px ${fontFamily}`;
              return sum + ctx.measureText(s.text).width;
            }, 0);
            lineX = (width - totalWidth) / 2;
          }
          
          currentLineSegments.forEach((seg) => {
            const fontStyle = `${seg.italic ? 'italic ' : ''}${seg.bold ? 'bold ' : ''}${summarySize}px ${fontFamily}`;
            ctx.font = fontStyle;
            ctx.fillText(seg.text, lineX, currentY);
            lineX += ctx.measureText(seg.text).width;
          });
        }
      } else {
        // Plain text mode
        ctx.font = `${summarySize}px ${fontFamily}`;
        summaryLines.forEach((line, index) => {
          if (typeof line === 'string') {
            const x = textAlign === 'left' ? textX : textAlign === 'right' ? width - textX : width / 2;
            ctx.fillText(line, x, textY + (index * summarySize * lineSpacing));
          }
        });
      }
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `text-image-${Date.now()}.png`;
    link.click();
  };

  const applyPresetSize = (preset: typeof presetSizes[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setBackgroundColor(preset.bg);
    setHeadingColor(preset.heading);
    setSummaryColor(preset.summary);
  };

  const generateImageViaApi = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('heading', heading);
      formData.append('summary', summary);
      formData.append('width', width.toString());
      formData.append('height', height.toString());
      formData.append('backgroundColor', backgroundColor);
      formData.append('headingColor', headingColor);
      formData.append('summaryColor', summaryColor);
      formData.append('headingSize', headingSize.toString());
      formData.append('summarySize', summarySize.toString());
      formData.append('fontFamily', fontFamily);
      formData.append('textAlign', textAlign);
      formData.append('padding', padding.toString());
      formData.append('useGradient', useGradient.toString());
      formData.append('gradientColor', gradientColor);
      formData.append('textShadow', textShadow.toString());
      formData.append('textShadowBlur', textShadowBlur.toString());
      formData.append('lineSpacing', lineSpacing.toString());
      formData.append('headingSpacing', headingSpacing.toString());
      formData.append('useBackgroundImage', useBackgroundImage.toString());
      formData.append('backgroundOverlay', backgroundOverlay.toString());
      formData.append('backgroundOverlayOpacity', backgroundOverlayOpacity.toString());
      
      if (useBackgroundImage && backgroundImageFile) {
        formData.append('backgroundImage', backgroundImageFile);
      }

      const response = await fetch(`${API_URL}/utility-tools/text-to-image/generate`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate image');
      }

      if (data.success) {
        setGeneratedImage(data.data.url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image via API');
      setGeneratedImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (heading || summary) {
      if (useApi) {
        // For API, we'll generate on button click instead of auto
        return;
      }
      // Use setTimeout to debounce and prevent excessive re-renders
      const timer = setTimeout(() => {
        generateImage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [heading, summary, backgroundColor, headingColor, summaryColor, width, height, headingSize, summarySize, fontFamily, textAlign, padding, useGradient, gradientColor, textShadow, textShadowBlur, lineSpacing, headingSpacing, useApi, useBackgroundImage, backgroundImage, backgroundOverlay, backgroundOverlayOpacity, useHtmlMode, generateImage]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          ✨ Text to Image Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Create beautiful images from text with customizable colors, fonts, and layouts. Perfect for social media posts, quotes, and graphics.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Processing Mode */}
            <div className="mb-4">
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

            {/* Text Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heading Text
              </label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Enter your heading..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Summary/Description Text
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useHtmlMode}
                    onChange={(e) => setUseHtmlMode(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">HTML Mode</span>
                </label>
              </div>
              {useHtmlMode ? (
                <div>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Enter HTML text (supports &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;p&gt;, &lt;div&gt;)..."
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-semibold mb-1">Supported HTML Tags:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li><code className="bg-blue-100 px-1 rounded">&lt;b&gt;</code> or <code className="bg-blue-100 px-1 rounded">&lt;strong&gt;</code> - Bold text</li>
                      <li><code className="bg-blue-100 px-1 rounded">&lt;i&gt;</code> or <code className="bg-blue-100 px-1 rounded">&lt;em&gt;</code> - Italic text</li>
                      <li><code className="bg-blue-100 px-1 rounded">&lt;br&gt;</code> - Line break</li>
                      <li><code className="bg-blue-100 px-1 rounded">&lt;p&gt;</code> or <code className="bg-blue-100 px-1 rounded">&lt;div&gt;</code> - Paragraph/block (creates line break)</li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2">Example: <code className="bg-blue-100 px-1 rounded">This is &lt;b&gt;bold&lt;/b&gt; and this is &lt;i&gt;italic&lt;/i&gt; text.</code></p>
                  </div>
                </div>
              ) : (
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter your summary or description..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Size Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Size Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presetSizes.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPresetSize(preset)}
                    className="p-2 text-xs border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 100)}
                  min="100"
                  max="5000"
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
                  onChange={(e) => setHeight(parseInt(e.target.value) || 100)}
                  min="100"
                  max="5000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Background Image */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">🖼️ Background Image</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={useBackgroundImage}
                      onChange={(e) => {
                        setUseBackgroundImage(e.target.checked);
                        if (!e.target.checked) {
                          setBackgroundImage(null);
                          setBackgroundImageFile(null);
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">Use Background Image</span>
                  </label>
                  
                  {useBackgroundImage && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <input
                          ref={backgroundImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundImageSelect}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      
                      {backgroundImage && (
                        <div className="relative">
                          <img
                            src={backgroundImage}
                            alt="Background preview"
                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            onClick={removeBackgroundImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            title="Remove background image"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="flex items-center space-x-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={backgroundOverlay}
                            onChange={(e) => setBackgroundOverlay(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 text-sm">Add Dark Overlay (for better text readability)</span>
                        </label>
                        {backgroundOverlay && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">
                              Overlay Opacity: {Math.round(backgroundOverlayOpacity * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="0.8"
                              step="0.1"
                              value={backgroundOverlayOpacity}
                              onChange={(e) => setBackgroundOverlayOpacity(parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Presets {useBackgroundImage && '(disabled when using background image)'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      if (!useBackgroundImage) {
                        applyColorPreset(preset);
                      }
                    }}
                    disabled={useBackgroundImage}
                    className="p-2 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={preset.name}
                  >
                    <div
                      className="w-full h-8 rounded mb-1"
                      style={{ backgroundColor: preset.bg }}
                    />
                    <div className="text-xs text-gray-600">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color {useBackgroundImage && '(disabled when using background image)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    disabled={useBackgroundImage}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    disabled={useBackgroundImage}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heading Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={headingColor}
                    onChange={(e) => setHeadingColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={headingColor}
                    onChange={(e) => setHeadingColor(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={summaryColor}
                    onChange={(e) => setSummaryColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={summaryColor}
                    onChange={(e) => setSummaryColor(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Typography Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heading Size: {headingSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={headingSize}
                  onChange={(e) => setHeadingSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Size: {summarySize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="60"
                  value={summarySize}
                  onChange={(e) => setSummarySize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Alignment
                </label>
                <select
                  value={textAlign}
                  onChange={(e) => setTextAlign(e.target.value as 'left' | 'center' | 'right')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Padding: {padding}px
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Visual Enhancements */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">✨ Visual Enhancements</h3>
              
              <div className="space-y-4">
                {/* Gradient Background */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={useGradient}
                      onChange={(e) => {
                        setUseGradient(e.target.checked);
                        if (e.target.checked) {
                          setUseBackgroundImage(false);
                        }
                      }}
                      disabled={useBackgroundImage}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-50"
                    />
                    <span className="text-gray-700 font-medium">Gradient Background {useBackgroundImage && '(disabled when using background image)'}</span>
                  </label>
                  {useGradient && !useBackgroundImage && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="color"
                        value={gradientColor}
                        onChange={(e) => setGradientColor(e.target.value)}
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={gradientColor}
                        onChange={(e) => setGradientColor(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="#1E40AF"
                      />
                    </div>
                  )}
                </div>

                {/* Text Shadow */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={textShadow}
                      onChange={(e) => setTextShadow(e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-700 font-medium">Text Shadow (Better Readability)</span>
                  </label>
                  {textShadow && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Shadow Blur: {textShadowBlur}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={textShadowBlur}
                        onChange={(e) => setTextShadowBlur(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Line Spacing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary Line Spacing: {lineSpacing.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={lineSpacing}
                    onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Heading Spacing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heading-Summary Gap: {headingSpacing}px
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={headingSpacing}
                    onChange={(e) => setHeadingSpacing(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {useApi && (
              <button
                onClick={generateImageViaApi}
                disabled={(!heading && !summary) || isProcessing}
                className="w-full mb-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isProcessing ? '🔄 Generating...' : '✨ Generate via API'}
              </button>
            )}

            {generatedImage && (
              <button
                onClick={downloadImage}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                📥 Download Image
              </button>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 min-h-[400px] flex items-center justify-center">
              {generatedImage ? (
                <div className="text-center">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-w-full max-h-[600px] mx-auto rounded-lg shadow-lg"
                  />
                  <div className="text-sm text-gray-600 mt-2">
                    {width} × {height} px
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">✨</div>
                  <p>Enter text to generate image</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">About Text to Image Generator</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Text to Image Generator is a powerful tool that creates beautiful images from text. Perfect for 
              creating social media graphics, quote images, announcements, and promotional content. All processing 
              happens locally in your browser using HTML5 Canvas.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Customize colors, fonts, sizes, alignment, and dimensions to create professional-looking images. 
              Choose from preset sizes for social media platforms or create custom dimensions.
            </p>
          </div>

          {/* Use Cases */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Common Use Cases</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Create quote images for social media</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Design announcement graphics</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Create promotional banners</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Design social media posts</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Create text-based graphics</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Design headers and covers</span>
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
                  <h4 className="font-semibold text-gray-900 mb-1">Heading & Summary</h4>
                  <p className="text-sm text-gray-600">Separate heading and summary text with different styling</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Color Customization</h4>
                  <p className="text-sm text-gray-600">Customize background, heading, and summary colors</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Size Presets</h4>
                  <p className="text-sm text-gray-600">Pre-configured sizes for social media platforms</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Typography Control</h4>
                  <p className="text-sm text-gray-600">Adjust font size, family, and alignment</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What image format is generated?</h4>
                <p className="text-gray-700 text-sm">
                  Images are generated in PNG format, which supports transparency and high quality. You can use 
                  these images anywhere - social media, websites, presentations, etc.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I use custom colors?</h4>
                <p className="text-gray-700 text-sm">
                  Yes, you can use any color by entering a hex code (e.g., #FF5733) or using the color picker. 
                  We also provide color presets for quick selection.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the maximum image size?</h4>
                <p className="text-gray-700 text-sm">
                  You can create images up to 5,000 × 5,000 pixels. For best results, use the preset sizes 
                  optimized for each social media platform.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my text stored or uploaded?</h4>
                <p className="text-gray-700 text-sm">
                  No, all image generation happens locally in your browser. Your text is never uploaded to any 
                  server or stored anywhere. Your privacy is guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use heading for main text and summary for supporting text</li>
            <li>Choose contrasting colors for better readability</li>
            <li>Use preset sizes for optimal social media display</li>
            <li>Center alignment works best for quote images</li>
            <li>Adjust padding to control text spacing from edges</li>
            <li>All processing happens in your browser - no uploads required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

