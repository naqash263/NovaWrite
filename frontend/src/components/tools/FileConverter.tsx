import { useState, useRef, useEffect } from 'react';
import { useSEO } from '../../utils/seo';

type FileFormat = 'txt' | 'csv' | 'json' | 'xml' | 'yaml' | 'html';

export default function FileConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<FileFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<FileFormat>('json');
  const [convertedContent, setConvertedContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free File Converter - Convert TXT, CSV, JSON, XML, YAML, HTML Online | File Format Converter',
    description: 'Free online file converter. Convert files between TXT, CSV, JSON, XML, YAML, and HTML formats. All processing happens in your browser. No registration required.',
    url: '/resources/utility-tools/file-converter',
    keywords: [
      'file converter', 'convert file format', 'TXT to JSON', 'CSV to JSON',
      'JSON to XML', 'XML to YAML', 'file format converter', 'online file converter',
      'free file converter', 'text file converter', 'data converter'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'File Converter',
      'description': 'Free online file converter. Convert files between TXT, CSV, JSON, XML, YAML, and HTML formats.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/file-converter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Convert between TXT, CSV, JSON, XML, YAML, HTML',
        'Automatic format detection',
        'Download converted files',
        'All processing in browser',
        'No file size limits'
      ]
    }
  });

  const detectFileFormat = (filename: string, content: string): FileFormat => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    // Check by extension first
    if (extension === 'csv') return 'csv';
    if (extension === 'json') return 'json';
    if (extension === 'xml') return 'xml';
    if (extension === 'yaml' || extension === 'yml') return 'yaml';
    if (extension === 'html' || extension === 'htm') return 'html';
    
    // Try to detect by content
    const trimmed = content.trim();
    
    // JSON detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {}
    }
    
    // XML detection
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
      return 'xml';
    }
    
    // HTML detection
    if (trimmed.includes('<html') || trimmed.includes('<!DOCTYPE html')) {
      return 'html';
    }
    
    // CSV detection (has commas and newlines)
    if (trimmed.includes(',') && trimmed.includes('\n')) {
      const lines = trimmed.split('\n');
      if (lines.length > 1 && lines[0].split(',').length > 1) {
        return 'csv';
      }
    }
    
    // Default to TXT
    return 'txt';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSelectedFile(file);
    setConvertedContent('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      const format = detectFileFormat(file.name, content);
      setDetectedFormat(format);
      setTargetFormat(format === 'txt' ? 'json' : format); // Default target
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const convertFile = () => {
    if (!fileContent || !detectedFormat) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      let converted = '';

      // Convert from detected format to target format
      if (detectedFormat === targetFormat) {
        converted = fileContent;
      } else {
        // Parse source format
        let parsedData: any;

        switch (detectedFormat) {
          case 'json':
            parsedData = JSON.parse(fileContent);
            break;
          case 'csv':
            parsedData = parseCSV(fileContent);
            break;
          case 'xml':
            parsedData = parseXML(fileContent);
            break;
          case 'yaml':
            setError('YAML parsing not fully supported. Please use JSON or XML.');
            setIsProcessing(false);
            return;
          case 'html':
          case 'txt':
            parsedData = fileContent;
            break;
        }

        // Convert to target format
        switch (targetFormat) {
          case 'json':
            converted = JSON.stringify(parsedData, null, 2);
            break;
          case 'csv':
            converted = convertToCSV(parsedData);
            break;
          case 'xml':
            converted = convertToXML(parsedData);
            break;
          case 'yaml':
            converted = convertToYAML(parsedData);
            break;
          case 'html':
            converted = convertToHTML(parsedData);
            break;
          case 'txt':
            converted = typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData, null, 2);
            break;
        }
      }

      setConvertedContent(converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert file');
      setConvertedContent('');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      data.push(obj);
    }
    
    return data;
  };

  const parseXML = (xml: string): any => {
    // Simple XML to object parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const parseNode = (node: Element): any => {
      const obj: any = {};
      
      if (node.children.length === 0) {
        return node.textContent || '';
      }
      
      Array.from(node.children).forEach(child => {
        const tagName = child.tagName;
        if (obj[tagName]) {
          if (!Array.isArray(obj[tagName])) {
            obj[tagName] = [obj[tagName]];
          }
          obj[tagName].push(parseNode(child));
        } else {
          obj[tagName] = parseNode(child);
        }
      });
      
      return obj;
    };
    
    return parseNode(doc.documentElement);
  };

  const convertToCSV = (data: any): string => {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csv = [headers.join(',')];
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        });
        csv.push(values.join(','));
      });
      
      return csv.join('\n');
    }
    
    return Object.entries(data).map(([key, value]) => `${key},${value}`).join('\n');
  };

  const convertToXML = (data: any, rootName: string = 'root'): string => {
    const convert = (obj: any, tag: string): string => {
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return `<${tag}>${obj}</${tag}>`;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => convert(item, tag)).join('\n');
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const entries = Object.entries(obj);
        if (entries.length === 0) return `<${tag}></${tag}>`;
        
        return `<${tag}>\n${entries.map(([key, value]) => 
          convert(value, key)
        ).join('\n')}\n</${tag}>`;
      }
      
      return `<${tag}></${tag}>`;
    };
    
    return `<?xml version="1.0" encoding="UTF-8"?>\n${convert(data, rootName)}`;
  };

  const convertToYAML = (data: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);
    
    if (typeof data === 'string') {
      return `${spaces}"${data}"`;
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return `${spaces}${data}`;
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) return `${spaces}[]`;
      return data.map(item => `- ${convertToYAML(item, indent + 1).trim()}`).join('\n');
    }
    
    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data);
      if (entries.length === 0) return `${spaces}{}`;
      
      return entries.map(([key, value]) => {
        const valueStr = convertToYAML(value, indent + 1);
        return `${spaces}${key}: ${valueStr.trim()}`;
      }).join('\n');
    }
    
    return `${spaces}null`;
  };

  const convertToHTML = (data: any): string => {
    if (typeof data === 'string') {
      return data;
    }
    
    const toHTML = (obj: any, tag: string = 'div'): string => {
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return `<${tag}>${obj}</${tag}>`;
      }
      
      if (Array.isArray(obj)) {
        return `<ul>${obj.map(item => `<li>${toHTML(item, 'span')}</li>`).join('')}</ul>`;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const entries = Object.entries(obj);
        return `<div>${entries.map(([key, value]) => 
          `<div><strong>${key}:</strong> ${toHTML(value, 'span')}</div>`
        ).join('')}</div>`;
      }
      
      return '';
    };
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Converted File</title>
</head>
<body>
  ${toHTML(data)}
</body>
</html>`;
  };

  const downloadConverted = () => {
    if (!convertedContent || !selectedFile) return;

    const blob = new Blob([convertedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.split('.')[0]}.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setSelectedFile(null);
    setFileContent('');
    setDetectedFormat(null);
    setConvertedContent('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (fileContent && detectedFormat && targetFormat) {
      convertFile();
    }
  }, [targetFormat]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Converter</h1>
        <p className="text-gray-600 mb-6">
          Convert files between different formats: TXT, CSV, JSON, XML, YAML, and HTML. All processing happens in your browser.
        </p>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File to Convert
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.json,.xml,.yaml,.yml,.html,.htm"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {detectedFormat && (
            <p className="text-sm text-gray-600 mt-2">
              Detected format: <span className="font-semibold">{detectedFormat.toUpperCase()}</span>
            </p>
          )}
        </div>

        {/* Format Selection */}
        {selectedFile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Format
              </label>
              <input
                type="text"
                value={detectedFormat?.toUpperCase() || ''}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as FileFormat)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="txt">TXT (Plain Text)</option>
                <option value="csv">CSV (Comma Separated Values)</option>
                <option value="json">JSON (JavaScript Object Notation)</option>
                <option value="xml">XML (Extensible Markup Language)</option>
                <option value="yaml">YAML (YAML Ain't Markup Language)</option>
                <option value="html">HTML (HyperText Markup Language)</option>
              </select>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* File Content Preview */}
        {fileContent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Original File Content
                </label>
                <span className="text-xs text-gray-500">{fileContent.length} characters</span>
              </div>
              <textarea
                value={fileContent}
                readOnly
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 font-mono text-sm"
              />
            </div>

            {convertedContent && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Converted Content ({targetFormat.toUpperCase()})
                  </label>
                  <button
                    onClick={downloadConverted}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Download
                  </button>
                </div>
                <textarea
                  value={convertedContent}
                  readOnly
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {selectedFile && (
          <div className="flex gap-4">
            <button
              onClick={convertFile}
              disabled={isProcessing || !detectedFormat}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Converting...' : 'Convert File'}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About File Converter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            File Converter is a free online tool that converts files between different formats 
            including TXT, CSV, JSON, XML, YAML, and HTML. All processing happens in your browser for privacy and speed.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported Formats</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>TXT:</strong> Plain text files</li>
            <li><strong>CSV:</strong> Comma-separated values (spreadsheet data)</li>
            <li><strong>JSON:</strong> JavaScript Object Notation (structured data)</li>
            <li><strong>XML:</strong> Extensible Markup Language (structured data)</li>
            <li><strong>YAML:</strong> YAML Ain't Markup Language (configuration files)</li>
            <li><strong>HTML:</strong> HyperText Markup Language (web pages)</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Automatic format detection</li>
            <li>Convert between 6 different formats</li>
            <li>All processing happens in your browser (privacy-friendly)</li>
            <li>Download converted files instantly</li>
            <li>No file size limits</li>
            <li>Real-time conversion preview</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Convert CSV data to JSON for APIs</li>
            <li>Convert JSON to XML for legacy systems</li>
            <li>Convert configuration files between formats</li>
            <li>Transform data for different applications</li>
            <li>Export data in different formats</li>
            <li>Migrate data between systems</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

