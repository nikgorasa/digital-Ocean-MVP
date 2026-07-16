import prisma from "./prisma";
import { Prisma } from "@prisma/client";

const L1_TTL_MS = 5 * 60 * 1000;
const l1Cache = new Map<string, { data: unknown; expiresAt: number }>();

function l1Key(dataType: string, qualifier?: string): string {
  return qualifier ? `${dataType}:${qualifier}` : dataType;
}

function l1Get<T>(key: string): T | null {
  const entry = l1Cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    l1Cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function l1Set(key: string, data: unknown, ttlMs = L1_TTL_MS): void {
  l1Cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function l1Delete(key: string): void {
  l1Cache.delete(key);
}

export function clearMemoryCache(): void {
  l1Cache.clear();
}

export async function cacheGet<T>(dataType: string, qualifier?: string): Promise<T | null> {
  const key = l1Key(dataType, qualifier);
  const l1 = l1Get<T>(key);
  if (l1 !== null) return l1;

  const cacheKey = qualifier ? `${dataType}:${qualifier}` : dataType;
  try {
    const row = await prisma.staticCache.findUnique({ where: { cacheKey } });
    if (!row) return null;
    if (new Date(row.expiresAt).getTime() < Date.now()) {
      await prisma.staticCache.delete({ where: { cacheKey } }).catch(() => {});
      return null;
    }
    const data = row.data as T;
    l1Set(key, data);
    return data;
  } catch (e) {
    console.error(`[static-cache] DB read failed for ${cacheKey}:`, e);
    return null;
  }
}

export async function cacheSet<T>(
  dataType: string,
  data: T,
  qualifier?: string,
  opts?: { ttlSeconds?: number; metadata?: Record<string, unknown> },
): Promise<void> {
  const cacheKey = qualifier ? `${dataType}:${qualifier}` : dataType;
  const ttlSeconds = opts?.ttlSeconds ?? 86400;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  try {
    await prisma.staticCache.upsert({
      where: { cacheKey },
      create: { cacheKey, dataType, data: data as unknown as Prisma.InputJsonValue, metadata: opts?.metadata as unknown as Prisma.InputJsonValue ?? undefined, expiresAt },
      update: { data: data as unknown as Prisma.InputJsonValue, metadata: opts?.metadata as unknown as Prisma.InputJsonValue ?? undefined, expiresAt },
    });
    const key = l1Key(dataType, qualifier);
    l1Set(key, data);
  } catch (e) {
    console.error(`[static-cache] DB write failed for ${cacheKey}:`, e);
  }
}

export async function cacheDelete(dataType: string, qualifier?: string): Promise<void> {
  const cacheKey = qualifier ? `${dataType}:${qualifier}` : dataType;
  try {
    await prisma.staticCache.delete({ where: { cacheKey } }).catch(() => {});
  } catch (e) {
    console.error(`[static-cache] DB delete failed for ${cacheKey}:`, e);
  }
  l1Delete(l1Key(dataType, qualifier));
}

export async function cacheFlush(dataType: string): Promise<number> {
  try {
    const result = await prisma.staticCache.deleteMany({ where: { dataType } });
    for (const key of l1Cache.keys()) {
      if (key === dataType || key.startsWith(`${dataType}:`)) {
        l1Cache.delete(key);
      }
    }
    return result.count;
  } catch (e) {
    console.error(`[static-cache] DB flush failed for ${dataType}:`, e);
    return 0;
  }
}

export async function cacheStats(): Promise<
  { dataType: string; count: number; oldestEntry: Date | null; newestEntry: Date | null }[]
> {
  try {
    const groups = await prisma.staticCache.groupBy({
      by: ["dataType"],
      _count: { id: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });
    return groups.map((g: { dataType: string; _count: { id: number }; _min: { createdAt: Date | null }; _max: { createdAt: Date | null } }) => ({
      dataType: g.dataType,
      count: g._count.id,
      oldestEntry: g._min.createdAt,
      newestEntry: g._max.createdAt,
    }));
  } catch (e) {
    console.error("[static-cache] DB stats failed:", e);
    return [];
  }
}

export async function updateTTL(dataType: string, ttlSeconds: number): Promise<void> {
  try {
    await prisma.cacheConfig.upsert({
      where: { dataType },
      create: { dataType, ttlSeconds },
      update: { ttlSeconds },
    });
  } catch (e) {
    console.error(`[static-cache] DB updateTTL failed for ${dataType}:`, e);
  }
}

export async function getCacheConfigs(): Promise<
  { dataType: string; ttlSeconds: number; isActive: boolean; lastRefreshAt: Date | null; refreshStatus: string | null; refreshError: string | null }[]
> {
  try {
    return await prisma.cacheConfig.findMany({ orderBy: { dataType: "asc" } });
  } catch (e) {
    console.error("[static-cache] DB getCacheConfigs failed:", e);
    return [];
  }
}

export async function getTTLSeconds(dataType: string): Promise<number> {
  try {
    const cfg = await prisma.cacheConfig.findUnique({ where: { dataType } });
    return cfg?.ttlSeconds ?? 86400;
  } catch {
    return 86400;
  }
}

export async function markRefreshStart(dataType: string): Promise<void> {
  try {
    await prisma.cacheConfig.upsert({
      where: { dataType },
      create: { dataType, ttlSeconds: 86400, refreshStatus: "running", refreshError: null },
      update: { refreshStatus: "running", refreshError: null },
    });
  } catch (e) {
    console.error(`[static-cache] markRefreshStart failed for ${dataType}:`, e);
  }
}

export async function markRefreshEnd(dataType: string, success: boolean, error?: string): Promise<void> {
  try {
    await prisma.cacheConfig.upsert({
      where: { dataType },
      create: { dataType, ttlSeconds: 86400, lastRefreshAt: new Date(), refreshStatus: success ? "success" : "error", refreshError: error ?? null },
      update: { lastRefreshAt: new Date(), refreshStatus: success ? "success" : "error", refreshError: error ?? null },
    });
  } catch (e) {
    console.error(`[static-cache] markRefreshEnd failed for ${dataType}:`, e);
  }
}
