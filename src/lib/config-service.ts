import type { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { encrypt, decrypt } from "./crypto";

export interface ConfigProviderData {
  id: string;
  provider: string;
  label: string;
  baseUrl: string | null;
  bookingUrl: string | null;
  staticUrl: string | null;
  clientId: string | null;
  username: string | null;
  password: string | null;
  staticUsername: string | null;
  staticPassword: string | null;
  forceMock: boolean;
  isActive: boolean;
  version: number;
}

interface CacheEntry {
  data: ConfigProviderData;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

export function invalidateCache(provider?: string): void {
  if (provider) {
    cache.delete(provider);
  } else {
    cache.clear();
  }
}

function getDefaults(): ConfigProviderData {
  return {
    id: "",
    provider: "",
    label: "",
    baseUrl: null,
    bookingUrl: null,
    staticUrl: null,
    clientId: null,
    username: null,
    password: null,
    staticUsername: null,
    staticPassword: null,
    forceMock: false,
    isActive: true,
    version: 0,
  };
}

function envFallback(provider: string): ConfigProviderData {
  const cfg = getDefaults();
  cfg.provider = provider;

  switch (provider) {
    case "tbo_hotel":
      cfg.label = "TBO Hotel (Search/Book)";
      cfg.baseUrl = process.env.TBO_ENDPOINT || "https://affiliate.tektravels.com/HotelAPI";
      cfg.bookingUrl = process.env.TBO_BOOKING_ENDPOINT || "https://affiliate.tektravels.com/HotelAPI";
      cfg.staticUrl = null;
      cfg.clientId = process.env.TBO_CLIENT_ID || "ApiIntegrationNew";
      cfg.username = process.env.TBO_USERNAME || "";
      cfg.password = process.env.TBO_PASSWORD || "";
      cfg.forceMock = process.env.TBO_HOTEL_FORCE_MOCK === "true";
      break;
    case "tbo_hotel_static":
      cfg.label = "TBO Hotel (Static Data)";
      cfg.baseUrl = null;
      cfg.bookingUrl = null;
      cfg.staticUrl = process.env.TBO_STATIC_ENDPOINT || "http://api.tbotechnology.in/TBOHolidays_HotelAPI";
      cfg.clientId = null;
      cfg.staticUsername = process.env.TBO_HOTEL_USERNAME || "";
      cfg.staticPassword = process.env.TBO_HOTEL_PASSWORD || "";
      cfg.forceMock = false;
      break;
    case "tbo_flight":
      cfg.label = "TBO Flight";
      cfg.baseUrl = null;
      cfg.bookingUrl = null;
      cfg.staticUrl = null;
      cfg.clientId = process.env.TBO_CLIENT_ID || "ApiIntegrationNew";
      cfg.username = process.env.TBO_USERNAME || "";
      cfg.password = process.env.TBO_PASSWORD || "";
      cfg.forceMock = process.env.TBO_FLIGHT_FORCE_MOCK === "true";
      break;
  }
  return cfg;
}

function mapDbToData(row: {
  id: string;
  provider: string;
  label: string;
  baseUrl: string | null;
  bookingUrl: string | null;
  staticUrl: string | null;
  clientId: string | null;
  encryptedUsername: string | null;
  encryptedPassword: string | null;
  encryptedStaticUsername: string | null;
  encryptedStaticPassword: string | null;
  forceMock: boolean;
  isActive: boolean;
  version: number;
}): ConfigProviderData {
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    baseUrl: row.baseUrl,
    bookingUrl: row.bookingUrl,
    staticUrl: row.staticUrl,
    clientId: row.clientId,
    username: row.encryptedUsername ? decrypt(row.encryptedUsername) : null,
    password: row.encryptedPassword ? decrypt(row.encryptedPassword) : null,
    staticUsername: row.encryptedStaticUsername ? decrypt(row.encryptedStaticUsername) : null,
    staticPassword: row.encryptedStaticPassword ? decrypt(row.encryptedStaticPassword) : null,
    forceMock: row.forceMock,
    isActive: row.isActive,
    version: row.version,
  };
}

export async function readConfig(provider: string): Promise<ConfigProviderData> {
  const cached = cache.get(provider);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const row = await prisma.configProvider.findUnique({ where: { provider } });
    if (row) {
      const data = mapDbToData(row);
      cache.set(provider, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    }
  } catch {
    // DB unavailable — fall through to env
  }

  return envFallback(provider);
}

export async function upsertConfig(
  provider: string,
  data: {
    label?: string;
    baseUrl?: string | null;
    bookingUrl?: string | null;
    staticUrl?: string | null;
    clientId?: string | null;
    username?: string | null;
    password?: string | null;
    staticUsername?: string | null;
    staticPassword?: string | null;
    forceMock?: boolean;
    isActive?: boolean;
    updatedBy?: string | null;
  },
): Promise<ConfigProviderData> {
  const updateData: Prisma.ConfigProviderUpdateInput = {};
  const createData: Prisma.ConfigProviderCreateInput = {
    provider,
    label: data.label || provider,
  };

  if (data.label !== undefined) {
    updateData.label = data.label;
    createData.label = data.label;
  }
  if (data.baseUrl !== undefined) {
    updateData.baseUrl = data.baseUrl;
    createData.baseUrl = data.baseUrl;
  }
  if (data.bookingUrl !== undefined) {
    updateData.bookingUrl = data.bookingUrl;
    createData.bookingUrl = data.bookingUrl;
  }
  if (data.staticUrl !== undefined) {
    updateData.staticUrl = data.staticUrl;
    createData.staticUrl = data.staticUrl;
  }
  if (data.clientId !== undefined) {
    updateData.clientId = data.clientId;
    createData.clientId = data.clientId;
  }
  if (data.forceMock !== undefined) {
    updateData.forceMock = data.forceMock;
    createData.forceMock = data.forceMock;
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
    createData.isActive = data.isActive;
  }
  if (data.updatedBy !== undefined) {
    updateData.updatedBy = data.updatedBy;
    createData.updatedBy = data.updatedBy;
  }

  if (data.username !== undefined) {
    const val = data.username ? encrypt(data.username) : null;
    updateData.encryptedUsername = val;
    createData.encryptedUsername = val;
  }
  if (data.password !== undefined) {
    const val = data.password ? encrypt(data.password) : null;
    updateData.encryptedPassword = val;
    createData.encryptedPassword = val;
  }
  if (data.staticUsername !== undefined) {
    const val = data.staticUsername ? encrypt(data.staticUsername) : null;
    updateData.encryptedStaticUsername = val;
    createData.encryptedStaticUsername = val;
  }
  if (data.staticPassword !== undefined) {
    const val = data.staticPassword ? encrypt(data.staticPassword) : null;
    updateData.encryptedStaticPassword = val;
    createData.encryptedStaticPassword = val;
  }

  const row = await prisma.configProvider.upsert({
    where: { provider },
    create: createData,
    update: {
      ...updateData,
      version: { increment: 1 },
    },
  });

  const result = mapDbToData(row);
  cache.set(provider, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
