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

export function generateBreadcrumbSchema(items?: Array<{name: string, url: string}>) {
  const breadcrumbItems = items || [
    {
      name: "Home",
      url: "https://naqashthaheem.com"
    },
    {
      name: "Resources",
      url: "https://naqashthaheem.com/resources"
    }
  ];
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateFAQSchema(faqs?: Array<{question: string, answer: string}>) {
  const faqItems = faqs || [
    {
      question: "What services do you offer?",
      answer: "I offer systems analysis, automation solutions, and web development services."
    }
  ];
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function injectStructuredData(schema: any) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

