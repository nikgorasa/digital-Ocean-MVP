/**
 * Fetch with automatic retry for transient errors.
 * Retries on network errors and 5xx server errors.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
  delayMs = 1000,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      // Success or client error (4xx) — don't retry
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }

      // Server error (5xx) — retry if we have attempts left
      if (attempt < maxRetries) {
        console.warn(`[Retry] ${url} returned ${res.status}, attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }

      return res; // Last attempt, return even if 5xx
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));

      // Network error — retry if we have attempts left
      if (attempt < maxRetries) {
        console.warn(`[Retry] ${url} network error, attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delayMs}ms...`, lastError.message);
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
