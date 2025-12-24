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
      "https://www.linkedin.com/in/naqash-thaheem-297464147",
      "https://github.com/naqashthaheem",
      "https://www.fiverr.com/hoiyothaheem"
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

export function generateBreadcrumbSchema(items: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
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

export function generateBlogPostSchema(post: {
  title: string;
  description: string;
  publishedAt: string;
  modifiedAt?: string;
  slug: string;
  featuredImage?: string;
  author: string;
  category?: string;
}) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "url": `https://naqashthaheem.com/blog/${post.slug}`,
    "datePublished": post.publishedAt,
    "dateModified": post.modifiedAt || post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author,
      "url": "https://naqashthaheem.com/about",
      "sameAs": [
        "https://www.linkedin.com/in/naqash-thaheem-297464147",
        "https://github.com/naqash-thaheem",
        "https://www.fiverr.com/hoiyothaheem"
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": "Naqash Thaheem",
      "url": "https://naqashthaheem.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://naqashthaheem.com/images/professional_busines_b4d6588a.jpg"
      }
    },
    "image": post.featuredImage ? {
      "@type": "ImageObject",
      "url": post.featuredImage,
      "width": 1200,
      "height": 630
    } : {
      "@type": "ImageObject",
      "url": "https://naqashthaheem.com/images/og-default.jpg",
      "width": 1200,
      "height": 630
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://naqashthaheem.com/blog/${post.slug}`
    },
    "inLanguage": "en-US",
    "isAccessibleForFree": true
  };

  // Add article section (category) if provided
  if (post.category) {
    schema.articleSection = post.category;
  }

  return schema;
}

