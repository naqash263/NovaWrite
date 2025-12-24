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
    // SEO validation and warnings
    const warnings: string[] = [];
    
    if (!title || title.trim() === '') {
      warnings.push('⚠️ SEO Warning: Page title is missing or empty');
    }
    
    if (!description || description.trim() === '') {
      warnings.push('⚠️ SEO Warning: Meta description is missing');
    } else if (description.length < 120) {
      warnings.push('⚠️ SEO Warning: Meta description is too short (recommended: 120-160 characters)');
    } else if (description.length > 160) {
      warnings.push('⚠️ SEO Warning: Meta description is too long (recommended: 120-160 characters)');
    }
    
    if (!image || image.trim() === '') {
      warnings.push('⚠️ SEO Warning: Open Graph image is missing');
    }
    
    if (!url || url.trim() === '') {
      warnings.push('⚠️ SEO Warning: Canonical URL is missing');
    }
    
    if (type === 'article') {
      if (!publishedTime) {
        warnings.push('⚠️ SEO Warning: Article published time is missing');
      }
      if (keywords.length === 0) {
        warnings.push('⚠️ SEO Warning: Article tags/keywords are missing');
      }
    }
    
    // Calculate SEO score
    let seoScore = 100;
    const totalChecks = 8; // Total number of SEO checks
    const scoreDeduction = 100 / totalChecks;
    
    if (!title || title.trim() === '') seoScore -= scoreDeduction;
    if (!description || description.trim() === '') seoScore -= scoreDeduction;
    if (description && (description.length < 120 || description.length > 160)) seoScore -= scoreDeduction / 2;
    if (!image || image.trim() === '') seoScore -= scoreDeduction;
    if (!url || url.trim() === '') seoScore -= scoreDeduction;
    if (type === 'article' && !publishedTime) seoScore -= scoreDeduction;
    if (type === 'article' && (!keywords || keywords.length === 0)) seoScore -= scoreDeduction;
    if (type === 'article' && !modifiedTime) seoScore -= scoreDeduction / 2;
    
    const finalScore = Math.max(0, Math.round(seoScore));
    
    // Log SEO analysis in development
    if (import.meta.env.DEV) {
      console.group(`🔍 SEO Analysis - Score: ${finalScore}/100`);
      
      if (warnings.length > 0) {
        warnings.forEach(warning => console.warn(warning));
      } else {
        console.log('✅ All SEO elements are properly configured!');
      }
      
      // Show score breakdown
      if (finalScore >= 90) {
        console.log('🟢 Excellent SEO score!');
      } else if (finalScore >= 70) {
        console.log('🟡 Good SEO score, minor improvements needed');
      } else if (finalScore >= 50) {
        console.log('🟠 Fair SEO score, several improvements needed');
      } else {
        console.log('🔴 Poor SEO score, major improvements needed');
      }
      
      console.groupEnd();
    }
    
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
    
    if (keywords && keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }
    
    setMetaTag('author', author);
    
    // Open Graph meta tags
    setMetaTag('og:title', title, true);
    if (description) {
      setMetaTag('og:description', description, true);
    }
    setMetaTag('og:type', type, true);
    
    // Safe image handling with fallback
    const safeImage = image || '/images/og-default.jpg';
    if (safeImage.startsWith('http')) {
      setMetaTag('og:image', safeImage, true);
    } else {
      setMetaTag('og:image', `${window.location.origin}${safeImage}`, true);
    }
    
    setMetaTag('og:site_name', 'Naqash Thaheem - Systems Analyst & Automation Specialist', true);
    
    if (url) {
      let ogUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      // Force HTTPS in og:url
      if (ogUrl.startsWith('http://')) {
        ogUrl = ogUrl.replace('http://', 'https://');
      }
      setMetaTag('og:url', ogUrl, true);
    } else {
      let currentHref = window.location.href;
      // Force HTTPS in og:url
      if (currentHref.startsWith('http://')) {
        currentHref = currentHref.replace('http://', 'https://');
      }
      setMetaTag('og:url', currentHref, true);
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
      if (keywords && keywords.length > 0) {
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
    
    // Safe Twitter image handling
    if (safeImage.startsWith('http')) {
      setMetaTag('twitter:image', safeImage);
    } else {
      setMetaTag('twitter:image', `${window.location.origin}${safeImage}`);
    }
    
    // Canonical URL - Use provided URL parameter or current page URL
    // Remove any existing canonical tags first to prevent duplicates
    const existingCanonicals = document.querySelectorAll('link[rel="canonical"]');
    existingCanonicals.forEach(canonical => canonical.remove());
    
    // Create a single canonical tag
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    
    // Use provided URL parameter if available, otherwise use current page URL
    let canonicalUrl: string;
    if (url && url.trim() !== '') {
      // If URL is provided, construct full URL
      if (url.startsWith('http://') || url.startsWith('https://')) {
        canonicalUrl = url;
      } else {
        // Relative URL - construct full URL
        canonicalUrl = `${window.location.origin}${url.startsWith('/') ? url : '/' + url}`;
      }
    } else {
      // Fallback to current page URL
      canonicalUrl = window.location.href;
    }
    
    // Force HTTPS in canonical URL
    if (canonicalUrl.startsWith('http://')) {
      canonicalUrl = canonicalUrl.replace('http://', 'https://');
    }
    
    // Remove trailing slash and query parameters for consistency (except homepage)
    const cleanUrl = canonicalUrl.split('?')[0];
    const finalUrl = cleanUrl === window.location.origin || cleanUrl === `${window.location.origin}/` 
      ? `${window.location.origin}/` 
      : cleanUrl.replace(/\/$/, '');
    
    canonical.href = finalUrl;
    document.head.appendChild(canonical);
    
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
