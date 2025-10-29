/**
 * Utility to manage Google AdSense meta tag dynamically
 */

/**
 * Update or create the Google AdSense account meta tag
 */
export function updateAdSenseMetaTag(publisherId: string): void {
  if (!publisherId || publisherId.trim() === '') {
    return;
  }

  // Remove any existing AdSense meta tag
  const existingMeta = document.querySelector('meta[name="google-adsense-account"]');
  if (existingMeta) {
    existingMeta.remove();
  }

  // Create and add the meta tag
  const metaTag = document.createElement('meta');
  metaTag.name = 'google-adsense-account';
  metaTag.content = publisherId;
  document.head.appendChild(metaTag);
}

/**
 * Remove the AdSense meta tag (if needed)
 */
export function removeAdSenseMetaTag(): void {
  const existingMeta = document.querySelector('meta[name="google-adsense-account"]');
  if (existingMeta) {
    existingMeta.remove();
  }
}
