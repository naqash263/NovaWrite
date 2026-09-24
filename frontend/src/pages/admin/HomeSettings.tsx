import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, ChevronDown, House, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import apiClient from '../../api/axios';
import { API_CONFIG } from '../../config/api';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

type SettingType = 'text' | 'image' | 'boolean' | 'json';

interface HomeSetting {
  id: number;
  key: string;
  type: SettingType;
  value: string | null;
  title: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  image_url?: string;
}

interface PredefinedSetting {
  title: string;
  description: string;
  example: string;
  category: string;
}

/** Known setting keys with help text, grouped into categories. */
const PREDEFINED_SETTINGS: Record<string, PredefinedSetting> = {
  // Hero Section
  'hero_title': {
    title: 'Hero Title',
    description: 'Main headline displayed at the top of your homepage',
    example: 'Welcome to Naqash Thaheem',
    category: 'Hero Section',
  },
  'hero_subtitle': {
    title: 'Hero Subtitle',
    description: 'Supporting text below the main title',
    example: 'Your gateway to professional development',
    category: 'Hero Section',
  },
  'hero_cta_text': {
    title: 'Call-to-Action Button Text',
    description: 'Text for the main action button in hero section',
    example: 'Get Started',
    category: 'Hero Section',
  },
  'hero_cta_url': {
    title: 'Call-to-Action Button URL',
    description: 'Link destination for the main action button',
    example: '/courses',
    category: 'Hero Section',
  },
  'hero_description': {
    title: 'Hero Description',
    description: 'Additional descriptive text in the hero section',
    example: 'Transform your career with our expert-led courses',
    category: 'Hero Section',
  },

  // Notifications
  'notification_enabled': {
    title: 'Show Notification Banner',
    description: 'Enable or disable the notification banner at the top',
    example: 'true/false',
    category: 'Notifications',
  },
  'notification_message': {
    title: 'Notification Message',
    description: 'Text displayed in the notification banner',
    example: 'Welcome to our new platform!',
    category: 'Notifications',
  },
  'notification_type': {
    title: 'Notification Type',
    description: 'Style of notification (info, success, warning, error)',
    example: 'info',
    category: 'Notifications',
  },
  'notification_dismissible': {
    title: 'Notification Dismissible',
    description: 'Whether users can close the notification banner',
    example: 'true/false',
    category: 'Notifications',
  },

  // Content Sections
  'featured_courses_title': {
    title: 'Featured Courses Section Title',
    description: 'Heading for the courses section',
    example: 'Featured Courses',
    category: 'Content Sections',
  },
  'featured_courses_subtitle': {
    title: 'Featured Courses Subtitle',
    description: 'Subheading for the courses section',
    example: 'Discover our most popular courses',
    category: 'Content Sections',
  },
  'featured_workflows_title': {
    title: 'Featured Workflows Section Title',
    description: 'Heading for the workflows section',
    example: 'Popular Workflows',
    category: 'Content Sections',
  },
  'featured_workflows_subtitle': {
    title: 'Featured Workflows Subtitle',
    description: 'Subheading for the workflows section',
    example: 'Streamline your processes with our templates',
    category: 'Content Sections',
  },
  'testimonials_title': {
    title: 'Testimonials Section Title',
    description: 'Heading for the testimonials section',
    example: 'What Our Students Say',
    category: 'Content Sections',
  },
  'testimonials_subtitle': {
    title: 'Testimonials Subtitle',
    description: 'Subheading for the testimonials section',
    example: 'Hear from our successful graduates',
    category: 'Content Sections',
  },
  'stats_title': {
    title: 'Statistics Section Title',
    description: 'Heading for the statistics section',
    example: 'Our Impact',
    category: 'Content Sections',
  },

  // About Section
  'about_title': {
    title: 'About Section Title',
    description: 'Heading for the about section',
    example: 'About Naqash Thaheem',
    category: 'About Section',
  },
  'about_content': {
    title: 'About Section Content',
    description: 'Main text content for the about section',
    example: 'We are dedicated to providing...',
    category: 'About Section',
  },
  'about_subtitle': {
    title: 'About Section Subtitle',
    description: 'Subheading for the about section',
    example: 'Your trusted learning partner',
    category: 'About Section',
  },
  'about_mission': {
    title: 'Mission Statement',
    description: 'Your organization\'s mission statement',
    example: 'To empower professionals through quality education',
    category: 'About Section',
  },
  'about_vision': {
    title: 'Vision Statement',
    description: 'Your organization\'s vision statement',
    example: 'A world where everyone has access to quality education',
    category: 'About Section',
  },

  // Contact Info
  'contact_email': {
    title: 'Contact Email',
    description: 'Primary contact email address',
    example: 'naqash263@gmail.com',
    category: 'Contact Info',
  },
  'contact_phone': {
    title: 'Contact Phone',
    description: 'Primary contact phone number',
    example: '+971 XX XXX XXXX',
    category: 'Contact Info',
  },
  'contact_address': {
    title: 'Contact Address',
    description: 'Physical address or location',
    example: 'Dubai, UAE',
    category: 'Contact Info',
  },
  'contact_website': {
    title: 'Website URL',
    description: 'Main website URL',
    example: 'https://naqashthaheem.com',
    category: 'Contact Info',
  },
  'social_linkedin': {
    title: 'LinkedIn URL',
    description: 'LinkedIn profile or company page URL',
    example: 'https://www.linkedin.com/in/naqash-thaheem-297464147',
    category: 'Contact Info',
  },
  'social_twitter': {
    title: 'Twitter URL',
    description: 'Twitter profile URL',
    example: 'https://twitter.com/naqashthaheem',
    category: 'Contact Info',
  },
  'social_github': {
    title: 'GitHub URL',
    description: 'GitHub profile URL',
    example: 'https://github.com/naqash263',
    category: 'Contact Info',
  },

  // Images
  'profile_image': {
    title: 'Profile Photo',
    description: 'Your professional profile photo displayed in the hero section',
    example: 'profile.jpg',
    category: 'Images',
  },
  'hero_image': {
    title: 'Hero Background Image',
    description: 'Background image for the hero section',
    example: 'hero-bg.jpg',
    category: 'Images',
  },
  'about_image': {
    title: 'About Page Hero Background',
    description: 'Background image for the About page hero section',
    example: 'about-bg.jpg',
    category: 'Images',
  },
  'contact_image': {
    title: 'Contact Page Hero Background',
    description: 'Background image for the Contact page hero section',
    example: 'contact-bg.jpg',
    category: 'Images',
  },
  'workflows_image': {
    title: 'Workflows Page Hero Background',
    description: 'Background image for the Workflows page hero section',
    example: 'workflows-bg.jpg',
    category: 'Images',
  },
  'logo_image': {
    title: 'Logo Image',
    description: 'Main logo image for the site',
    example: 'logo.png',
    category: 'Images',
  },
  'favicon_image': {
    title: 'Favicon Image',
    description: 'Small icon displayed in browser tabs',
    example: 'favicon.ico',
    category: 'Images',
  },
  'testimonial_bg_image': {
    title: 'Testimonials Background Image',
    description: 'Background image for testimonials section',
    example: 'testimonials-bg.jpg',
    category: 'Images',
  },

  // SEO & Meta
  'meta_title': {
    title: 'Page Title',
    description: 'Main title for SEO and browser tabs',
    example: 'Naqash Thaheem - Professional Development',
    category: 'SEO & Meta',
  },
  'meta_description': {
    title: 'Meta Description',
    description: 'Description for search engines',
    example: 'Professional development courses and workflows',
    category: 'SEO & Meta',
  },
  'meta_keywords': {
    title: 'Meta Keywords',
    description: 'Keywords for search engines',
    example: 'courses, workflows, professional development',
    category: 'SEO & Meta',
  },
  'og_title': {
    title: 'Open Graph Title',
    description: 'Title when shared on social media',
    example: 'Naqash Thaheem - Learn & Grow',
    category: 'SEO & Meta',
  },
  'og_description': {
    title: 'Open Graph Description',
    description: 'Description when shared on social media',
    example: 'Transform your career with our courses',
    category: 'SEO & Meta',
  },
  'og_image': {
    title: 'Open Graph Image',
    description: 'Image when shared on social media',
    example: 'og-image.jpg',
    category: 'SEO & Meta',
  },

  // Footer
  'footer_copyright': {
    title: 'Footer Copyright Text',
    description: 'Copyright text in the footer',
    example: '© 2024 Naqash Thaheem. All rights reserved.',
    category: 'Footer',
  },
  'footer_description': {
    title: 'Footer Description',
    description: 'Brief description in the footer',
    example: 'Empowering professionals through quality education',
    category: 'Footer',
  },
  'footer_links_title': {
    title: 'Footer Links Title',
    description: 'Title for footer links section',
    example: 'Quick Links',
    category: 'Footer',
  },

  // Features & Benefits
  'features_title': {
    title: 'Features Section Title',
    description: 'Heading for the features section',
    example: 'Why Choose Us',
    category: 'Features & Benefits',
  },
  'features_subtitle': {
    title: 'Features Section Subtitle',
    description: 'Subheading for the features section',
    example: 'Discover what makes us different',
    category: 'Features & Benefits',
  },
  'benefits_title': {
    title: 'Benefits Section Title',
    description: 'Heading for the benefits section',
    example: 'What You\'ll Gain',
    category: 'Features & Benefits',
  },

  // Call to Action
  'cta_title': {
    title: 'Call to Action Title',
    description: 'Title for call-to-action section',
    example: 'Ready to Get Started?',
    category: 'Call to Action',
  },
  'cta_subtitle': {
    title: 'Call to Action Subtitle',
    description: 'Subtitle for call-to-action section',
    example: 'Join thousands of successful professionals',
    category: 'Call to Action',
  },
  'cta_button_text': {
    title: 'CTA Button Text',
    description: 'Text for call-to-action button',
    example: 'Start Learning Today',
    category: 'Call to Action',
  },
  'cta_button_url': {
    title: 'CTA Button URL',
    description: 'Link for call-to-action button',
    example: '/signup',
    category: 'Call to Action',
  },

  // Newsletter
  'newsletter_title': {
    title: 'Newsletter Title',
    description: 'Title for newsletter signup section',
    example: 'Stay Updated',
    category: 'Newsletter',
  },
  'newsletter_subtitle': {
    title: 'Newsletter Subtitle',
    description: 'Subtitle for newsletter signup section',
    example: 'Get the latest updates and tips',
    category: 'Newsletter',
  },
  'newsletter_button_text': {
    title: 'Newsletter Button Text',
    description: 'Text for newsletter signup button',
    example: 'Subscribe',
    category: 'Newsletter',
  },
  'newsletter_placeholder': {
    title: 'Newsletter Email Placeholder',
    description: 'Placeholder text for email input field',
    example: 'Enter your email address',
    category: 'Newsletter',
  },
  'newsletter_success_message': {
    title: 'Newsletter Success Message',
    description: 'Message shown after successful subscription',
    example: 'Thank you for subscribing!',
    category: 'Newsletter',
  },

  // Advanced Hero Section
  'hero_video_url': {
    title: 'Hero Background Video URL',
    description: 'URL for background video in hero section',
    example: 'https://example.com/hero-video.mp4',
    category: 'Hero Section',
  },
  'hero_overlay_opacity': {
    title: 'Hero Overlay Opacity',
    description: 'Opacity of overlay on hero background (0-1)',
    example: '0.5',
    category: 'Hero Section',
  },
  'hero_text_color': {
    title: 'Hero Text Color',
    description: 'Color of text in hero section',
    example: '#ffffff',
    category: 'Hero Section',
  },
  'hero_button_color': {
    title: 'Hero Button Color',
    description: 'Background color of hero CTA button',
    example: '#3b82f6',
    category: 'Hero Section',
  },
  'hero_button_hover_color': {
    title: 'Hero Button Hover Color',
    description: 'Hover color of hero CTA button',
    example: '#2563eb',
    category: 'Hero Section',
  },

  // Advanced Notifications
  'notification_duration': {
    title: 'Notification Duration',
    description: 'How long notification stays visible (seconds)',
    example: '5',
    category: 'Notifications',
  },
  'notification_position': {
    title: 'Notification Position',
    description: 'Position of notification (top, bottom)',
    example: 'top',
    category: 'Notifications',
  },
  'notification_animation': {
    title: 'Notification Animation',
    description: 'Animation type for notification (slide, fade)',
    example: 'slide',
    category: 'Notifications',
  },

  // Advanced Content Sections
  'courses_limit': {
    title: 'Featured Courses Limit',
    description: 'Maximum number of courses to display',
    example: '6',
    category: 'Content Sections',
  },
  'workflows_limit': {
    title: 'Featured Workflows Limit',
    description: 'Maximum number of workflows to display',
    example: '4',
    category: 'Content Sections',
  },
  'testimonials_limit': {
    title: 'Testimonials Limit',
    description: 'Maximum number of testimonials to display',
    example: '3',
    category: 'Content Sections',
  },
  'stats_students_count': {
    title: 'Total Students Count',
    description: 'Number of students for statistics display',
    example: '1000+',
    category: 'Content Sections',
  },
  'stats_courses_count': {
    title: 'Total Courses Count',
    description: 'Number of courses for statistics display',
    example: '50+',
    category: 'Content Sections',
  },
  'stats_success_rate': {
    title: 'Success Rate Percentage',
    description: 'Success rate percentage for statistics',
    example: '95%',
    category: 'Content Sections',
  },

  // Advanced About Section
  'about_experience_years': {
    title: 'Years of Experience',
    description: 'Number of years of experience to display',
    example: '10+',
    category: 'About Section',
  },
  'about_skills': {
    title: 'Key Skills',
    description: 'Comma-separated list of key skills',
    example: 'React, Node.js, Python, AI/ML',
    category: 'About Section',
  },
  'about_certifications': {
    title: 'Certifications',
    description: 'Professional certifications to display',
    example: 'AWS Certified, Google Cloud Professional',
    category: 'About Section',
  },
  'about_education': {
    title: 'Education Background',
    description: 'Educational qualifications',
    example: 'MSc Computer Science, BSc Engineering',
    category: 'About Section',
  },

  // Advanced Contact Info
  'contact_whatsapp': {
    title: 'WhatsApp Number',
    description: 'WhatsApp contact number',
    example: '+971501234567',
    category: 'Contact Info',
  },
  'contact_telegram': {
    title: 'Telegram Username',
    description: 'Telegram username or link',
    example: '@naqashthaheem',
    category: 'Contact Info',
  },
  'contact_skype': {
    title: 'Skype Username',
    description: 'Skype username for contact',
    example: 'naqash.thaheem',
    category: 'Contact Info',
  },
  'contact_timezone': {
    title: 'Timezone',
    description: 'Your timezone for contact purposes',
    example: 'GMT+4 (UAE)',
    category: 'Contact Info',
  },
  'contact_availability': {
    title: 'Availability Hours',
    description: 'When you are available for contact',
    example: '9 AM - 6 PM (UAE Time)',
    category: 'Contact Info',
  },

  // Advanced Images
  'logo_light': {
    title: 'Light Logo',
    description: 'Logo for light backgrounds',
    example: 'logo-light.png',
    category: 'Images',
  },
  'logo_dark': {
    title: 'Dark Logo',
    description: 'Logo for dark backgrounds',
    example: 'logo-dark.png',
    category: 'Images',
  },
  'hero_mobile_image': {
    title: 'Hero Mobile Image',
    description: 'Hero image optimized for mobile devices',
    example: 'hero-mobile.jpg',
    category: 'Images',
  },
  'about_mobile_image': {
    title: 'About Mobile Image',
    description: 'About image optimized for mobile devices',
    example: 'about-mobile.jpg',
    category: 'Images',
  },
  'og_image_alt': {
    title: 'Open Graph Image Alt Text',
    description: 'Alt text for Open Graph image',
    example: 'Naqash Thaheem - Professional Development',
    category: 'Images',
  },

  // Advanced SEO & Meta
  'meta_author': {
    title: 'Meta Author',
    description: 'Author name for meta tags',
    example: 'Naqash Thaheem',
    category: 'SEO & Meta',
  },
  'meta_robots': {
    title: 'Meta Robots',
    description: 'Robots meta tag content',
    example: 'index, follow',
    category: 'SEO & Meta',
  },
  'canonical_url': {
    title: 'Canonical URL',
    description: 'Canonical URL for SEO',
    example: 'https://naqashthaheem.com',
    category: 'SEO & Meta',
  },
  'og_site_name': {
    title: 'Open Graph Site Name',
    description: 'Site name for Open Graph',
    example: 'Naqash Thaheem',
    category: 'SEO & Meta',
  },
  'twitter_card': {
    title: 'Twitter Card Type',
    description: 'Type of Twitter card (summary, summary_large_image)',
    example: 'summary_large_image',
    category: 'SEO & Meta',
  },
  'twitter_handle': {
    title: 'Twitter Handle',
    description: 'Twitter handle for social sharing',
    example: '@naqashthaheem',
    category: 'SEO & Meta',
  },

  // Advanced Footer
  'footer_logo': {
    title: 'Footer Logo',
    description: 'Logo to display in footer',
    example: 'footer-logo.png',
    category: 'Footer',
  },
  'footer_links': {
    title: 'Footer Links',
    description: 'JSON array of footer links',
    example: '[{"title":"Privacy Policy","url":"/privacy"}]',
    category: 'Footer',
  },
  'footer_social_links': {
    title: 'Footer Social Links',
    description: 'JSON array of social media links',
    example: '[{"platform":"linkedin","url":"https://www.linkedin.com/in/naqash-thaheem-297464147"}]',
    category: 'Footer',
  },
  'footer_newsletter_title': {
    title: 'Footer Newsletter Title',
    description: 'Title for newsletter signup in footer',
    example: 'Stay Connected',
    category: 'Footer',
  },

  // Advanced Features & Benefits
  'features_list': {
    title: 'Features List',
    description: 'JSON array of features to display',
    example: '[{"icon":"🚀","title":"Fast Learning","description":"Quick and effective courses"}]',
    category: 'Features & Benefits',
  },
  'benefits_list': {
    title: 'Benefits List',
    description: 'JSON array of benefits to display',
    example: '[{"icon":"💼","title":"Career Growth","description":"Advance your career"}]',
    category: 'Features & Benefits',
  },
  'testimonials_list': {
    title: 'Testimonials List',
    description: 'JSON array of testimonials',
    example: '[{"name":"John Doe","role":"Developer","text":"Great courses!"}]',
    category: 'Features & Benefits',
  },

  // Advanced Call to Action
  'cta_background_color': {
    title: 'CTA Background Color',
    description: 'Background color for CTA section',
    example: '#f8fafc',
    category: 'Call to Action',
  },
  'cta_text_color': {
    title: 'CTA Text Color',
    description: 'Text color for CTA section',
    example: '#1f2937',
    category: 'Call to Action',
  },
  'cta_button_style': {
    title: 'CTA Button Style',
    description: 'Style of CTA button (primary, secondary, outline)',
    example: 'primary',
    category: 'Call to Action',
  },

  // Performance & Analytics
  'google_analytics_id': {
    title: 'Google Analytics ID',
    description: 'Google Analytics tracking ID',
    example: 'GA-XXXXXXXXX-X',
    category: 'Analytics',
  },
  'google_tag_manager_id': {
    title: 'Google Tag Manager ID',
    description: 'Google Tag Manager container ID',
    example: 'GTM-XXXXXXX',
    category: 'Analytics',
  },
  'facebook_pixel_id': {
    title: 'Facebook Pixel ID',
    description: 'Facebook Pixel tracking ID',
    example: '123456789012345',
    category: 'Analytics',
  },
  'hotjar_id': {
    title: 'Hotjar Site ID',
    description: 'Hotjar site ID for user behavior tracking',
    example: '1234567',
    category: 'Analytics',
  },

  // Security & Privacy
  'privacy_policy_url': {
    title: 'Privacy Policy URL',
    description: 'URL to privacy policy page',
    example: '/privacy-policy',
    category: 'Legal',
  },
  'terms_of_service_url': {
    title: 'Terms of Service URL',
    description: 'URL to terms of service page',
    example: '/terms-of-service',
    category: 'Legal',
  },
  'cookie_policy_url': {
    title: 'Cookie Policy URL',
    description: 'URL to cookie policy page',
    example: '/cookie-policy',
    category: 'Legal',
  },
  'gdpr_compliance': {
    title: 'GDPR Compliance',
    description: 'Enable GDPR compliance features',
    example: 'true/false',
    category: 'Legal',
  }
};

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Info (blue)', className: 'bg-blue-700' },
  { value: 'success', label: 'Success (green)', className: 'bg-emerald-700' },
  { value: 'warning', label: 'Warning (amber)', className: 'bg-amber-600' },
  { value: 'error', label: 'Error (red)', className: 'bg-red-700' },
];

const emptyForm = { key: '', type: 'text' as SettingType, value: '', title: '', description: '', is_active: true, sort_order: 0 };
type FormState = typeof emptyForm;
type FormErrors = Partial<Record<keyof FormState | 'image', string>>;

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';

const KEY_PATTERN = /^[a-z0-9_]+$/;

function getPredefinedInfo(key: string): PredefinedSetting {
  return (
    PREDEFINED_SETTINGS[key] ?? {
      title: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: 'Custom setting',
      example: '',
      category: 'Custom',
    }
  );
}

/** Suggests the value type for a predefined key. */
function suggestedType(key: string, info?: PredefinedSetting): SettingType {
  if (info?.example === 'true/false' || key.endsWith('_enabled')) return 'boolean';
  if (key.includes('image') || key.endsWith('_logo') || key.endsWith('_favicon')) return 'image';
  return 'text';
}

/** Laravel returns validator errors either as `{errors: {...}}` or as the bare `{field: [..]}` bag (this controller). */
function validationErrors(error: unknown): FormErrors {
  const data = (error as { response?: { status?: number; data?: Record<string, unknown> } })?.response;
  if (data?.status !== 422 || !data.data) return {};
  const bag = (data.data.errors ?? data.data) as Record<string, unknown>;
  const result: FormErrors = {};
  for (const [key, messages] of Object.entries(bag)) {
    if (Array.isArray(messages) && messages[0]) result[key as keyof FormErrors] = String(messages[0]);
  }
  return result;
}

function errorMessage(error: unknown, fallback: string) {
  const first = Object.values(validationErrors(error))[0];
  return first || apiErrorMessage(error, fallback);
}

const imageUrl = (setting: HomeSetting) => setting.image_url || (setting.value ? (setting.value.startsWith('http') ? setting.value : API_CONFIG.getStorageUrl(setting.value)) : '');

function NotificationBannerCard({ settings }: { settings: HomeSetting[] }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const byKey = (key: string) => settings.find((s) => s.key === key);

  const initial = {
    enabled: byKey('notification_enabled')?.value === '1',
    type: byKey('notification_type')?.value || 'info',
    message: byKey('notification_message')?.value || '',
  };
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const inactive = ['notification_enabled', 'notification_type', 'notification_message'].filter((key) => byKey(key) && !byKey(key)?.is_active);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values: Record<string, { type: SettingType; value: string }> = {
        notification_enabled: { type: 'boolean', value: draft.enabled ? '1' : '0' },
        notification_type: { type: 'text', value: draft.type },
        notification_message: { type: 'text', value: draft.message.trim() },
      };
      // Update existing settings in place; create the ones that do not exist yet.
      for (const [key, { type, value }] of Object.entries(values)) {
        const existing = byKey(key);
        if (existing) {
          await apiClient.put(`/admin/home-settings/${existing.id}`, {
            key,
            type: existing.type,
            value,
            title: existing.title,
            description: existing.description,
            is_active: true,
            sort_order: existing.sort_order ?? 0,
          });
        } else {
          const info = getPredefinedInfo(key);
          await apiClient.post('/admin/home-settings', { key, type, value, title: info.title, description: info.description, is_active: true, sort_order: 0 });
        }
      }
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Notification banner saved', description: draft.enabled ? 'The banner is now live on the homepage.' : 'The banner is hidden.' });
      queryClient.invalidateQueries({ queryKey: ['admin-home-settings'] });
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not save the banner', description: errorMessage(err, 'Failed to save setting') }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.enabled && !draft.message.trim()) {
      setError('Enter a message to show the banner.');
      return;
    }
    setError('');
    saveMutation.mutate();
  };

  const tone = NOTIFICATION_TYPES.find((t) => t.value === draft.type)?.className ?? 'bg-blue-700';

  return (
    <AdminCard title="Homepage notification banner" description="A message shown across the top of the public homepage.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
          Show the banner on the homepage
        </label>
        <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
          <Field label="Banner style">
            {(props) => (
              <select {...props} className={inputClass} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Banner message" required={draft.enabled} error={error}>
            {(props) => (
              <input
                {...props}
                type="text"
                className={inputClass}
                placeholder="e.g., New automation templates are live!"
                value={draft.message}
                onChange={(e) => setDraft({ ...draft, message: e.target.value })}
              />
            )}
          </Field>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Preview</p>
          {draft.enabled && draft.message.trim() ? (
            <div data-testid="banner-preview" className={`${tone} rounded-lg px-4 py-3 text-center text-sm font-medium text-white`}>
              {draft.message}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-center text-sm text-slate-500">The banner is hidden.</p>
          )}
        </div>
        {inactive.length > 0 && (
          <p className="text-xs text-amber-700">Some banner settings are inactive ({inactive.join(', ')}). Saving here re-activates them.</p>
        )}
        <div className="flex justify-end">
          <button type="submit" className={primaryBtn} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save banner'}
          </button>
        </div>
      </form>
    </AdminCard>
  );
}

export default function HomeSettings() {
  useSEO({ title: 'Home Settings | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<HomeSetting | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setFormData((prev) => ({ ...prev, [key]: value }));

  const settingsQuery = useQuery({
    queryKey: ['admin-home-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/home-settings');
      return asList<HomeSetting>(data?.settings ?? data);
    },
  });
  const settings = useMemo(() => settingsQuery.data ?? [], [settingsQuery.data]);

  const allCategories = useMemo(() => Array.from(new Set(Object.values(PREDEFINED_SETTINGS).map((s) => s.category))).sort(), []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    settings.forEach((s) => {
      const category = getPredefinedInfo(s.key).category;
      counts[category] = (counts[category] ?? 0) + 1;
    });
    return counts;
  }, [settings]);

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const groups: Record<string, HomeSetting[]> = {};
    settings.forEach((setting) => {
      const info = getPredefinedInfo(setting.key);
      if (selectedCategory && info.category !== selectedCategory) return;
      if (term && ![setting.key, setting.title, setting.value, info.title].some((v) => typeof v === 'string' && v.toLowerCase().includes(term))) return;
      (groups[info.category] ??= []).push(setting);
    });
    return groups;
  }, [settings, selectedCategory, search]);

  const availablePredefined = useMemo(() => {
    const existing = new Set(settings.map((s) => s.key));
    return Object.entries(PREDEFINED_SETTINGS)
      .filter(([key, info]) => !existing.has(key) && (!selectedCategory || info.category === selectedCategory))
      .map(([key, info]) => ({ key, ...info }));
  }, [settings, selectedCategory]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-home-settings'] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Image settings are created/updated by the upload endpoint itself.
      if (formData.type === 'image' && selectedFile) {
        const body = new FormData();
        body.append('image', selectedFile);
        body.append('key', formData.key);
        return (await apiClient.post('/admin/home-settings/upload-image', body, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
      }
      return editingSetting ? (await apiClient.put(`/admin/home-settings/${editingSetting.id}`, formData)).data : (await apiClient.post('/admin/home-settings', formData)).data;
    },
    onSuccess: () => {
      addToast({ type: 'success', title: editingSetting ? 'Setting updated' : 'Setting created' });
      closeModal();
      invalidate();
    },
    onError: (err) => {
      setErrors(validationErrors(err));
      addToast({ type: 'error', title: 'Could not save setting', description: errorMessage(err, 'Failed to save setting') });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (setting: HomeSetting) => apiClient.post(`/admin/home-settings/${setting.id}/toggle-active`),
    onSuccess: (_d, setting) => {
      addToast({ type: 'success', title: setting.is_active ? 'Setting deactivated' : 'Setting activated' });
      invalidate();
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not toggle setting', description: errorMessage(err, 'Failed to toggle setting') }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/home-settings/${id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Setting deleted' });
      invalidate();
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not delete setting', description: errorMessage(err, 'Failed to delete setting') }),
  });

  const openCreate = () => {
    setEditingSetting(null);
    setFormData(emptyForm);
    setErrors({});
    setSelectedFile(null);
    setShowSuggestions(false);
    setModalOpen(true);
  };

  const openEdit = (setting: HomeSetting) => {
    const info = getPredefinedInfo(setting.key);
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      type: setting.type ?? 'text',
      value: setting.value ?? '',
      title: setting.title || info.title,
      description: setting.description || info.description,
      is_active: Boolean(setting.is_active),
      sort_order: Number(setting.sort_order) || 0,
    });
    setErrors({});
    setSelectedFile(null);
    setShowSuggestions(false);
    setModalOpen(true);
  };

  function closeModal() {
    setModalOpen(false);
    setEditingSetting(null);
    setSelectedFile(null);
    setErrors({});
  }

  const selectPredefined = (key: string) => {
    const info = PREDEFINED_SETTINGS[key];
    if (!info) return;
    const type = suggestedType(key, info);
    setFormData((prev) => ({ ...prev, key, title: info.title, description: info.description, type, value: type === 'boolean' ? prev.value || '0' : prev.value }));
    setShowSuggestions(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!formData.key.trim()) next.key = 'Setting key is required.';
    else if (!editingSetting && !KEY_PATTERN.test(formData.key)) next.key = 'Use lowercase letters, numbers and underscores only.';
    if (formData.type === 'json' && formData.value.trim()) {
      try {
        JSON.parse(formData.value);
      } catch {
        next.value = 'Enter valid JSON.';
      }
    }
    if (formData.type === 'image' && !selectedFile && !editingSetting) next.image = 'Choose an image to upload.';
    setErrors(next);
    if (Object.keys(next).length) return;
    saveMutation.mutate();
  };

  const handleDelete = async (setting: HomeSetting) => {
    const ok = await confirm({ title: 'Delete setting', message: `Delete "${setting.key}"? The homepage will fall back to its default for this value.`, confirmText: 'Delete', type: 'danger' });
    if (ok) deleteMutation.mutate(setting.id);
  };

  const renderValue = (setting: HomeSetting) => {
    if (setting.type === 'image') {
      const url = imageUrl(setting);
      return (
        <div className="flex items-center gap-3">
          {url && <img src={url} alt="" className="h-12 w-20 flex-none rounded border border-slate-200 object-cover" loading="lazy" />}
          <span className="break-all font-mono text-xs text-slate-500">{setting.value || '—'}</span>
        </div>
      );
    }
    if (setting.type === 'boolean') return <Badge tone={setting.value === '1' ? 'success' : 'neutral'}>{setting.value === '1' ? 'Enabled' : 'Disabled'}</Badge>;
    if (!setting.value) return <span className="text-slate-400">Empty</span>;
    return <p className={`line-clamp-3 break-words text-sm text-slate-800 ${setting.type === 'json' ? 'font-mono text-xs' : ''}`}>{setting.value}</p>;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Home Settings"
        description="Manage homepage content, images and the notification banner."
        actions={
          <button type="button" className={primaryBtn} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add setting
          </button>
        }
      />

      {settingsQuery.isLoading ? (
        <AdminCard>
          <LoadingState label="Loading home settings…" />
        </AdminCard>
      ) : settingsQuery.isError ? (
        <AdminCard>
          <ErrorState message={apiErrorMessage(settingsQuery.error, 'Failed to fetch settings')} onRetry={() => settingsQuery.refetch()} />
        </AdminCard>
      ) : (
        <>
          <NotificationBannerCard key={settingsQuery.dataUpdatedAt} settings={settings} />

          <AdminCard padded={false} title="All settings" description={`${settings.length} settings`}>
            <div className="space-y-3 border-b border-slate-200 p-4">
              <div className="sm:w-72">
                <SearchInput label="Search settings" placeholder="Search by key, title or value…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                {[null, ...allCategories, ...(categoryCounts.Custom ? ['Custom'] : [])].map((category) => (
                  <button
                    key={category ?? 'all'}
                    type="button"
                    aria-pressed={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {category ?? 'All'} <span className="opacity-70">({category ? (categoryCounts[category] ?? 0) : settings.length})</span>
                  </button>
                ))}
              </div>
            </div>

            {settings.length === 0 ? (
              <EmptyState
                icon={House}
                title="No home settings yet"
                description="Add settings to customise the homepage hero, sections and footer."
                action={
                  <button type="button" className={primaryBtn} onClick={openCreate}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Add setting
                  </button>
                }
              />
            ) : Object.keys(grouped).length === 0 ? (
              <EmptyState title="No matching settings" description="Try another category or search term." />
            ) : (
              <div className="divide-y divide-slate-200">
                {Object.entries(grouped).map(([category, categorySettings]) => (
                  <section key={category} aria-label={category}>
                    <h3 className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {category} ({categorySettings.length})
                    </h3>
                    <ul className="divide-y divide-slate-100">
                      {categorySettings.map((setting) => {
                        const info = getPredefinedInfo(setting.key);
                        return (
                          <li key={setting.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
                            <div className="min-w-0 sm:w-64 sm:flex-none">
                              <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                                {setting.title || info.title}
                                {!setting.is_active && <Badge>Inactive</Badge>}
                              </p>
                              <p className="break-all font-mono text-xs text-slate-500">{setting.key}</p>
                            </div>
                            <div className="min-w-0 flex-1">{renderValue(setting)}</div>
                            <div className="flex flex-none gap-1">
                              <IconButton
                                label={setting.is_active ? `Deactivate ${setting.key}` : `Activate ${setting.key}`}
                                icon={setting.is_active ? PowerOff : Power}
                                disabled={toggleMutation.isPending && toggleMutation.variables?.id === setting.id}
                                onClick={() => toggleMutation.mutate(setting)}
                              />
                              <IconButton label={`Edit ${setting.key}`} icon={Pencil} onClick={() => openEdit(setting)} />
                              <IconButton
                                label={`Delete ${setting.key}`}
                                icon={Trash2}
                                tone="danger"
                                disabled={deleteMutation.isPending && deleteMutation.variables === setting.id}
                                onClick={() => handleDelete(setting)}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </AdminCard>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="lg"
        title={editingSetting ? 'Edit setting' : 'New setting'}
        description={editingSetting ? editingSetting.key : 'Pick a predefined key or create a custom one.'}
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="home-setting-form" className={primaryBtn} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (formData.type === 'image' && selectedFile ? 'Uploading…' : 'Saving…') : editingSetting ? 'Update setting' : 'Create setting'}
            </button>
          </>
        }
      >
        <form id="home-setting-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Setting key" required hint={editingSetting ? 'Keys cannot be changed.' : 'Lowercase letters and underscores, e.g. hero_title.'} error={errors.key}>
            {(props) => (
              <input
                {...props}
                type="text"
                className={`${inputClass} font-mono`}
                placeholder="hero_title"
                value={formData.key}
                disabled={Boolean(editingSetting)}
                onChange={(e) => update('key', e.target.value)}
              />
            )}
          </Field>

          {!editingSetting && (
            <div className="rounded-lg border border-slate-200">
              <button
                type="button"
                aria-expanded={showSuggestions}
                onClick={() => setShowSuggestions((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Browse predefined keys{selectedCategory ? ` in ${selectedCategory}` : ''} ({availablePredefined.length})
                <ChevronDown className={`h-4 w-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {showSuggestions && (
                <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto border-t border-slate-200">
                  {availablePredefined.length ? (
                    availablePredefined.map(({ key, title, description, category }) => (
                      <li key={key}>
                        <button type="button" onClick={() => selectPredefined(key)} className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                            {title} <Badge>{category}</Badge>
                          </span>
                          <span className="block text-xs text-slate-500">{description}</span>
                          <span className="block font-mono text-xs text-slate-400">{key}</span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-3 text-center text-sm text-slate-500">All predefined keys are in use. Type a custom key instead.</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" error={errors.type}>
              {(props) => (
                <select
                  {...props}
                  className={inputClass}
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value as SettingType;
                    setFormData((prev) => ({ ...prev, type, value: type === 'boolean' && prev.value !== '1' ? '0' : prev.value }));
                  }}
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              )}
            </Field>
            <Field label="Title" error={errors.title}>
              {(props) => <input {...props} type="text" maxLength={255} className={inputClass} value={formData.title} onChange={(e) => update('title', e.target.value)} />}
            </Field>
          </div>

          <Field label="Description" error={errors.description}>
            {(props) => <textarea {...props} rows={2} className={inputClass} value={formData.description} onChange={(e) => update('description', e.target.value)} />}
          </Field>

          {formData.type === 'image' ? (
            <Field
              label="Image"
              required={!editingSetting}
              hint={editingSetting ? 'Choose a new image to replace the current one (max 2MB).' : 'JPEG, PNG, GIF, SVG, WebP or AVIF, max 2MB.'}
              error={errors.image}
            >
              {(props) => (
                <input
                  {...props}
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              )}
            </Field>
          ) : (
            <Field label="Value" hint={getPredefinedInfo(formData.key).example ? `Example: ${getPredefinedInfo(formData.key).example}` : undefined} error={errors.value}>
              {(props) =>
                formData.type === 'boolean' ? (
                  <select {...props} className={inputClass} value={formData.value === '1' ? '1' : '0'} onChange={(e) => update('value', e.target.value)}>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                ) : formData.key === 'notification_type' ? (
                  <select {...props} className={inputClass} value={formData.value || 'info'} onChange={(e) => update('value', e.target.value)}>
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    {...props}
                    rows={formData.type === 'json' ? 5 : 3}
                    className={`${inputClass} ${formData.type === 'json' ? 'font-mono text-xs' : ''}`}
                    placeholder={formData.type === 'json' ? 'Enter JSON data' : undefined}
                    value={formData.value}
                    onChange={(e) => update('value', e.target.value)}
                  />
                )
              }
            </Field>
          )}

          <div className="flex flex-wrap items-end gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={formData.is_active} onChange={(e) => update('is_active', e.target.checked)} />
              Active
            </label>
            <div className="w-32">
              <Field label="Sort order" error={errors.sort_order}>
                {(props) => <input {...props} type="number" min={0} className={inputClass} value={formData.sort_order} onChange={(e) => update('sort_order', parseInt(e.target.value, 10) || 0)} />}
              </Field>
            </div>
          </div>
          {formData.key.startsWith('notification_') && (
            <p className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
              <Bell className="h-4 w-4 flex-none" aria-hidden="true" /> Tip: the banner card above edits all notification settings at once.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
