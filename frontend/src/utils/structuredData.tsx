// Structured Data utilities for better SEO

export const generatePersonSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Naqash Thaheem",
    "jobTitle": "Systems Analyst & Automation Specialist",
    "description": "AI-powered automation workflows, CRM integrations, and scalable web platforms. 8+ years of experience in data scraping, processing, and business intelligence.",
    "url": "https://naqashthaheem.com",
    "image": "https://naqashthaheem.com/images/professional_busines_b4d6588a.jpg",
    "sameAs": [
      "https://linkedin.com/in/naqash-thaheem",
      "https://github.com/naqash-thaheem",
      "https://www.fiverr.com/hoiyothaheem"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ajman",
      "addressCountry": "AE"
    },
    "email": "contact@naqashthaheem.com",
    "knowsAbout": [
      "AI Automation",
      "CRM Integration", 
      "Power BI",
      "Business Intelligence",
      "Web Development",
      "Data Analysis",
      "n8n",
      "Zoho CRM",
      "HubSpot",
      "OpenAI",
      "React",
      "Laravel",
      ".NET Core"
    ],
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Systems Analyst & Automation Specialist",
      "description": "Designing and implementing AI-powered automation solutions, CRM integrations, and business intelligence dashboards",
      "skills": [
        "Workflow Automation",
        "Data Analysis", 
        "System Integration",
        "Web Development"
      ]
    }
  };
};

export const generateWebsiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Naqash Thaheem - Systems Analyst & Automation Specialist",
    "url": "https://naqashthaheem.com",
    "description": "Professional portfolio showcasing AI automation, CRM integration, and business intelligence solutions",
    "author": {
      "@type": "Person",
      "name": "Naqash Thaheem"
    },
    "publisher": {
      "@type": "Person",
      "name": "Naqash Thaheem"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://naqashthaheem.com/blog?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
};

export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Naqash Thaheem - Automation Solutions",
    "url": "https://naqashthaheem.com",
    "logo": "https://naqashthaheem.com/images/professional_busines_b4d6588a.jpg",
    "description": "Professional automation and business intelligence services",
    "founder": {
      "@type": "Person",
      "name": "Naqash Thaheem"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ajman",
      "addressCountry": "AE"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contact@naqashthaheem.com"
    },
    "sameAs": [
      "https://linkedin.com/in/naqash-thaheem",
      "https://github.com/naqash-thaheem",
      "https://www.fiverr.com/hoiyothaheem"
    ],
    "service": [
      {
        "@type": "Service",
        "name": "AI Automation Workflows",
        "description": "Design and implement intelligent automation solutions using n8n, Make.com, and OpenAI"
      },
      {
        "@type": "Service", 
        "name": "CRM Integration",
        "description": "Seamlessly connect business systems with Zoho CRM, HubSpot, and custom API integrations"
      },
      {
        "@type": "Service",
        "name": "Business Intelligence Dashboards",
        "description": "Create interactive Power BI dashboards and data analytics solutions"
      },
      {
        "@type": "Service",
        "name": "Web Development",
        "description": "Build scalable web applications using React, .NET Core, and Laravel"
      }
    ]
  };
};

export const generateBlogPostSchema = (post: {
  title: string;
  description: string;
  publishedAt: string;
  modifiedAt?: string;
  slug: string;
  featuredImage?: string;
  author: string;
  category?: string;
}) => {
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
        "https://linkedin.com/in/naqash-thaheem",
        "https://github.com/naqash-thaheem"
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
};

export const generateCourseSchema = (course: {
  title: string;
  description: string;
  slug: string;
  price?: number;
  currency?: string;
  instructor: string;
  duration?: string;
  level?: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "url": `https://naqashthaheem.com/courses/${course.slug}`,
    "provider": {
      "@type": "Organization",
      "name": "Naqash Thaheem",
      "url": "https://naqashthaheem.com"
    },
    "instructor": {
      "@type": "Person",
      "name": course.instructor,
      "url": "https://naqashthaheem.com/about"
    },
    "offers": course.price ? {
      "@type": "Offer",
      "price": course.price,
      "priceCurrency": course.currency || "USD"
    } : undefined,
    "courseMode": "online",
    "educationalLevel": course.level || "Beginner",
    "timeRequired": course.duration
  };
};

export const generateBreadcrumbSchema = (items: Array<{name: string, url: string}>) => {
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
};

export const generateFAQSchema = (faqs: Array<{question: string, answer: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

// Helper function to inject structured data into the page
export const injectStructuredData = (schema: any) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
};
