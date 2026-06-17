import { NextRequest, NextResponse } from "next/server";
import * as cities from "@/lib/db/cities";

const BASE_URL = "https://api.tbotechnology.in/TBOHolidays_HotelAPI";
const HOTEL_USERNAME = process.env.TBO_HOTEL_USERNAME || "TBOStaticAPITest";
const HOTEL_PASSWORD = process.env.TBO_HOTEL_PASSWORD || "Tbo@11530818";
const AUTH_HEADER = { Authorization: `Basic ${Buffer.from(`${HOTEL_USERNAME}:${HOTEL_PASSWORD}`).toString("base64")}` };

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
let _tboCitiesCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

async function fetchIATACodes(): Promise<Record<string, string>> {
  const data = await cities.findTBOCodes();
  const iataMap: Record<string, string> = {};
  for (const c of data as any[]) {
    if (c.name && c.iata_code) {
      iataMap[c.name.toLowerCase()] = c.iata_code;
    }
  }
  return iataMap;
}

async function fetchTBOCities(): Promise<CityResult[]> {
  const now = Date.now();
  if (_tboCitiesCache && now - _tboCitiesCacheTime < CACHE_TTL) {
    return _tboCitiesCache;
  }

  const res = await fetch(`${BASE_URL}/CityList`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...AUTH_HEADER },
    body: JSON.stringify({ CountryCode: "IN" }),
  });

  if (!res.ok) {
    throw new Error(`TBO CityList HTTP ${res.status}`);
  }

  const data = await res.json();
  const tboCities: TBOCity[] = data.CityList || [];

  const iataMap = await fetchIATACodes();

  const parsed = tboCities.map(c => {
    const parts = c.Name.split(",").map(s => s.trim());
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
  _tboCitiesCacheTime = now;

  return unique;
}

async function fetchSupabaseCities(): Promise<CityResult[]> {
  const data = await cities.findAll();

  return (data as any[]).map((c) => ({
    code: c.id,
    name: c.name,
    state: c.country || "",
    source: "fallback" as const,
    iata_code: c.iata_code || undefined,
  }));
}

export async function GET(_req: NextRequest) {
  try {
    const tboCities = await fetchTBOCities();
    if (tboCities.length > 0) {
      return NextResponse.json({ source: "tbo", cities: tboCities });
    }
  } catch (e) {
    console.warn("TBO CityList failed, falling back to Supabase:", e);
  }

  try {
    const supabaseCities = await fetchSupabaseCities();
    return NextResponse.json({ source: "supabase", cities: supabaseCities });
  } catch (e) {
    console.error("Supabase cities fallback also failed:", e);
    return NextResponse.json({ source: "fallback", cities: [] });
  }
}
