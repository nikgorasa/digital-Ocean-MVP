import { NextRequest, NextResponse } from "next/server";
import * as cities from "@/lib/db/cities";
import * as api from "@/lib/tbo-hotel-api";
import { cacheGet, cacheSet } from "@/lib/static-cache";

interface TBOCity {
  Code: string;
  Name: string;
  CountryCode?: string;
  CountryName?: string;
  CityCode?: number;
  CityName?: string;
}

interface CityResult {
  code: string;
  name: string;
  state: string;
  source: "tbo" | "fallback";
  iata_code?: string;
  country_code?: string;
  flag?: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳", AE: "🇦🇪", TH: "🇹🇭", SG: "🇸🇬", MY: "🇲🇾",
  ID: "🇮🇩", JP: "🇯🇵", KR: "🇰🇷", GB: "🇬🇧", US: "🇺🇸",
  TR: "🇹🇷", VN: "🇻🇳", PH: "🇵🇭", LK: "🇱🇰", NP: "🇳🇵",
  MV: "🇲🇻", FR: "🇫🇷", DE: "🇩🇪", AU: "🇦🇺", SA: "🇸🇦",
  QA: "🇶🇦", OM: "🇴🇲", KW: "🇰🇼", EG: "🇪🇬", ZA: "🇿🇦",
  HK: "🇭🇰", CN: "🇨🇳", CA: "🇨🇦", RU: "🇷🇺", BR: "🇧🇷",
  MX: "🇲🇽", KE: "🇰🇪",
};

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

let _iataMapCache: Record<string, string> | null = null;
let _iataMapCacheTime = 0;
const IATA_CACHE_TTL = 60 * 60 * 1000;

async function getIATAMap(): Promise<Record<string, string>> {
  const now = Date.now();
  if (_iataMapCache && now - _iataMapCacheTime < IATA_CACHE_TTL) {
    return _iataMapCache;
  }
  _iataMapCache = await fetchIATACodes();
  _iataMapCacheTime = now;
  return _iataMapCache;
}

async function fetchTBOCities(countryCode: string, iataMap?: Record<string, string>): Promise<CityResult[]> {
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

  const map = iataMap || await getIATAMap();

  const parsed = tboCities.map(c => {
    const parts = (c.Name || "").split(",").map(s => s.trim());
    const name = parts[0];
    const cc = c.CountryCode || countryCode;
    return {
      code: c.Code,
      name,
      state: parts[1] || "",
      source: "tbo" as const,
      iata_code: map[name.toLowerCase()] || undefined,
      country_code: cc,
      flag: COUNTRY_FLAGS[cc] || undefined,
    };
  });

  const seen = new Set<string>();
  const unique = parsed.filter(c => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    if (!/^[a-zA-Z]/.test(c.name)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  _tboCitiesCache = unique;
  _tboCitiesCacheKey = cacheKey;
  _tboCitiesCacheTime = now;

  return unique;
}

export async function GET(req: NextRequest) {
  const countryCode = req.nextUrl.searchParams.get("countryCode");

  try {
    if (countryCode) {
      // Single country mode (used by CitySearchDropdown with specific country)
      const tboCities = await fetchTBOCities(countryCode);
      if (tboCities.length > 0) {
        return NextResponse.json({ source: "tbo", cities: tboCities, countryCode });
      }
    } else {
      // Global mode — fetch all cached countries in parallel
      const ALL_COUNTRIES = ["IN","AE","TH","SG","MY","ID","VN","PH","LK","NP","MV","BH","QA","OM","KW","SA","GB","US","DE","FR","IT","ES","NL","CH","AT","BE","TR","ZA","AU","NZ","JP","KR","CN","TW","HK","MO"];
      const iataMap = await getIATAMap();
      const results = await Promise.allSettled(
        ALL_COUNTRIES.map(cc => fetchTBOCities(cc, iataMap))
      );
      const allCities: CityResult[] = [];
      const seenNames = new Set<string>();
      let failCount = 0;
      for (const r of results) {
        if (r.status === "fulfilled") {
          for (const c of r.value) {
            const key = `${c.name.toLowerCase()}:${c.code}`;
            if (!seenNames.has(key)) {
              seenNames.add(key);
              allCities.push(c);
            }
          }
        } else {
          failCount++;
          console.warn("[TBO Cities] Country fetch failed:", r.reason);
        }
      }
      if (failCount > 0) {
        console.warn(`[TBO Cities] ${failCount}/${ALL_COUNTRIES.length} countries failed`);
      }
      allCities.sort((a, b) => a.name.localeCompare(b.name));
      if (allCities.length > 0) {
        return NextResponse.json({ source: "tbo", cities: allCities });
      }
    }
  } catch (e) {
    console.warn(`TBO CityList failed for ${countryCode || "global"}:`, e);
  }

  return NextResponse.json({ source: "tbo_unavailable", cities: [], countryCode });
}
