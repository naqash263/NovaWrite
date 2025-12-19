/**
 * Fetch with timeout support
 * Useful for AI requests that may take longer, especially with N8N fallback
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 120000 // 120 seconds default
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout / 1000} seconds. The AI service may be processing your request. Please try again.`);
    }
    throw error;
  }
}
