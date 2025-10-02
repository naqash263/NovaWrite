import { useRef, useEffect } from 'react';

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HtmlEditor({ value, onChange }: HtmlEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleToolbar = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  return (
    <div className="html-editor">
      <div className="editor-toolbar">
        <button type="button" onClick={() => handleToolbar('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => handleToolbar('italic')} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => handleToolbar('underline')} title="Underline">
          <u>U</u>
        </button>
        <button type="button" onClick={() => handleToolbar('formatBlock', '<h2>')} title="Heading 2">
          H2
        </button>
        <button type="button" onClick={() => handleToolbar('formatBlock', '<h3>')} title="Heading 3">
          H3
        </button>
        <button type="button" onClick={() => handleToolbar('formatBlock', '<p>')} title="Paragraph">
          P
        </button>
        <button type="button" onClick={() => handleToolbar('insertUnorderedList')} title="Bullet List">
          •
        </button>
        <button type="button" onClick={() => handleToolbar('insertOrderedList')} title="Numbered List">
          1.
        </button>
        <button type="button" onClick={() => handleToolbar('createLink', prompt('Enter URL') || '')} title="Link">
          Link
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="editor-content"
        suppressContentEditableWarning
      />
    </div>
  );
}
