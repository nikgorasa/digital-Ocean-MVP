import { mergeApiOptions } from './merge';
import type { ApiOptions } from './types';

export async function fetchApiOptions(provider: 'flight' | 'hotel'): Promise<ApiOptions> {
  try {
    const res = await fetch(`/api/api-options?provider=${provider}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return mergeApiOptions(data.apiOptions);
  } catch (e) {
    console.warn('[api-options] Fetch failed, using defaults');
    return import('./defaults').then(m => m.DEFAULT_API_OPTIONS);
  }
}
