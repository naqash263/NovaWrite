import { useState, useRef, useEffect, useCallback } from 'react';

const clampSize = (n: number) => Math.min(5000, Math.max(100, Math.round(n) || 100));

export default function TextToImage() {
  const [heading, setHeading] = useState<string>('Create Beautiful Images');
  const [summary, setSummary] = useState<string>('Transform your text into stunning visuals with customizable colors, fonts, and layouts.');
  const [backgroundColor, setBackgroundColor] = useState<string>('#3B82F6');
  const [headingColor, setHeadingColor] = useState<string>('#FFFFFF');
  const [summaryColor, setSummaryColor] = useState<string>('#F3F4F6');
  const [rawWidth, setWidth] = useState<number>(1200);
  const [rawHeight, setHeight] = useState<number>(630);
  const width = clampSize(rawWidth);
  const height = clampSize(rawHeight);
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
  const [error, setError] = useState<string>('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [useBackgroundImage, setUseBackgroundImage] = useState<boolean>(false);
  const [backgroundOverlay, setBackgroundOverlay] = useState<boolean>(true);
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState<number>(0.3);
  const [useHtmlMode, setUseHtmlMode] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [draggingBg, setDraggingBg] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);


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

  const handleBackgroundImageSelect = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

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
        
        // Draw background image cropped to cover the canvas (keeps its aspect ratio)
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const sw = width / scale;
        const sh = height / scale;
        ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, width, height);

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
  }, [heading, summary, useHtmlMode, backgroundColor, headingColor, summaryColor, width, height, headingSize, summarySize, fontFamily, textAlign, padding, useGradient, gradientColor, textShadow, textShadowBlur, lineSpacing, headingSpacing, useBackgroundImage, backgroundImage, backgroundOverlay, backgroundOverlayOpacity]);

  // Parse HTML to extract text with formatting
  const parseHtmlText = (html: string): Array<{ text: string; bold?: boolean; italic?: boolean }> => {
    if (!html) return [];
    
    // DOMParser builds an inert document: scripts and event handlers in the input never run.
    const tempDiv = new DOMParser().parseFromString(html, 'text/html').body;
    
    const result: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
    
    const traverse = (node: Node, isBold: boolean = false, isItalic: boolean = false) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        // Keep text as-is, normalize whitespace but preserve structure
        const normalizedText = text.replace(/\s+/g, ' '); // Normalize multiple spaces
        if (normalizedText.length > 0) {
          result.push({ text: normalizedText, bold: isBold, italic: isItalic });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        
        // Update formatting state
        let newBold = isBold;
        let newItalic = isItalic;
        
        if (tagName === 'b' || tagName === 'strong') {
          newBold = true;
        } else if (tagName === 'i' || tagName === 'em') {
          newItalic = true;
        }
        
        // Add line breaks for block elements
        if (tagName === 'br') {
          result.push({ text: '\n', bold: false, italic: false });
        } else if (tagName === 'p' || tagName === 'div') {
          // Add line break before and after block elements
          if (result.length > 0 && result[result.length - 1].text !== '\n') {
            result.push({ text: '\n', bold: false, italic: false });
          }
          // Traverse children
          Array.from(node.childNodes).forEach(child => traverse(child, newBold, newItalic));
          // Add line break after
          if (result.length > 0 && result[result.length - 1].text !== '\n') {
            result.push({ text: '\n', bold: false, italic: false });
          }
          return;
        }
        
        // Traverse child nodes with updated formatting
        Array.from(node.childNodes).forEach(child => traverse(child, newBold, newItalic));
      }
    };
    
    Array.from(tempDiv.childNodes).forEach(node => traverse(node));
    
    // Clean up: merge only truly consecutive text nodes with same formatting
    // Don't merge text that appears before/after HTML tags - keep them separate
    type TextSegment = { text: string; bold?: boolean; italic?: boolean };
    const cleaned: TextSegment[] = [];
    
    result.forEach((item: TextSegment) => {
      if (item.text === '\n') {
        // Line break - always add (but not if last was also line break)
        const lastCleaned = cleaned[cleaned.length - 1];
        if (cleaned.length === 0 || !lastCleaned || lastCleaned.text !== '\n') {
          cleaned.push(item);
        }
      } else {
        // Text node - trim and add
        const trimmedText = item.text.trim();
        if (trimmedText) {
          // Check if we should merge with previous item
          // Only merge if previous is also text (not line break) AND has same formatting
          const lastCleaned = cleaned[cleaned.length - 1];
          if (lastCleaned && 
              lastCleaned.text !== '\n' && 
              lastCleaned.bold === item.bold && 
              lastCleaned.italic === item.italic) {
            // Merge with previous - add space if needed
            const needsSpace = !lastCleaned.text.endsWith(' ') && !trimmedText.startsWith(' ');
            cleaned[cleaned.length - 1] = { 
              text: lastCleaned.text + (needsSpace ? ' ' : '') + trimmedText, 
              bold: lastCleaned.bold, 
              italic: lastCleaned.italic 
            };
          } else {
            // Add as new segment
            cleaned.push({ text: trimmedText, bold: item.bold, italic: item.italic });
          }
        }
      }
    });
    
    return cleaned;
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
    const headingWords = heading.trim() ? heading.trim().split(/\s+/) : [];
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
    const summaryLines: SummaryLine[] = [];
    
    if (useHtmlMode && summary.trim()) {
      // Parse HTML and create formatted segments
      const segments = parseHtmlText(summary);
      let currentLine: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
      let currentLineWidth = 0;
      
      segments.forEach((segment: { text: string; bold?: boolean; italic?: boolean }) => {
        if (segment.text === '\n') {
          // Line break - finalize current line
          if (currentLine.length > 0) {
            summaryLines.push(...currentLine);
            summaryLines.push({ text: '\n' });
            currentLine = [];
            currentLineWidth = 0;
          } else {
            // Empty line break
            summaryLines.push({ text: '\n' });
          }
        } else {
          // Trim the segment text
          const text = segment.text.trim();
          if (!text) return; // Skip empty segments
          
          // Split into words
          const words = text.split(/\s+/).filter(w => w.length > 0);
          
          words.forEach((word: string) => {
            // Set font for measurement
            const fontStyle = `${segment.italic ? 'italic ' : ''}${segment.bold ? 'bold ' : ''}${summarySize}px ${fontFamily}`;
            ctx.font = fontStyle;
            
            // Calculate widths
            const wordWidth = ctx.measureText(word).width;
            const spaceWidth = currentLine.length > 0 ? ctx.measureText(' ').width : 0;
            const totalWidth = spaceWidth + wordWidth;
            
            // Check if we need to wrap
            if (currentLineWidth + totalWidth > textAreaWidth && currentLine.length > 0) {
              // Wrap to new line
              summaryLines.push(...currentLine);
              summaryLines.push({ text: '\n' });
              currentLine = [{ text: word, bold: segment.bold, italic: segment.italic }];
              currentLineWidth = wordWidth;
            } else {
              // Add to current line
              if (currentLine.length > 0) {
                currentLine.push({ text: ' ', bold: false, italic: false });
                currentLineWidth += spaceWidth;
              }
              currentLine.push({ text: word, bold: segment.bold, italic: segment.italic });
              currentLineWidth += wordWidth;
            }
          });
        }
      });
      
      // Finalize last line
      if (currentLine.length > 0) {
        summaryLines.push(...currentLine);
      }
    } else {
      // Plain text mode
      ctx.font = `${summarySize}px ${fontFamily}`;
      // Respect line breaks typed by the user, then word-wrap each line.
      const paragraphs = summary.trim() ? summary.trim().split('\n') : [];
      paragraphs.forEach((para) => {
        const summaryWords = para.split(' ').filter((w) => w.length > 0);
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
        summaryLines.push(summaryCurrentLine);
      });
    }

    // Check if heading-only mode (no summary)
    const isHeadingOnly = heading.trim() && !summary.trim();
    
    // Enhance heading size and effects for heading-only mode
    let effectiveHeadingSize = headingSize;
    let enhancedShadow = textShadow;
    let useTextOutline = false;
    
    if (isHeadingOnly) {
      // Increase heading size by 1.5x for better impact
      effectiveHeadingSize = Math.floor(headingSize * 1.5);
      // Ensure it doesn't exceed canvas constraints
      const maxSize = Math.min(width, height) / 8;
      if (effectiveHeadingSize > maxSize) {
        effectiveHeadingSize = Math.floor(maxSize);
      }
      // Enable enhanced shadow and outline
      enhancedShadow = true;
      useTextOutline = true;
    }

    // Calculate total text height for vertical centering
    const headingHeight = headingLines.length * effectiveHeadingSize * 1.2;
    // Count actual lines in summary
    const summaryLineCount = useHtmlMode 
      ? summaryLines.filter(s => typeof s === 'object' && 'text' in s && s.text === '\n').length + 1
      : summaryLines.length;
    const summaryHeight = summaryLineCount * summarySize * lineSpacing;
    const totalTextHeight = headingHeight + (headingLines.length > 0 && summaryLines.length > 0 ? headingSpacing : 0) + summaryHeight;
    
    // Start Y position (centered vertically)
    const startY = (height - totalTextHeight) / 2;
    let textY = startY;

    // Draw heading with enhanced effects
    if (headingLines.length > 0) {
      ctx.font = `bold ${effectiveHeadingSize}px ${fontFamily}`;
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'top';
      
      headingLines.forEach((line, index) => {
        const x = textAlign === 'left' ? textX : textAlign === 'right' ? width - textX : width / 2;
        const y = textY + (index * effectiveHeadingSize * 1.2);
        
        ctx.save();
        
        if (enhancedShadow) {
          // Enhanced multi-layer shadow for depth
          // Draw multiple shadow layers for depth effect
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          
          // Outer shadow layers (darker, more offset)
          for (let i = 4; i >= 2; i--) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.3 - (4 - i) * 0.1})`;
            ctx.fillText(line, x + i, y + i);
          }
        } else if (textShadow) {
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
        
        // Draw text outline/stroke for heading-only mode (before main text)
        if (useTextOutline) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(line, x, y);
        }
        
        // Draw main text (on top)
        ctx.fillStyle = headingColor;
        ctx.fillText(line, x, y);
        
        ctx.restore();
      });

      textY += headingLines.length * effectiveHeadingSize * 1.2 + headingSpacing;
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
        
        const renderLine = (segments: Array<{ text: string; bold?: boolean; italic?: boolean }>, y: number) => {
          if (segments.length === 0) return;
          
          // Filter out empty segments and space-only segments at start/end
          const filteredSegments = segments.filter(seg => seg.text.trim().length > 0 || seg.text === ' ');
          
          if (filteredSegments.length === 0) return;
          
          // Calculate total width for alignment
          let totalWidth = 0;
          filteredSegments.forEach((seg) => {
            ctx.font = `${seg.italic ? 'italic ' : ''}${seg.bold ? 'bold ' : ''}${summarySize}px ${fontFamily}`;
            totalWidth += ctx.measureText(seg.text).width;
          });
          
          // Determine starting X position based on alignment
          let lineX: number;
          if (textAlign === 'left') {
            lineX = textX;
          } else if (textAlign === 'right') {
            lineX = width - textX - totalWidth;
          } else {
            // center
            lineX = (width - totalWidth) / 2;
          }
          
          // Render each segment
          filteredSegments.forEach((seg) => {
            const fontStyle = `${seg.italic ? 'italic ' : ''}${seg.bold ? 'bold ' : ''}${summarySize}px ${fontFamily}`;
            ctx.font = fontStyle;
            
            if (textShadow) {
              ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
              ctx.shadowBlur = textShadowBlur;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
            }
            
            ctx.fillText(seg.text, lineX, y);
            lineX += ctx.measureText(seg.text).width;
          });
        };
        
        summaryLines.forEach((segment) => {
          if (typeof segment === 'object' && 'text' in segment) {
            if (segment.text === '\n') {
              // Render current line and move to next
              if (currentLineSegments.length > 0) {
                renderLine(currentLineSegments, currentY);
                currentLineSegments = [];
                currentY += summarySize * lineSpacing;
              } else {
                // Empty line - just move down
                currentY += summarySize * lineSpacing;
              }
            } else {
              // Add segment to current line
              currentLineSegments.push(segment);
            }
          }
        });
        
        // Render remaining segments (last line)
        if (currentLineSegments.length > 0) {
          renderLine(currentLineSegments, currentY);
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

  const downloadImage = (format: 'png' | 'jpeg' = 'png') => {
    if (!generatedImage) return;
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = format === 'jpeg' && canvas ? canvas.toDataURL('image/jpeg', 0.92) : generatedImage;
    link.download = `text-image-${width}x${height}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
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

  useEffect(() => {
    if (!heading.trim() && !summary.trim()) {
      setGeneratedImage(null);
      return;
    }
    // Debounce so dragging sliders stays smooth.
    const timer = setTimeout(() => {
      generateImage();
    }, 100);
    return () => clearTimeout(timer);
  }, [heading, summary, useHtmlMode, generateImage]);

  return (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Text Inputs */}
            <div>
              <label htmlFor="tti-heading" className="block text-sm font-medium text-gray-700 mb-2">
                Heading Text
              </label>
              <input
                id="tti-heading"
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Enter your heading..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="tti-summary" className="block text-sm font-medium text-gray-700">
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
                    id="tti-summary"
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
                  id="tti-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter your summary or description (press Enter for a new line)..."
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
                    type="button"
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
                <label htmlFor="tti-width" className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  id="tti-width"
                  type="number"
                  value={Number.isNaN(rawWidth) ? '' : rawWidth}
                  onChange={(e) => setWidth(e.target.valueAsNumber)}
                  onBlur={() => setWidth(width)}
                  min="100"
                  max="5000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="tti-height" className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <input
                  id="tti-height"
                  type="number"
                  value={Number.isNaN(rawHeight) ? '' : rawHeight}
                  onChange={(e) => setHeight(e.target.valueAsNumber)}
                  onBlur={() => setHeight(height)}
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
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">Use Background Image</span>
                  </label>
                  
                  {useBackgroundImage && (
                    <div className="mt-3 space-y-3">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDraggingBg(true);
                        }}
                        onDragLeave={() => setDraggingBg(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggingBg(false);
                          handleBackgroundImageSelect(e.dataTransfer.files?.[0]);
                        }}
                        className={`rounded-lg border-2 border-dashed p-3 text-center ${draggingBg ? 'border-blue-500 bg-white' : 'border-blue-200'}`}
                      >
                        <input
                          ref={backgroundImageInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          tabIndex={-1}
                          aria-label="Background image"
                          data-testid="image-file-input"
                          onChange={(e) => {
                            handleBackgroundImageSelect(e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => backgroundImageInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          {backgroundImage ? 'Change image' : 'Choose image'}
                        </button>
                        <p className="mt-1 text-xs text-gray-600">or drag and drop. It stays on your device and is cropped to fill the canvas.</p>
                      </div>
                      
                      {backgroundImage && (
                        <div className="relative">
                          <img
                            src={backgroundImage}
                            alt="Background preview"
                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={removeBackgroundImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            title="Remove background image"
                            aria-label="Remove background image"
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
                    type="button"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background {useBackgroundImage && '(image in use)'}
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
                  Heading
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
                  Summary
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

            {generatedImage && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => downloadImage('png')}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => downloadImage('jpeg')}
                  className="w-full px-6 py-3 bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors"
                >
                  Download JPG
                </button>
              </div>
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
                    alt="Generated text image preview" data-testid="tti-preview"
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

      </div>
    </div>
  );
}

