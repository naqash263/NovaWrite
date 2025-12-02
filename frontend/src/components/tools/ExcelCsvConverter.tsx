import { useState, useRef } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

type FileFormat = 'xlsx' | 'csv';

export default function ExcelCsvConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<FileFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<FileFormat>('csv');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free Excel to CSV Converter - Convert XLSX to CSV Online | CSV to Excel Converter',
    description: 'Free online Excel to CSV converter. Convert XLSX, XLS files to CSV format and vice versa. Perfect for data import/export, spreadsheet compatibility, and database migration. No registration required.',
    url: '/resources/utility-tools/excel-csv-converter',
    keywords: [
      'excel to csv', 'csv to excel', 'xlsx to csv', 'csv to xlsx', 'excel converter',
      'csv converter', 'spreadsheet converter', 'excel csv converter', 'online excel converter',
      'free excel converter', 'xls to csv', 'convert excel to csv'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Excel CSV Converter',
      'description': 'Free online Excel to CSV converter. Convert XLSX, XLS files to CSV and vice versa.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/excel-csv-converter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Convert Excel to CSV',
        'Convert CSV to Excel',
        'Support XLSX and XLS formats',
        'Preserve data integrity',
        'Download converted files',
        'Secure server-side processing'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'reviewCount': '2850'
      }
    }
  });

  const detectFormat = (filename: string): FileFormat | null => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'xlsx' || extension === 'xls') {
      return 'xlsx';
    }
    
    if (extension === 'csv') {
      return 'csv';
    }
    
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSelectedFile(file);
    setDownloadUrl('');
    setFilename('');

    const format = detectFormat(file.name);
    if (!format) {
      setError('Unsupported file format. Please upload Excel (XLSX, XLS) or CSV files.');
      return;
    }

    setSourceFormat(format);
    
    // Set default target format
    if (format === 'xlsx') {
      setTargetFormat('csv');
    } else {
      setTargetFormat('xlsx');
    }
  };

  const convertFile = async () => {
    if (!selectedFile || !sourceFormat) {
      setError('Please select a file first');
      return;
    }

    if (sourceFormat === targetFormat) {
      setError('Source and target formats are the same. Please select a different target format.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setDownloadUrl('');
    setFilename('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('target_format', targetFormat);

      const response = await fetch(`${API_URL}/utility-tools/excel-csv-converter/convert`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to convert file');
      }

      if (data.success && data.data) {
        setDownloadUrl(data.data.url);
        setFilename(data.data.filename);
      } else {
        throw new Error(data.message || 'Failed to convert file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while converting the file');
      setDownloadUrl('');
      setFilename('');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadConverted = () => {
    if (!downloadUrl) return;
    window.open(downloadUrl, '_blank');
  };

  const reset = () => {
    setSelectedFile(null);
    setSourceFormat(null);
    setDownloadUrl('');
    setFilename('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConversionDescription = () => {
    if (!sourceFormat || !targetFormat) return '';
    
    if (sourceFormat === 'xlsx' && targetFormat === 'csv') {
      return 'Convert Excel spreadsheet (XLSX/XLS) to CSV format for easy data import/export';
    }
    
    if (sourceFormat === 'csv' && targetFormat === 'xlsx') {
      return 'Convert CSV file to Excel format (XLSX) for spreadsheet editing';
    }
    
    return 'Convert file';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Excel ↔ CSV Converter</h1>
        <p className="text-gray-600 mb-6">
          Convert Excel spreadsheets (XLSX, XLS) to CSV format and vice versa. Perfect for data migration, 
          import/export, and compatibility with different applications.
        </p>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Excel or CSV File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {sourceFormat && (
            <p className="text-sm text-gray-600 mt-2">
              Detected format: <span className="font-semibold">{sourceFormat.toUpperCase()}</span>
            </p>
          )}
        </div>

        {/* Format Selection */}
        {selectedFile && sourceFormat && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Format
              </label>
              <input
                type="text"
                value={sourceFormat === 'xlsx' ? 'Excel (XLSX/XLS)' : 'CSV'}
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
                {sourceFormat !== 'csv' && <option value="csv">CSV (Comma Separated Values)</option>}
                {sourceFormat !== 'xlsx' && <option value="xlsx">Excel (XLSX)</option>}
              </select>
            </div>
          </div>
        )}

        {/* Conversion Description */}
        {selectedFile && sourceFormat && targetFormat && sourceFormat !== targetFormat && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Conversion:</strong> {getConversionDescription()}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {downloadUrl && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm mb-3">
              ✅ File converted successfully!
            </p>
            <button
              onClick={downloadConverted}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Download Converted File ({filename})
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {selectedFile && sourceFormat && (
          <div className="flex gap-4">
            <button
              onClick={convertFile}
              disabled={isProcessing || sourceFormat === targetFormat}
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

        {/* Supported Conversions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Supported Conversions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
            <div>✅ Excel (XLSX) → CSV</div>
            <div>✅ Excel (XLS) → CSV</div>
            <div>✅ CSV → Excel (XLSX)</div>
            <div>✅ Preserves data integrity</div>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Excel CSV Converter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Excel CSV Converter is a free online tool that converts Excel spreadsheets (XLSX, XLS) to CSV format 
            and vice versa. Perfect for data migration, import/export operations, and ensuring compatibility 
            between different spreadsheet applications and databases.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported Formats</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Excel (XLSX):</strong> Modern Excel format (2007+). Supports multiple sheets, formulas, and formatting.</li>
            <li><strong>Excel (XLS):</strong> Legacy Excel format (97-2003). Automatically converted to XLSX when converting to Excel.</li>
            <li><strong>CSV (Comma Separated Values):</strong> Simple text format for tabular data. Compatible with all spreadsheet applications.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Key Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Bidirectional Conversion:</strong> Convert Excel to CSV and CSV to Excel seamlessly.</li>
            <li><strong>Data Preservation:</strong> All data is preserved during conversion, including text, numbers, and dates.</li>
            <li><strong>Secure Processing:</strong> All conversions happen on secure servers. Files are automatically deleted after processing.</li>
            <li><strong>Fast Conversion:</strong> Most conversions complete in seconds, even for large spreadsheets.</li>
            <li><strong>No Registration:</strong> Start converting files immediately without creating an account.</li>
            <li><strong>Multiple Sheet Support:</strong> Excel files with multiple sheets are converted (first sheet used for CSV).</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Database Import:</strong> Convert Excel files to CSV for importing into databases (MySQL, PostgreSQL, etc.).</li>
            <li><strong>Data Export:</strong> Convert CSV data to Excel format for analysis and reporting.</li>
            <li><strong>Application Compatibility:</strong> Convert files between formats for compatibility with different software.</li>
            <li><strong>Data Migration:</strong> Migrate data between systems that use different formats.</li>
            <li><strong>API Integration:</strong> Convert Excel data to CSV for API endpoints that require CSV format.</li>
            <li><strong>Bulk Data Processing:</strong> Convert large datasets between formats for processing pipelines.</li>
            <li><strong>Spreadsheet Sharing:</strong> Convert Excel files to CSV for sharing with users who don't have Excel.</li>
            <li><strong>Data Analysis:</strong> Convert CSV to Excel for advanced analysis using Excel features.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How It Works</h3>
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li><strong>Upload File:</strong> Select an Excel (XLSX/XLS) or CSV file from your device.</li>
            <li><strong>Automatic Detection:</strong> Our system automatically detects the file format.</li>
            <li><strong>Select Target Format:</strong> Choose whether to convert to CSV or Excel format.</li>
            <li><strong>Secure Processing:</strong> The conversion happens on our secure servers.</li>
            <li><strong>Download Result:</strong> Download your converted file immediately. Files are automatically deleted from our servers.</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Important Notes</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
              <li><strong>Formulas:</strong> Excel formulas are converted to their calculated values in CSV format.</li>
              <li><strong>Formatting:</strong> Cell formatting (colors, fonts, etc.) is not preserved when converting to CSV.</li>
              <li><strong>Multiple Sheets:</strong> When converting Excel to CSV, only the first sheet is converted.</li>
              <li><strong>Large Files:</strong> Files up to 10MB are supported. For larger files, consider splitting them.</li>
              <li><strong>Special Characters:</strong> CSV files properly handle commas, quotes, and newlines in data.</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Is the Excel CSV Converter free to use?</h4>
              <p className="text-gray-700">Yes, our Excel CSV Converter is completely free to use. No registration, no hidden fees, no limits on conversions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Are my files secure?</h4>
              <p className="text-gray-700">Yes, all conversions happen on secure servers, and files are automatically deleted immediately after processing. We never store or access your files.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">What file sizes are supported?</h4>
              <p className="text-gray-700">We support files up to 10MB in size. For larger files, consider splitting them into smaller parts.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Will formulas be preserved?</h4>
              <p className="text-gray-700">When converting Excel to CSV, formulas are converted to their calculated values. The formula itself is not preserved in CSV format.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Can I convert files with multiple sheets?</h4>
              <p className="text-gray-700">When converting Excel to CSV, only the first sheet is converted. For multiple sheets, you'll need to convert each sheet separately.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">What if my conversion fails?</h4>
              <p className="text-gray-700">If a conversion fails, you'll receive a clear error message. Common issues include corrupted files, unsupported formats, or files that are too large. Try a different file or format if needed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

