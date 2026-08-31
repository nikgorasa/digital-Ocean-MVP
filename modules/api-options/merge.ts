import type { ApiOptions } from './types';
import { ApiOptionsSchema } from './types';
import { DEFAULT_API_OPTIONS } from './defaults';

export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] === undefined) continue;

    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key] as any;
    }
  }

  return result;
}

export function mergeApiOptions(dbOptions: unknown): ApiOptions {
  if (!dbOptions) return DEFAULT_API_OPTIONS;

  const parsed = ApiOptionsSchema.safeParse(dbOptions);
  if (!parsed.success) {
    console.warn('[api-options] Invalid config, falling back to defaults');
    return DEFAULT_API_OPTIONS;
  }

  return deepMerge(DEFAULT_API_OPTIONS, parsed.data);
}
