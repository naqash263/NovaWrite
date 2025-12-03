import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  minLength?: number; // Minimum content length to show TOC
}

export default function TableOfContents({ content, minLength = 2000 }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!content || content.length < minLength) {
      setTocItems([]);
      return;
    }

    // Extract headings from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3, h4');
    
    const items: TocItem[] = [];
    headings.forEach((heading) => {
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      const id = text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Set ID on the heading element for anchor links
      heading.id = id;
      
      items.push({ id, text, level });
    });

    setTocItems(items);

    // Set up scroll spy
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    headings.forEach((heading) => {
      if (heading.id) {
        observer.observe(heading);
      }
    });

    return () => {
      headings.forEach((heading) => {
        if (heading.id) {
          observer.unobserve(heading);
        }
      });
    };
  }, [content, minLength]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-8">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Table of Contents
      </h3>
      <nav className="space-y-1" aria-label="Table of contents">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              activeId === item.id
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
            style={{ paddingLeft: `${(item.level - 2) * 16 + 12}px` }}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  );
}

