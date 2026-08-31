import { z } from "zod";

export const ApiOptionsSchema = z.object({
  timeoutMs: z.number().int().positive(),
  retries: z.number().int().min(0).max(5),
  retryDelayMs: z.number().int().positive(),
  circuitBreakerThreshold: z.number().int().positive(),
  circuitBreakerResetMs: z.number().int().positive(),
  failOpen: z.boolean(),
  debugLogging: z.boolean(),
});

export type ApiOptions = z.infer<typeof ApiOptionsSchema>;

export const DEFAULT_API_OPTIONS: ApiOptions = {
  timeoutMs: 15000,
  retries: 2,
  retryDelayMs: 300,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30000,
  failOpen: true,
  debugLogging: false,
};

export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target } as T;
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue) && targetValue && typeof targetValue === "object") {
        (output as any)[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        (output as any)[key] = sourceValue;
      }
    }
  }
  return output;
}

export function mergeApiOptions(partial?: Partial<ApiOptions>): ApiOptions {
  if (!partial) return { ...DEFAULT_API_OPTIONS };
  const parsed = ApiOptionsSchema.safeParse(deepMerge({ ...DEFAULT_API_OPTIONS }, partial));
  return parsed.success ? parsed.data : { ...DEFAULT_API_OPTIONS };
}

export function validateApiOptions(options: unknown): ApiOptions {
  const result = ApiOptionsSchema.safeParse(options);
  if (result.success) return result.data;
  return { ...DEFAULT_API_OPTIONS };
}
