import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter content...",
  height = 300 
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

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
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={height}
        data-color-mode="light"
        preview="edit"
        hideToolbar={false}
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
