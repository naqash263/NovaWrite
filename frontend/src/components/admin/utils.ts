// Admin data helpers (kept out of ui.tsx so React fast refresh works).

/** Extracts a user-facing message from an axios/Laravel error. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const e = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
  const errors = e?.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0];
    if (first?.[0]) return first[0];
  }
  return e?.response?.data?.message || e?.message || fallback;
}

/**
 * Normalises list responses: accepts `[]`, `{ data: [] }` or `{ data: { data: [] } }` (Laravel paginator).
 * Anything else becomes an empty list, so unexpected payloads never crash a page.
 */
export function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const data = (payload as { data?: unknown })?.data;
  if (Array.isArray(data)) return data as T[];
  const nested = (data as { data?: unknown })?.data;
  if (Array.isArray(nested)) return nested as T[];
  return [];
}
