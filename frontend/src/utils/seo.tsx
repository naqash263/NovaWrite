import { useEffect } from 'react';
import { 
  generatePersonSchema, 
  generateWebsiteSchema, 
  generateOrganizationSchema,
  injectStructuredData 
} from './structuredData';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  structuredData?: 'person' | 'website' | 'organization' | 'custom';
  customStructuredData?: any;
}

export function useSEO({ 
  title, 
  description, 
  image = '/images/og-default.jpg',
  url,
  type = 'website',
  author = 'Naqash Thaheem',
  publishedTime,
  modifiedTime,
  keywords = [],
  structuredData,
  customStructuredData
}: SEOProps) {
  useEffect(() => {
    // Set page title
    document.title = title;
    
    // Helper function to set or update meta tags
    const setMetaTag = (name: string, content: string, useProperty = false) => {
      const attribute = useProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    if (description) {
      setMetaTag('description', description);
    }
    
    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }
    
    setMetaTag('author', author);
    
    // Open Graph meta tags
    setMetaTag('og:title', title, true);
    if (description) {
      setMetaTag('og:description', description, true);
    }
    setMetaTag('og:type', type, true);
    setMetaTag('og:image', image.startsWith('http') ? image : `${window.location.origin}${image}`, true);
    setMetaTag('og:site_name', 'Naqash Thaheem - Systems Analyst & Automation Specialist', true);
    
    if (url) {
      setMetaTag('og:url', url.startsWith('http') ? url : `${window.location.origin}${url}`, true);
    } else {
      setMetaTag('og:url', window.location.href, true);
    }
    
    // Article specific meta tags
    if (type === 'article') {
      setMetaTag('article:author', author, true);
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime, true);
      }
      if (keywords.length > 0) {
        keywords.forEach(keyword => {
          const meta = document.createElement('meta');
          meta.setAttribute('property', 'article:tag');
          meta.setAttribute('content', keyword);
          document.head.appendChild(meta);
        });
      }
    }
    
    // Twitter Card meta tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:site', '@naqashthaheem');
    setMetaTag('twitter:creator', '@naqashthaheem');
    setMetaTag('twitter:title', title);
    if (description) {
      setMetaTag('twitter:description', description);
    }
    setMetaTag('twitter:image', image.startsWith('http') ? image : `${window.location.origin}${image}`);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url ? (url.startsWith('http') ? url : `${window.location.origin}${url}`) : window.location.href;
    
    // Add structured data
    if (structuredData) {
      let schema;
      switch (structuredData) {
        case 'person':
          schema = generatePersonSchema();
          break;
        case 'website':
          schema = generateWebsiteSchema();
          break;
        case 'organization':
          schema = generateOrganizationSchema();
          break;
        case 'custom':
          schema = customStructuredData;
          break;
      }
      
      if (schema) {
        // Remove existing structured data
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => script.remove());
        
        // Add new structured data
        injectStructuredData(schema);
      }
    }
    
  }, [title, description, image, url, type, author, publishedTime, modifiedTime, keywords, structuredData, customStructuredData]);
}
