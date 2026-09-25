// GA4 helpers. gtag is defined in index.html (with Consent Mode defaults); every call
// is a no-op when it is missing, e.g. blocked by an ad blocker or in tests.

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: GtagParams = {}) {
  try {
    window.gtag?.('event', name, params);
  } catch {
    // Analytics must never break the page.
  }
}

/** page_view for SPA navigation; index.html disables the automatic one. */
export function trackPageView(path: string, title: string) {
  trackEvent('page_view', {
    page_location: `${window.location.origin}${path}`,
    page_path: path,
    page_title: title,
  });
}

/** GA4 recommended lead event, marked as a key event in GA4. */
export function trackLead(form: 'contact' | 'booking' | 'workflow_download', params: GtagParams = {}) {
  trackEvent('generate_lead', { form, ...params });
}
