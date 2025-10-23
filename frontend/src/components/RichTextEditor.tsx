import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  showPreviewToggle?: boolean;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter content...",
  height = 300,
  showPreviewToggle = true
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  // Ensure component is mounted before rendering MDEditor
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        style={{ height: `${height}px` }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full resize-none border-none outline-none"
          style={{ height: `${height - 16}px` }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {showPreviewToggle && (
        <div className="flex justify-end mb-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setPreviewMode('edit')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                previewMode === 'edit' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PencilIcon className="w-4 h-4 inline mr-1" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                previewMode === 'preview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <EyeIcon className="w-4 h-4 inline mr-1" />
              Preview
            </button>
          </div>
        </div>
      )}
      
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={height}
        data-color-mode="light"
        preview={previewMode === 'preview' ? 'preview' : 'edit'}
        hideToolbar={previewMode === 'preview'}
        visibleDragbar={false}
        textareaProps={{
          placeholder: placeholder,
          style: {
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
        }}
      />
    </div>
  );
}
