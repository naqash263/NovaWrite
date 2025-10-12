// Simple structured data utilities for SEO
export function generatePersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Naqash Thaheem",
    "jobTitle": "Systems Analyst & Automation Specialist",
    "description": "Experienced Systems Analyst specializing in automation and process optimization",
    "url": "https://naqashthaheem.com",
    "sameAs": [
      "https://linkedin.com/in/naqashthaheem",
      "https://github.com/naqashthaheem"
    ]
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Naqash Thaheem - Portfolio",
    "description": "Professional portfolio showcasing systems analysis and automation expertise",
    "url": "https://naqashthaheem.com",
    "author": {
      "@type": "Person",
      "name": "Naqash Thaheem"
    }
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Naqash Thaheem Consulting",
    "description": "Systems Analysis and Automation Consulting Services",
    "url": "https://naqashthaheem.com",
    "founder": {
      "@type": "Person",
      "name": "Naqash Thaheem"
    }
  };
}

export function generateBreadcrumbSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://naqashthaheem.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Resources",
        "item": "https://naqashthaheem.com/resources"
      }
    ]
  };
}

export function generateFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What services do you offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "I offer systems analysis, automation solutions, and web development services."
        }
      }
    ]
  };
}

export function injectStructuredData(schema: any) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}
