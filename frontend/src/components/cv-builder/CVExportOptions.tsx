import React from 'react';
import { CvPreview } from './cv-preview';
import { type CVData } from './cv-form';
import { type CVStyle } from './template-customizer';
import type { CvTemplateLike } from './cv-render';
import type { CvLayout } from './cv-sections';
import type { CvExportFormat, CvExportSettings } from './cv-export-settings';

export type { CvExportFormat, CvExportSettings } from './cv-export-settings';

interface CVExportOptionsProps {
  data: CVData;
  style: CVStyle;
  template?: CvTemplateLike | null;
  layout?: CvLayout | null;
  selectedFormat: CvExportFormat;
  onFormatChange: (format: CvExportFormat) => void;
  exportOptions: CvExportSettings;
  onOptionsChange: (options: CvExportSettings) => void;
  onExport: (format: CvExportFormat, options: CvExportSettings) => void;
  isExporting?: boolean;
}

export const CVExportOptions: React.FC<CVExportOptionsProps> = ({
  data,
  style,
  template,
  layout,
  selectedFormat,
  onFormatChange: setSelectedFormat,
  exportOptions,
  onOptionsChange: setExportOptions,
  onExport,
  isExporting = false
}) => {

  const exportFormats: { id: CvExportFormat; name: string; description: string; icon: string; color: string; features: string[] }[] = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Selectable text, ready to upload or print',
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

  const handleExport = () => onExport(selectedFormat, exportOptions);

  const selectedFormatData = exportFormats.find(f => f.id === selectedFormat);

  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Export Your CV</h2>
        <p className="text-lg text-gray-600">Choose your preferred format and customize export options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Options */}
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Format</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportFormats.map((format) => (
                <button
                  type="button"
                  key={format.id}
                  aria-pressed={selectedFormat === format.id}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Settings</h3>
            <div className="space-y-4">
              {selectedFormat === 'pdf' && (
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 mb-2">PDF layout</legend>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 text-sm text-gray-900">
                      <input
                        type="radio"
                        name="cv-pdf-layout"
                        value="ats"
                        checked={exportOptions.pdfLayout === 'ats'}
                        onChange={() => setExportOptions({ ...exportOptions, pdfLayout: 'ats' })}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        ATS text layout (recommended)
                        <span className="block text-xs text-gray-500">One column of real text lines that applicant tracking systems read in order. Uses your accent colour, font and section order.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 text-sm text-gray-900">
                      <input
                        type="radio"
                        name="cv-pdf-layout"
                        value="design"
                        checked={exportOptions.pdfLayout === 'design'}
                        onChange={() => setExportOptions({ ...exportOptions, pdfLayout: 'design' })}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        Template design (as previewed)
                        <span className="block text-xs text-gray-500">Keeps the selected template&apos;s look. The text stays selectable, but some ATS parsers read designed layouts less reliably.</span>
                      </span>
                    </label>
                  </div>
                </fieldset>
              )}

              {/* Page Size */}
              {(selectedFormat === 'pdf' || selectedFormat === 'docx') && (
                <div>
                  <label htmlFor="cv-export-page-size" className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                  <select
                    id="cv-export-page-size"
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
                  <label htmlFor="cv-export-margins" className="block text-sm font-medium text-gray-700 mb-2">Margins</label>
                  <select
                    id="cv-export-margins"
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

              {/* Additional Options (PDF only) */}
              {selectedFormat !== 'pdf' && selectedFormat !== 'docx' && (
                <p className="text-sm text-gray-600">No extra settings for this format.</p>
              )}
              {selectedFormat === 'pdf' && (
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
                    Include "Created with Naqash Thaheem's CV Builder" footer
                  </label>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Export as {selectedFormatData?.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedFormatData?.description}
              </p>
              
              <button
                type="button"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="max-h-[600px] overflow-y-auto">
              <CvPreview data={data} style={style} template={template} layout={layout} />
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

