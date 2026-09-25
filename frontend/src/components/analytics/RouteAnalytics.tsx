import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../utils/analytics';

// Pages set document.title in an effect after their lazy chunk loads, so wait briefly
// before reading it. Leaving within the delay (e.g. a redirect) sends nothing.
const TITLE_SETTLE_MS = 600;

/** Sends a GA4 page_view for every client-side navigation (admin pages excluded). */
export default function RouteAnalytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const timer = window.setTimeout(() => trackPageView(`${pathname}${search}`, document.title), TITLE_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  return null;
}
