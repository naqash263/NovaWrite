import { useState } from 'react';
import { marked } from 'marked';
import { useSEO } from '../../utils/seo';

export default function MarkdownPreview() {
  const [markdown, setMarkdown] = useState<string>('# Hello World\n\nThis is **bold** and this is *italic*.');
  const [html, setHtml] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useSEO({
    title: 'Free Markdown Preview - Live Markdown Editor & Preview | Markdown to HTML Converter',
    description: 'Free online markdown preview and editor. Write markdown and see live preview. Convert markdown to HTML. Export HTML code. Perfect for developers and content creators. No registration required.',
    url: '/resources/utility-tools/markdown-preview',
    keywords: [
      'markdown preview', 'markdown editor', 'markdown to HTML', 'live markdown preview',
      'markdown converter', 'markdown viewer', 'online markdown editor', 'free markdown tool',
      'markdown preview online', 'markdown HTML converter'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Markdown Preview & Editor',
      'description': 'Free online markdown preview and editor with live preview and HTML export.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/markdown-preview',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Live markdown preview',
        'Markdown to HTML conversion',
        'Export HTML code',
        'Dark and light themes',
        'Copy to clipboard',
        'Real-time rendering'
      ]
    }
  });

  const updatePreview = (md: string) => {
    setMarkdown(md);
    try {
      const htmlContent = marked(md);
      setHtml(htmlContent as string);
    } catch (err) {
      setHtml('<p class="text-red-600">Error parsing markdown</p>');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const clearAll = () => {
    setMarkdown('');
    setHtml('');
  };

  // Initialize preview on mount
  useEffect(() => {
    updatePreview(markdown);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Markdown Preview</h1>
        <p className="text-gray-600 mb-6">
          Write markdown and see live preview. Convert markdown to HTML and export the code.
        </p>

        {/* Options */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="mr-1"
              />
              Light Theme
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="mr-1"
              />
              Dark Theme
            </label>
          </div>
          <button
            onClick={clearAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear All
          </button>
        </div>

        {/* Editor and Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Markdown Editor */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Markdown Editor
              </label>
              <button
                onClick={() => copyToClipboard(markdown)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Copy Markdown
              </button>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => updatePreview(e.target.value)}
              placeholder="Write your markdown here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              {markdown.length} characters
            </div>
          </div>

          {/* HTML Preview */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Live Preview
              </label>
              {html && (
                <button
                  onClick={() => copyToClipboard(html)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy HTML
                </button>
              )}
            </div>
            <div
              className={`w-full h-96 p-4 border border-gray-300 rounded-lg overflow-y-auto ${
                theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white'
              }`}
            >
              <div
                className={`prose max-w-none ${
                  theme === 'dark' ? 'prose-invert' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        </div>

        {/* HTML Code Output */}
        {html && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                HTML Output
              </label>
              <button
                onClick={() => copyToClipboard(html)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Copy HTML
              </button>
            </div>
            <textarea
              value={html}
              readOnly
              className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 font-mono text-sm"
            />
          </div>
        )}

        {/* Markdown Cheat Sheet */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Markdown Cheat Sheet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
            <div>
              <p><strong>Headers:</strong> # H1, ## H2, ### H3</p>
              <p><strong>Bold:</strong> **bold** or __bold__</p>
              <p><strong>Italic:</strong> *italic* or _italic_</p>
              <p><strong>Link:</strong> [text](url)</p>
            </div>
            <div>
              <p><strong>Image:</strong> ![alt](url)</p>
              <p><strong>Code:</strong> `code` or ```code block```</p>
              <p><strong>List:</strong> - item or 1. item</p>
              <p><strong>Quote:</strong> &gt; quote</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Markdown Preview</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Markdown Preview is a free online tool that provides live preview of markdown content 
            and converts it to HTML. Perfect for developers, content creators, and writers.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Live markdown preview as you type</li>
            <li>Convert markdown to HTML</li>
            <li>Export HTML code</li>
            <li>Dark and light themes</li>
            <li>Copy markdown and HTML to clipboard</li>
            <li>Markdown cheat sheet included</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Preview markdown before publishing</li>
            <li>Convert markdown to HTML for websites</li>
            <li>Test markdown syntax and formatting</li>
            <li>Create HTML from markdown content</li>
            <li>Learn markdown syntax with live preview</li>
            <li>Write documentation and blog posts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

