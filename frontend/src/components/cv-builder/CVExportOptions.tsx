import React, { useState } from 'react';
import { CvPreview } from './cv-preview';
import { type CVData } from './cv-form';
import { type CVStyle } from './template-customizer';

interface CVExportOptionsProps {
  data: CVData;
  style: CVStyle;
  template?: any;
  onExport: (format: string, options?: any) => void;
  isExporting?: boolean;
}

export const CVExportOptions: React.FC<CVExportOptionsProps> = ({
  data,
  style,
  template,
  onExport,
  isExporting = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includePageNumbers: false,
    includeWatermark: false,
    allowMultiPage: true, // Default to allowing multiple pages
    quality: 'high',
    pageSize: 'A4',
    margins: 'normal'
  });

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Professional PDF format',
      icon: '📄',
      color: 'bg-red-50 text-red-600',
      features: ['ATS-friendly', 'Print-ready', 'Universal compatibility']
    },
    {
      id: 'docx',
      name: 'Word Document',
      description: 'Editable Word format',
      icon: '📝',
      color: 'bg-blue-50 text-blue-600',
      features: ['Editable', 'Track changes', 'Comments support']
    },
    {
      id: 'html',
      name: 'HTML',
      description: 'Web-friendly format',
      icon: '🌐',
      color: 'bg-green-50 text-green-600',
      features: ['Web display', 'Email friendly', 'Responsive']
    },
    {
      id: 'txt',
      name: 'Plain Text',
      description: 'Simple text format',
      icon: '📃',
      color: 'bg-gray-50 text-gray-600',
      features: ['ATS parsing', 'Universal', 'Lightweight']
    }
  ];

  const qualityOptions = [
    { value: 'high', label: 'High Quality (300 DPI)', description: 'Best for printing' },
    { value: 'medium', label: 'Medium Quality (150 DPI)', description: 'Good balance' },
    { value: 'low', label: 'Low Quality (72 DPI)', description: 'Smaller file size' }
  ];

  const pageSizeOptions = [
    { value: 'A4', label: 'A4 (210 × 297 mm)', description: 'Standard international' },
    { value: 'Letter', label: 'Letter (8.5 × 11 in)', description: 'US standard' },
    { value: 'Legal', label: 'Legal (8.5 × 14 in)', description: 'Extended length' }
  ];

  const marginOptions = [
    { value: 'narrow', label: 'Narrow (0.5")', description: 'More content space' },
    { value: 'normal', label: 'Normal (1")', description: 'Standard margins' },
    { value: 'wide', label: 'Wide (1.5")', description: 'More white space' }
  ];

  const handleExport = () => {
    onExport(selectedFormat, exportOptions);
  };

  const selectedFormatData = exportFormats.find(f => f.id === selectedFormat);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Export Your CV</h2>
        <p className="text-lg text-gray-600">Choose your preferred format and customize export options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Options */}
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Format</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{format.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{format.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {format.features.map((feature, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full ${format.color}`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedFormat === format.id && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Settings</h3>
            <div className="space-y-4">
              {/* Quality Setting */}
              {selectedFormat === 'pdf' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                  <select
                    value={exportOptions.quality}
                    onChange={(e) => setExportOptions({...exportOptions, quality: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {qualityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Page Size */}
              {(selectedFormat === 'pdf' || selectedFormat === 'docx') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                  <select
                    value={exportOptions.pageSize}
                    onChange={(e) => setExportOptions({...exportOptions, pageSize: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Margins */}
              {(selectedFormat === 'pdf' || selectedFormat === 'docx') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Margins</label>
                  <select
                    value={exportOptions.margins}
                    onChange={(e) => setExportOptions({...exportOptions, margins: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {marginOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Additional Options */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includePageNumbers"
                    checked={exportOptions.includePageNumbers}
                    onChange={(e) => setExportOptions({...exportOptions, includePageNumbers: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includePageNumbers" className="ml-2 block text-sm text-gray-900">
                    Include page numbers
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeWatermark"
                    checked={exportOptions.includeWatermark}
                    onChange={(e) => setExportOptions({...exportOptions, includeWatermark: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeWatermark" className="ml-2 block text-sm text-gray-900">
                    Include "Created with Naqash Thaheem's CV Builder" watermark
                  </label>
                </div>

                {/* Multi-page option (PDF only) */}
                {selectedFormat === 'pdf' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowMultiPage"
                      checked={exportOptions.allowMultiPage}
                      onChange={(e) => setExportOptions({...exportOptions, allowMultiPage: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowMultiPage" className="ml-2 block text-sm text-gray-900">
                      Allow multiple pages (if unchecked, content will be scaled to fit on one page)
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Export as {selectedFormatData?.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedFormatData?.description}
              </p>
              
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download {selectedFormatData?.name}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="max-h-[600px] overflow-y-auto">
              <CvPreview data={data} style={style} template={template} />
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              This is how your CV will look when exported
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVExportOptions;

