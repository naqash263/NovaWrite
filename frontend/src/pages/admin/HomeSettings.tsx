import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';

interface HomeSetting {
  id: number;
  key: string;
  type: 'text' | 'image' | 'boolean' | 'json';
  value: string;
  title: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

const HomeSettings: React.FC = () => {
  const [settings, setSettings] = useState<HomeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<HomeSetting | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    type: 'text' as 'text' | 'image' | 'boolean' | 'json',
    value: '',
    title: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });
  const [showKeySuggestions, setShowKeySuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Predefined settings with helpful descriptions and examples
  const predefinedSettings = {
    // Hero Section
    'hero_title': {
      title: 'Hero Title',
      description: 'Main headline displayed at the top of your homepage',
      example: 'Welcome to Naqash Thaheem',
      category: 'Hero Section',
      icon: '🎯'
    },
    'hero_subtitle': {
      title: 'Hero Subtitle',
      description: 'Supporting text below the main title',
      example: 'Your gateway to professional development',
      category: 'Hero Section',
      icon: '📝'
    },
    'hero_cta_text': {
      title: 'Call-to-Action Button Text',
      description: 'Text for the main action button in hero section',
      example: 'Get Started',
      category: 'Hero Section',
      icon: '🚀'
    },
    'hero_cta_url': {
      title: 'Call-to-Action Button URL',
      description: 'Link destination for the main action button',
      example: '/courses',
      category: 'Hero Section',
      icon: '🔗'
    },
    'hero_description': {
      title: 'Hero Description',
      description: 'Additional descriptive text in the hero section',
      example: 'Transform your career with our expert-led courses',
      category: 'Hero Section',
      icon: '📖'
    },

    // Notifications
    'notification_enabled': {
      title: 'Show Notification Banner',
      description: 'Enable or disable the notification banner at the top',
      example: 'true/false',
      category: 'Notifications',
      icon: '🔔'
    },
    'notification_message': {
      title: 'Notification Message',
      description: 'Text displayed in the notification banner',
      example: 'Welcome to our new platform!',
      category: 'Notifications',
      icon: '📢'
    },
    'notification_type': {
      title: 'Notification Type',
      description: 'Style of notification (info, success, warning, error)',
      example: 'info',
      category: 'Notifications',
      icon: '🎨'
    },
    'notification_dismissible': {
      title: 'Notification Dismissible',
      description: 'Whether users can close the notification banner',
      example: 'true/false',
      category: 'Notifications',
      icon: '❌'
    },

    // Content Sections
    'featured_courses_title': {
      title: 'Featured Courses Section Title',
      description: 'Heading for the courses section',
      example: 'Featured Courses',
      category: 'Content Sections',
      icon: '📚'
    },
    'featured_courses_subtitle': {
      title: 'Featured Courses Subtitle',
      description: 'Subheading for the courses section',
      example: 'Discover our most popular courses',
      category: 'Content Sections',
      icon: '📖'
    },
    'featured_workflows_title': {
      title: 'Featured Workflows Section Title',
      description: 'Heading for the workflows section',
      example: 'Popular Workflows',
      category: 'Content Sections',
      icon: '⚡'
    },
    'featured_workflows_subtitle': {
      title: 'Featured Workflows Subtitle',
      description: 'Subheading for the workflows section',
      example: 'Streamline your processes with our templates',
      category: 'Content Sections',
      icon: '📖'
    },
    'testimonials_title': {
      title: 'Testimonials Section Title',
      description: 'Heading for the testimonials section',
      example: 'What Our Students Say',
      category: 'Content Sections',
      icon: '💬'
    },
    'testimonials_subtitle': {
      title: 'Testimonials Subtitle',
      description: 'Subheading for the testimonials section',
      example: 'Hear from our successful graduates',
      category: 'Content Sections',
      icon: '📖'
    },
    'stats_title': {
      title: 'Statistics Section Title',
      description: 'Heading for the statistics section',
      example: 'Our Impact',
      category: 'Content Sections',
      icon: '📊'
    },

    // About Section
    'about_title': {
      title: 'About Section Title',
      description: 'Heading for the about section',
      example: 'About Naqash Thaheem',
      category: 'About Section',
      icon: '👤'
    },
    'about_content': {
      title: 'About Section Content',
      description: 'Main text content for the about section',
      example: 'We are dedicated to providing...',
      category: 'About Section',
      icon: '📄'
    },
    'about_subtitle': {
      title: 'About Section Subtitle',
      description: 'Subheading for the about section',
      example: 'Your trusted learning partner',
      category: 'About Section',
      icon: '📖'
    },
    'about_mission': {
      title: 'Mission Statement',
      description: 'Your organization\'s mission statement',
      example: 'To empower professionals through quality education',
      category: 'About Section',
      icon: '🎯'
    },
    'about_vision': {
      title: 'Vision Statement',
      description: 'Your organization\'s vision statement',
      example: 'A world where everyone has access to quality education',
      category: 'About Section',
      icon: '👁️'
    },

    // Contact Info
    'contact_email': {
      title: 'Contact Email',
      description: 'Primary contact email address',
      example: 'naqash263@gmail.com',
      category: 'Contact Info',
      icon: '📧'
    },
    'contact_phone': {
      title: 'Contact Phone',
      description: 'Primary contact phone number',
      example: '+971 XX XXX XXXX',
      category: 'Contact Info',
      icon: '📞'
    },
    'contact_address': {
      title: 'Contact Address',
      description: 'Physical address or location',
      example: 'Dubai, UAE',
      category: 'Contact Info',
      icon: '📍'
    },
    'contact_website': {
      title: 'Website URL',
      description: 'Main website URL',
      example: 'https://naqashthaheem.com',
      category: 'Contact Info',
      icon: '🌐'
    },
    'social_linkedin': {
      title: 'LinkedIn URL',
      description: 'LinkedIn profile or company page URL',
      example: 'https://linkedin.com/in/naqashthaheem',
      category: 'Contact Info',
      icon: '💼'
    },
    'social_twitter': {
      title: 'Twitter URL',
      description: 'Twitter profile URL',
      example: 'https://twitter.com/naqashthaheem',
      category: 'Contact Info',
      icon: '🐦'
    },
    'social_github': {
      title: 'GitHub URL',
      description: 'GitHub profile URL',
      example: 'https://github.com/naqash263',
      category: 'Contact Info',
      icon: '💻'
    },

    // Images
    'hero_image': {
      title: 'Hero Background Image',
      description: 'Background image for the hero section',
      example: 'hero-bg.jpg',
      category: 'Images',
      icon: '🖼️'
    },
    'about_image': {
      title: 'About Section Image',
      description: 'Image displayed in the about section',
      example: 'about-image.jpg',
      category: 'Images',
      icon: '🖼️'
    },
    'logo_image': {
      title: 'Logo Image',
      description: 'Main logo image for the site',
      example: 'logo.png',
      category: 'Images',
      icon: '🏷️'
    },
    'favicon_image': {
      title: 'Favicon Image',
      description: 'Small icon displayed in browser tabs',
      example: 'favicon.ico',
      category: 'Images',
      icon: '⭐'
    },
    'testimonial_bg_image': {
      title: 'Testimonials Background Image',
      description: 'Background image for testimonials section',
      example: 'testimonials-bg.jpg',
      category: 'Images',
      icon: '🖼️'
    },

    // SEO & Meta
    'meta_title': {
      title: 'Page Title',
      description: 'Main title for SEO and browser tabs',
      example: 'Naqash Thaheem - Professional Development',
      category: 'SEO & Meta',
      icon: '🏷️'
    },
    'meta_description': {
      title: 'Meta Description',
      description: 'Description for search engines',
      example: 'Professional development courses and workflows',
      category: 'SEO & Meta',
      icon: '📝'
    },
    'meta_keywords': {
      title: 'Meta Keywords',
      description: 'Keywords for search engines',
      example: 'courses, workflows, professional development',
      category: 'SEO & Meta',
      icon: '🔍'
    },
    'og_title': {
      title: 'Open Graph Title',
      description: 'Title when shared on social media',
      example: 'Naqash Thaheem - Learn & Grow',
      category: 'SEO & Meta',
      icon: '📱'
    },
    'og_description': {
      title: 'Open Graph Description',
      description: 'Description when shared on social media',
      example: 'Transform your career with our courses',
      category: 'SEO & Meta',
      icon: '📱'
    },
    'og_image': {
      title: 'Open Graph Image',
      description: 'Image when shared on social media',
      example: 'og-image.jpg',
      category: 'SEO & Meta',
      icon: '📱'
    },

    // Footer
    'footer_copyright': {
      title: 'Footer Copyright Text',
      description: 'Copyright text in the footer',
      example: '© 2024 Naqash Thaheem. All rights reserved.',
      category: 'Footer',
      icon: '©️'
    },
    'footer_description': {
      title: 'Footer Description',
      description: 'Brief description in the footer',
      example: 'Empowering professionals through quality education',
      category: 'Footer',
      icon: '📝'
    },
    'footer_links_title': {
      title: 'Footer Links Title',
      description: 'Title for footer links section',
      example: 'Quick Links',
      category: 'Footer',
      icon: '🔗'
    },

    // Features & Benefits
    'features_title': {
      title: 'Features Section Title',
      description: 'Heading for the features section',
      example: 'Why Choose Us',
      category: 'Features & Benefits',
      icon: '⭐'
    },
    'features_subtitle': {
      title: 'Features Section Subtitle',
      description: 'Subheading for the features section',
      example: 'Discover what makes us different',
      category: 'Features & Benefits',
      icon: '📖'
    },
    'benefits_title': {
      title: 'Benefits Section Title',
      description: 'Heading for the benefits section',
      example: 'What You\'ll Gain',
      category: 'Features & Benefits',
      icon: '🎯'
    },

    // Call to Action
    'cta_title': {
      title: 'Call to Action Title',
      description: 'Title for call-to-action section',
      example: 'Ready to Get Started?',
      category: 'Call to Action',
      icon: '🚀'
    },
    'cta_subtitle': {
      title: 'Call to Action Subtitle',
      description: 'Subtitle for call-to-action section',
      example: 'Join thousands of successful professionals',
      category: 'Call to Action',
      icon: '📝'
    },
    'cta_button_text': {
      title: 'CTA Button Text',
      description: 'Text for call-to-action button',
      example: 'Start Learning Today',
      category: 'Call to Action',
      icon: '🎯'
    },
    'cta_button_url': {
      title: 'CTA Button URL',
      description: 'Link for call-to-action button',
      example: '/signup',
      category: 'Call to Action',
      icon: '🔗'
    },

    // Newsletter
    'newsletter_title': {
      title: 'Newsletter Title',
      description: 'Title for newsletter signup section',
      example: 'Stay Updated',
      category: 'Newsletter',
      icon: '📧'
    },
    'newsletter_subtitle': {
      title: 'Newsletter Subtitle',
      description: 'Subtitle for newsletter signup section',
      example: 'Get the latest updates and tips',
      category: 'Newsletter',
      icon: '📝'
    },
    'newsletter_button_text': {
      title: 'Newsletter Button Text',
      description: 'Text for newsletter signup button',
      example: 'Subscribe',
      category: 'Newsletter',
      icon: '📬'
    },
    'newsletter_placeholder': {
      title: 'Newsletter Email Placeholder',
      description: 'Placeholder text for email input field',
      example: 'Enter your email address',
      category: 'Newsletter',
      icon: '📝'
    },
    'newsletter_success_message': {
      title: 'Newsletter Success Message',
      description: 'Message shown after successful subscription',
      example: 'Thank you for subscribing!',
      category: 'Newsletter',
      icon: '✅'
    },

    // Advanced Hero Section
    'hero_video_url': {
      title: 'Hero Background Video URL',
      description: 'URL for background video in hero section',
      example: 'https://example.com/hero-video.mp4',
      category: 'Hero Section',
      icon: '🎥'
    },
    'hero_overlay_opacity': {
      title: 'Hero Overlay Opacity',
      description: 'Opacity of overlay on hero background (0-1)',
      example: '0.5',
      category: 'Hero Section',
      icon: '🎨'
    },
    'hero_text_color': {
      title: 'Hero Text Color',
      description: 'Color of text in hero section',
      example: '#ffffff',
      category: 'Hero Section',
      icon: '🎨'
    },
    'hero_button_color': {
      title: 'Hero Button Color',
      description: 'Background color of hero CTA button',
      example: '#3b82f6',
      category: 'Hero Section',
      icon: '🎨'
    },
    'hero_button_hover_color': {
      title: 'Hero Button Hover Color',
      description: 'Hover color of hero CTA button',
      example: '#2563eb',
      category: 'Hero Section',
      icon: '🎨'
    },

    // Advanced Notifications
    'notification_duration': {
      title: 'Notification Duration',
      description: 'How long notification stays visible (seconds)',
      example: '5',
      category: 'Notifications',
      icon: '⏱️'
    },
    'notification_position': {
      title: 'Notification Position',
      description: 'Position of notification (top, bottom)',
      example: 'top',
      category: 'Notifications',
      icon: '📍'
    },
    'notification_animation': {
      title: 'Notification Animation',
      description: 'Animation type for notification (slide, fade)',
      example: 'slide',
      category: 'Notifications',
      icon: '✨'
    },

    // Advanced Content Sections
    'courses_limit': {
      title: 'Featured Courses Limit',
      description: 'Maximum number of courses to display',
      example: '6',
      category: 'Content Sections',
      icon: '🔢'
    },
    'workflows_limit': {
      title: 'Featured Workflows Limit',
      description: 'Maximum number of workflows to display',
      example: '4',
      category: 'Content Sections',
      icon: '🔢'
    },
    'testimonials_limit': {
      title: 'Testimonials Limit',
      description: 'Maximum number of testimonials to display',
      example: '3',
      category: 'Content Sections',
      icon: '🔢'
    },
    'stats_students_count': {
      title: 'Total Students Count',
      description: 'Number of students for statistics display',
      example: '1000+',
      category: 'Content Sections',
      icon: '👥'
    },
    'stats_courses_count': {
      title: 'Total Courses Count',
      description: 'Number of courses for statistics display',
      example: '50+',
      category: 'Content Sections',
      icon: '📚'
    },
    'stats_success_rate': {
      title: 'Success Rate Percentage',
      description: 'Success rate percentage for statistics',
      example: '95%',
      category: 'Content Sections',
      icon: '📈'
    },

    // Advanced About Section
    'about_experience_years': {
      title: 'Years of Experience',
      description: 'Number of years of experience to display',
      example: '10+',
      category: 'About Section',
      icon: '⏰'
    },
    'about_skills': {
      title: 'Key Skills',
      description: 'Comma-separated list of key skills',
      example: 'React, Node.js, Python, AI/ML',
      category: 'About Section',
      icon: '🛠️'
    },
    'about_certifications': {
      title: 'Certifications',
      description: 'Professional certifications to display',
      example: 'AWS Certified, Google Cloud Professional',
      category: 'About Section',
      icon: '🏆'
    },
    'about_education': {
      title: 'Education Background',
      description: 'Educational qualifications',
      example: 'MSc Computer Science, BSc Engineering',
      category: 'About Section',
      icon: '🎓'
    },

    // Advanced Contact Info
    'contact_whatsapp': {
      title: 'WhatsApp Number',
      description: 'WhatsApp contact number',
      example: '+971501234567',
      category: 'Contact Info',
      icon: '💬'
    },
    'contact_telegram': {
      title: 'Telegram Username',
      description: 'Telegram username or link',
      example: '@naqashthaheem',
      category: 'Contact Info',
      icon: '✈️'
    },
    'contact_skype': {
      title: 'Skype Username',
      description: 'Skype username for contact',
      example: 'naqash.thaheem',
      category: 'Contact Info',
      icon: '📞'
    },
    'contact_timezone': {
      title: 'Timezone',
      description: 'Your timezone for contact purposes',
      example: 'GMT+4 (UAE)',
      category: 'Contact Info',
      icon: '🌍'
    },
    'contact_availability': {
      title: 'Availability Hours',
      description: 'When you are available for contact',
      example: '9 AM - 6 PM (UAE Time)',
      category: 'Contact Info',
      icon: '🕐'
    },

    // Advanced Images
    'logo_light': {
      title: 'Light Logo',
      description: 'Logo for light backgrounds',
      example: 'logo-light.png',
      category: 'Images',
      icon: '☀️'
    },
    'logo_dark': {
      title: 'Dark Logo',
      description: 'Logo for dark backgrounds',
      example: 'logo-dark.png',
      category: 'Images',
      icon: '🌙'
    },
    'hero_mobile_image': {
      title: 'Hero Mobile Image',
      description: 'Hero image optimized for mobile devices',
      example: 'hero-mobile.jpg',
      category: 'Images',
      icon: '📱'
    },
    'about_mobile_image': {
      title: 'About Mobile Image',
      description: 'About image optimized for mobile devices',
      example: 'about-mobile.jpg',
      category: 'Images',
      icon: '📱'
    },
    'og_image_alt': {
      title: 'Open Graph Image Alt Text',
      description: 'Alt text for Open Graph image',
      example: 'Naqash Thaheem - Professional Development',
      category: 'Images',
      icon: '🖼️'
    },

    // Advanced SEO & Meta
    'meta_author': {
      title: 'Meta Author',
      description: 'Author name for meta tags',
      example: 'Naqash Thaheem',
      category: 'SEO & Meta',
      icon: '👤'
    },
    'meta_robots': {
      title: 'Meta Robots',
      description: 'Robots meta tag content',
      example: 'index, follow',
      category: 'SEO & Meta',
      icon: '🤖'
    },
    'canonical_url': {
      title: 'Canonical URL',
      description: 'Canonical URL for SEO',
      example: 'https://naqashthaheem.com',
      category: 'SEO & Meta',
      icon: '🔗'
    },
    'og_site_name': {
      title: 'Open Graph Site Name',
      description: 'Site name for Open Graph',
      example: 'Naqash Thaheem',
      category: 'SEO & Meta',
      icon: '🏷️'
    },
    'twitter_card': {
      title: 'Twitter Card Type',
      description: 'Type of Twitter card (summary, summary_large_image)',
      example: 'summary_large_image',
      category: 'SEO & Meta',
      icon: '🐦'
    },
    'twitter_handle': {
      title: 'Twitter Handle',
      description: 'Twitter handle for social sharing',
      example: '@naqashthaheem',
      category: 'SEO & Meta',
      icon: '🐦'
    },

    // Advanced Footer
    'footer_logo': {
      title: 'Footer Logo',
      description: 'Logo to display in footer',
      example: 'footer-logo.png',
      category: 'Footer',
      icon: '🏷️'
    },
    'footer_links': {
      title: 'Footer Links',
      description: 'JSON array of footer links',
      example: '[{"title":"Privacy Policy","url":"/privacy"}]',
      category: 'Footer',
      icon: '🔗'
    },
    'footer_social_links': {
      title: 'Footer Social Links',
      description: 'JSON array of social media links',
      example: '[{"platform":"linkedin","url":"https://linkedin.com/in/naqashthaheem"}]',
      category: 'Footer',
      icon: '📱'
    },
    'footer_newsletter_title': {
      title: 'Footer Newsletter Title',
      description: 'Title for newsletter signup in footer',
      example: 'Stay Connected',
      category: 'Footer',
      icon: '📧'
    },

    // Advanced Features & Benefits
    'features_list': {
      title: 'Features List',
      description: 'JSON array of features to display',
      example: '[{"icon":"🚀","title":"Fast Learning","description":"Quick and effective courses"}]',
      category: 'Features & Benefits',
      icon: '⭐'
    },
    'benefits_list': {
      title: 'Benefits List',
      description: 'JSON array of benefits to display',
      example: '[{"icon":"💼","title":"Career Growth","description":"Advance your career"}]',
      category: 'Features & Benefits',
      icon: '🎯'
    },
    'testimonials_list': {
      title: 'Testimonials List',
      description: 'JSON array of testimonials',
      example: '[{"name":"John Doe","role":"Developer","text":"Great courses!"}]',
      category: 'Features & Benefits',
      icon: '💬'
    },

    // Advanced Call to Action
    'cta_background_color': {
      title: 'CTA Background Color',
      description: 'Background color for CTA section',
      example: '#f8fafc',
      category: 'Call to Action',
      icon: '🎨'
    },
    'cta_text_color': {
      title: 'CTA Text Color',
      description: 'Text color for CTA section',
      example: '#1f2937',
      category: 'Call to Action',
      icon: '🎨'
    },
    'cta_button_style': {
      title: 'CTA Button Style',
      description: 'Style of CTA button (primary, secondary, outline)',
      example: 'primary',
      category: 'Call to Action',
      icon: '🎨'
    },

    // Performance & Analytics
    'google_analytics_id': {
      title: 'Google Analytics ID',
      description: 'Google Analytics tracking ID',
      example: 'GA-XXXXXXXXX-X',
      category: 'Analytics',
      icon: '📊'
    },
    'google_tag_manager_id': {
      title: 'Google Tag Manager ID',
      description: 'Google Tag Manager container ID',
      example: 'GTM-XXXXXXX',
      category: 'Analytics',
      icon: '🏷️'
    },
    'facebook_pixel_id': {
      title: 'Facebook Pixel ID',
      description: 'Facebook Pixel tracking ID',
      example: '123456789012345',
      category: 'Analytics',
      icon: '📘'
    },
    'hotjar_id': {
      title: 'Hotjar Site ID',
      description: 'Hotjar site ID for user behavior tracking',
      example: '1234567',
      category: 'Analytics',
      icon: '🔥'
    },

    // Security & Privacy
    'privacy_policy_url': {
      title: 'Privacy Policy URL',
      description: 'URL to privacy policy page',
      example: '/privacy-policy',
      category: 'Legal',
      icon: '🔒'
    },
    'terms_of_service_url': {
      title: 'Terms of Service URL',
      description: 'URL to terms of service page',
      example: '/terms-of-service',
      category: 'Legal',
      icon: '📋'
    },
    'cookie_policy_url': {
      title: 'Cookie Policy URL',
      description: 'URL to cookie policy page',
      example: '/cookie-policy',
      category: 'Legal',
      icon: '🍪'
    },
    'gdpr_compliance': {
      title: 'GDPR Compliance',
      description: 'Enable GDPR compliance features',
      example: 'true/false',
      category: 'Legal',
      icon: '🇪🇺'
    }
  };
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Helper function to get predefined setting info
  const getPredefinedInfo = (key: string) => {
    return predefinedSettings[key as keyof typeof predefinedSettings] || {
      title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: 'Custom setting',
      example: '',
      category: 'Custom',
      icon: '⚙️'
    };
  };

  // Helper function to group settings by category
  const groupSettingsByCategory = (settings: HomeSetting[]) => {
    const grouped: { [key: string]: HomeSetting[] } = {};
    settings.forEach(setting => {
      const info = getPredefinedInfo(setting.key);
      const category = info.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(setting);
    });
    return grouped;
  };

  // Handle predefined key selection
  const handlePredefinedKeySelect = (key: string) => {
    const info = predefinedSettings[key as keyof typeof predefinedSettings];
    if (info) {
      setFormData(prev => ({
        ...prev,
        key: key,
        title: info.title,
        description: info.description,
        type: key.includes('image') ? 'image' : key.includes('enabled') ? 'boolean' : 'text'
      }));
      setShowKeySuggestions(false);
    }
  };

  // Get available predefined keys (excluding existing ones)
  const getAvailablePredefinedKeys = () => {
    const existingKeys = settings.map(s => s.key);
    let filteredKeys = Object.entries(predefinedSettings)
      .filter(([key]) => !existingKeys.includes(key))
      .map(([key, info]) => ({ key, ...info }));
    
    // Filter by selected category if one is selected
    if (selectedCategory) {
      filteredKeys = filteredKeys.filter(keyInfo => keyInfo.category === selectedCategory);
    }
    
    return filteredKeys;
  };

  // Get all available categories
  const getAllCategories = () => {
    const categories = new Set<string>();
    Object.values(predefinedSettings).forEach(setting => {
      categories.add(setting.category);
    });
    return Array.from(categories).sort();
  };

  // Filter settings by selected category
  const getFilteredSettings = () => {
    if (!selectedCategory) return settings;
    return settings.filter(setting => {
      const info = getPredefinedInfo(setting.key);
      return info.category === selectedCategory;
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showKeySuggestions) {
        const target = event.target as HTMLElement;
        if (!target.closest('.key-suggestions-container')) {
          setShowKeySuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showKeySuggestions]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/home-settings');
      setSettings(response.data.settings);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSetting) {
        await apiClient.put(`/admin/home-settings/${editingSetting.id}`, formData);
      } else {
        await apiClient.post('/admin/home-settings', formData);
      }
      setShowModal(false);
      setEditingSetting(null);
      setFormData({
        key: '',
        type: 'text',
        value: '',
        title: '',
        description: '',
        is_active: true,
        sort_order: 0,
      });
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save setting');
    }
  };

  const handleEdit = (setting: HomeSetting) => {
    const predefinedInfo = getPredefinedInfo(setting.key);
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      type: setting.type,
      value: setting.value,
      title: setting.title || predefinedInfo.title,
      description: setting.description || predefinedInfo.description,
      is_active: setting.is_active,
      sort_order: setting.sort_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this setting?')) return;
    
    try {
      await apiClient.delete(`/admin/home-settings/${id}`);
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete setting');
    }
  };

  const handleToggleActive = async (setting: HomeSetting) => {
    try {
      await apiClient.post(`/admin/home-settings/${setting.id}/toggle-active`);
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle setting');
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.key) return;

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('image', selectedFile);
      formDataUpload.append('key', formData.key);

      const response = await apiClient.post('/admin/home-settings/upload-image', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData(prev => ({
        ...prev,
        value: response.data.setting.value,
        type: 'image',
        title: response.data.setting.title,
      }));
      
      setSelectedFile(null);
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allCategories = getAllCategories();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white shadow-lg flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h2 className="text-lg font-semibold text-gray-900">Settings Categories</h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {/* All Settings */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                !selectedCategory
                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">📋</span>
                {sidebarOpen && (
                  <div>
                    <div className="font-medium">All Settings</div>
                    <div className="text-sm text-gray-500">{settings.length} total</div>
                  </div>
                )}
              </div>
            </button>

            {/* Category Buttons */}
            {allCategories.map((category) => {
              const categorySettings = settings.filter(setting => {
                const info = getPredefinedInfo(setting.key);
                return info.category === category;
              });
              const isSelected = selectedCategory === category;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {category === 'Hero Section' && '🎯'}
                      {category === 'Notifications' && '🔔'}
                      {category === 'Content Sections' && '📚'}
                      {category === 'About Section' && '👤'}
                      {category === 'Contact Info' && '📧'}
                      {category === 'Images' && '🖼️'}
                      {category === 'SEO & Meta' && '🔍'}
                      {category === 'Footer' && '©️'}
                      {category === 'Features & Benefits' && '⭐'}
                      {category === 'Call to Action' && '🚀'}
                      {category === 'Newsletter' && '📧'}
                      {category === 'Analytics' && '📊'}
                      {category === 'Legal' && '🔒'}
                      {category === 'Custom' && '⚙️'}
                    </span>
                    {sidebarOpen && (
                      <div>
                        <div className="font-medium">{category}</div>
                        <div className="text-sm text-gray-500">{categorySettings.length} settings</div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              💡 <strong>Tip:</strong> Click a category to filter settings
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Home Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your home page content, images, and notifications
              {selectedCategory && (
                <span className="ml-2 text-blue-600 font-medium">
                  • Filtered by: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="ml-2 text-red-600 hover:text-red-800 underline text-sm"
                    title="Clear filter"
                  >
                    (Clear Filter)
                  </button>
                </span>
              )}
            </p>
            
            {/* Quick Help Guide */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">📚 Quick Guide for New Admins</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Hero Section:</strong> Main title, subtitle, and call-to-action button text</p>
                <p>• <strong>Notifications:</strong> Banner messages that appear at the top of the homepage</p>
                <p>• <strong>Content Sections:</strong> Titles for different sections like courses and workflows</p>
                <p>• <strong>About Section:</strong> Information about you or your company</p>
                <p>• <strong>Contact Info:</strong> Email and phone number displayed on the site</p>
                <p>• <strong>Images:</strong> Background images for hero and about sections</p>
                <p>• <strong>SEO & Meta:</strong> Search engine optimization settings</p>
                <p>• <strong>Footer:</strong> Footer content and links</p>
                <p className="mt-2 text-blue-700">💡 <strong>Tip:</strong> Use the sidebar to filter settings by category. Click "Edit" on any setting to modify its value!</p>
              </div>
            </div>
          </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => {
            setEditingSetting(null);
            setFormData({
              key: '',
              type: 'text',
              value: '',
              title: '',
              description: '',
              is_active: true,
              sort_order: 0,
            });
            setShowKeySuggestions(false);
            // Don't reset category filter - keep it for context-aware suggestions
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Setting
        </button>
      </div>

      {/* Settings by Category */}
      <div className="space-y-8">
        {Object.entries(groupSettingsByCategory(getFilteredSettings())).map(([category, categorySettings]) => (
          <div key={category} className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📋</span>
                {category} ({categorySettings.length} settings)
              </h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4">
                {categorySettings.map((setting) => {
                  const info = getPredefinedInfo(setting.key);
                  return (
                    <div key={setting.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{info.icon}</span>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{info.title}</h3>
                            <p className="text-sm text-gray-500 font-mono">Key: {setting.key}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleActive(setting)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              setting.is_active 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {setting.is_active ? '✅ Active' : '⏸️ Inactive'}
                          </button>
                          <button
                            onClick={() => handleEdit(setting)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 border border-blue-200 font-medium"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(setting.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 border border-red-200 font-medium"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="ml-11">
                        <p className="text-gray-600 mb-3">{info.description}</p>
                        
                        {info.example && (
                          <div className="bg-gray-50 rounded p-2 mb-3">
                            <p className="text-xs text-gray-500 mb-1">Example:</p>
                            <p className="text-sm text-gray-700 font-mono">{info.example}</p>
                          </div>
                        )}
                        
                        <div className="bg-blue-50 rounded p-3">
                          <p className="text-xs text-blue-600 mb-1 font-medium">Current Value:</p>
                          {setting.type === 'image' ? (
                            <div>
                              <p className="text-sm text-gray-800 mb-2">{setting.value}</p>
                              {setting.image_url && (
                                <img 
                                  src={setting.image_url} 
                                  alt={setting.title}
                                  className="w-32 h-20 object-cover rounded border"
                                />
                              )}
                            </div>
                          ) : setting.type === 'boolean' ? (
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              setting.value === '1' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                            }`}>
                              {setting.value === '1' ? '✅ Enabled' : '❌ Disabled'}
                            </span>
                          ) : (
                            <p className="text-sm text-gray-800 break-words">{setting.value}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingSetting ? 'Edit Setting' : 'Add New Setting'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setting Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                    placeholder="Enter setting key (e.g., hero_title)"
                    required
                    disabled={!!editingSetting}
                  />
                  {!editingSetting && (
                    <button
                      type="button"
                      onClick={() => setShowKeySuggestions(!showKeySuggestions)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                      title="Browse predefined keys"
                    >
                      📋
                    </button>
                  )}
                </div>
                
                {/* Key Suggestions Dropdown */}
                {showKeySuggestions && !editingSetting && (
                  <div className="key-suggestions-container mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto z-10 relative">
                    <div className="p-3 bg-gray-50 border-b">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Choose from predefined keys:
                        {selectedCategory && (
                          <span className="ml-2 text-blue-600 font-medium">
                            (Filtered by: {selectedCategory})
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Select a key to auto-fill title and description
                        {selectedCategory ? ` • Showing only ${selectedCategory} keys` : ' • Showing all available keys'}
                      </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {getAvailablePredefinedKeys().map(({ key, title, description, icon, category }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handlePredefinedKeySelect(key)}
                          className="w-full text-left p-3 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">{icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{title}</span>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{category}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{description}</p>
                              <p className="text-xs text-gray-500 font-mono mt-1">Key: {key}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                      {getAvailablePredefinedKeys().length === 0 && (
                        <div className="p-3 text-center text-gray-500">
                          <p className="text-sm">All predefined keys are already in use.</p>
                          <p className="text-xs mt-1">You can create a custom key by typing it manually.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Key Format Help */}
                {!editingSetting && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p><strong>Key format:</strong> Use lowercase letters and underscores (e.g., hero_title, notification_message)</p>
                    <p><strong>Examples:</strong> hero_title, about_content, contact_email, notification_enabled</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              {formData.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploading}
                      className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  )}
                </div>
              )}

              {formData.type !== 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  {formData.type === 'boolean' ? (
                    <select
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  ) : formData.type === 'json' ? (
                    <textarea
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={4}
                      placeholder="Enter JSON data"
                    />
                  ) : (
                    <textarea
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                    />
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    Active
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSetting(null);
                    setFormData({
                      key: '',
                      type: 'text',
                      value: '',
                      title: '',
                      description: '',
                      is_active: true,
                      sort_order: 0,
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingSetting ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default HomeSettings;
