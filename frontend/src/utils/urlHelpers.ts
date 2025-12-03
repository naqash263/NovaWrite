/**
 * Generate date-based URL for blog posts and workflows
 * Format: /blog/YYYY/MM/DD/slug or /workflows/YYYY/MM/DD/slug
 */
export function generateDateBasedUrl(
  type: 'blog' | 'workflows',
  slug: string,
  publishedAt?: string | null,
  updatedAt?: string | null
): string {
  const date = publishedAt || updatedAt || new Date().toISOString();
  const publishDate = new Date(date);
  const year = publishDate.getFullYear();
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  
  return `/${type}/${year}/${month}/${day}/${slug}`;
}

/**
 * Extract slug from date-based URL or return slug as-is
 * Handles both formats: /blog/2025/01/03/slug and /blog/slug
 */
export function extractSlugFromUrl(url: string): string {
  const parts = url.split('/').filter(Boolean);
  
  // Check if it's a date-based URL (has 4 parts: type, year, month, day, slug)
  if (parts.length >= 5 && /^\d{4}$/.test(parts[1]) && /^\d{2}$/.test(parts[2]) && /^\d{2}$/.test(parts[3])) {
    // Date-based URL: return the slug (last part)
    return parts.slice(4).join('/');
  }
  
  // Old format: /blog/slug or /workflows/slug
  return parts.slice(1).join('/');
}

