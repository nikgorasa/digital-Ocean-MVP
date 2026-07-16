import { NextRequest, NextResponse } from "next/server";
import * as cities from "@/lib/db/cities";
import * as api from "@/lib/tbo-hotel-api";
import { cacheGet, cacheSet } from "@/lib/static-cache";

interface TBOCity {
  Code: string;
  Name: string;
}

interface CityResult {
  code: string;
  name: string;
  state: string;
  source: "tbo" | "fallback";
  iata_code?: string;
}

let _tboCitiesCache: CityResult[] | null = null;
let _tboCitiesCacheKey = "";
let _tboCitiesCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

async function fetchIATACodes(): Promise<Record<string, string>> {
  const data = await cities.findTBOCodes();
  const iataMap: Record<string, string> = {};
  for (const c of data as { name: string; iata_code: string | null }[]) {
    if (c.name && c.iata_code) {
      iataMap[c.name.toLowerCase()] = c.iata_code;
    }
  }
  return iataMap;
}

async function fetchTBOCities(countryCode: string): Promise<CityResult[]> {
  const now = Date.now();
  const cacheKey = countryCode.toUpperCase();
  if (_tboCitiesCache && cacheKey === _tboCitiesCacheKey && now - _tboCitiesCacheTime < CACHE_TTL) {
    return _tboCitiesCache;
  }

  let tboCities: TBOCity[] = [];
  try {
    const dbCached = await cacheGet<TBOCity[]>("CityList", countryCode);
    if (dbCached && dbCached.length > 0) {
      tboCities = dbCached;
    }
  } catch {}

  if (tboCities.length === 0) {
    const res = await api.getCities(countryCode);
    tboCities = (res as any).CityList || [];
    try { await cacheSet("CityList", tboCities, countryCode, { ttlSeconds: 86400 }); } catch {}
  }

  const iataMap = await fetchIATACodes();

  const parsed = tboCities.map(c => {
    const parts = (c.Name || "").split(",").map(s => s.trim());
    const name = parts[0];
    return {
      code: c.Code,
      name,
      state: parts[1] || "",
      source: "tbo" as const,
      iata_code: iataMap[name.toLowerCase()] || undefined,
    };
  });

  const seen = new Set<string>();
  const unique = parsed.filter(c => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  _tboCitiesCache = unique;
  _tboCitiesCacheKey = cacheKey;
  _tboCitiesCacheTime = now;

  return unique;
}

async function fetchDBCities(): Promise<CityResult[]> {
  const data = await cities.findAll();

  return (data as { id: string; name: string; country: string; iata_code: string | null }[]).map((c) => ({
    code: c.id,
    name: c.name,
    state: c.country || "",
    source: "fallback" as const,
    iata_code: c.iata_code || undefined,
  }));
}

export async function GET(req: NextRequest) {
  const countryCode = req.nextUrl.searchParams.get("countryCode") || "IN";

  try {
    const tboCities = await fetchTBOCities(countryCode);
    if (tboCities.length > 0) {
      return NextResponse.json({ source: "tbo", cities: tboCities, countryCode });
    }
  } catch (e) {
    console.warn(`TBO CityList failed for ${countryCode}, falling back to DB:`, e);
  }

  try {
    const dbCities = await fetchDBCities();
    return NextResponse.json({ source: "database", cities: dbCities, countryCode });
  } catch (e) {
    console.error("DB cities fallback also failed:", e);
    return NextResponse.json({ source: "fallback", cities: [], countryCode });
  }
}
