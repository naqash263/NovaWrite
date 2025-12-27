/**
 * Utility functions for handling images with WebP support and fallbacks
 */

/**
 * Get WebP version of an image path if available, with fallback to original
 * @param imagePath - Original image path (e.g., '/images/logo.png')
 * @returns WebP path if available, otherwise original path
 */
export function getWebPImage(imagePath: string): string {
  if (!imagePath) return imagePath;
  
  // If already WebP or SVG, return as-is
  if (imagePath.endsWith('.webp') || imagePath.endsWith('.svg')) {
    return imagePath;
  }
  
  // If path contains storage URL, don't modify
  if (imagePath.startsWith('http') || imagePath.includes('/storage/')) {
    return imagePath;
  }
  
  // Replace extension with .webp
  const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  
  // Return WebP path (browser will fallback to original if WebP doesn't exist)
  return webpPath;
}

/**
 * Get image source with WebP support using picture element sources
 * @param imagePath - Original image path
 * @param alt - Alt text for the image
 * @returns Object with webpSrc and originalSrc
 */
export function getImageSources(imagePath: string): {
  webpSrc: string;
  originalSrc: string;
  type: string;
} {
  if (!imagePath) {
    return { webpSrc: '', originalSrc: '', type: '' };
  }
  
  // If already WebP, return as-is
  if (imagePath.endsWith('.webp')) {
    return { webpSrc: imagePath, originalSrc: imagePath, type: 'image/webp' };
  }
  
  // If SVG, return as-is
  if (imagePath.endsWith('.svg')) {
    return { webpSrc: imagePath, originalSrc: imagePath, type: 'image/svg+xml' };
  }
  
  // If path contains storage URL, don't modify
  if (imagePath.startsWith('http') || imagePath.includes('/storage/')) {
    return { webpSrc: imagePath, originalSrc: imagePath, type: 'image/jpeg' };
  }
  
  // Get WebP version
  const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const extension = imagePath.match(/\.([^.]+)$/i)?.[1]?.toLowerCase() || 'png';
  const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'image/png';
  
  return {
    webpSrc: webpPath,
    originalSrc: imagePath,
    type: mimeType
  };
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

