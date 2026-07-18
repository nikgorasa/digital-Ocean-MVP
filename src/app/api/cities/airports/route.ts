import { NextRequest, NextResponse } from "next/server";
import { searchAirports, type AirportRow } from "@/lib/db/cities";

// Country grouping for structured display
const COUNTRY_GROUPS: Record<string, { label: string; code: string; flag: string }> = {
  IN: { label: "India", code: "IN", flag: "🇮🇳" },
  AE: { label: "UAE", code: "AE", flag: "🇦🇪" },
  TH: { label: "Thailand", code: "TH", flag: "🇹🇭" },
  SG: { label: "Singapore", code: "SG", flag: "🇸🇬" },
  MY: { label: "Malaysia", code: "MY", flag: "🇲🇾" },
  LK: { label: "Sri Lanka", code: "LK", flag: "🇱🇰" },
  MV: { label: "Maldives", code: "MV", flag: "🇲🇻" },
  NP: { label: "Nepal", code: "NP", flag: "🇳🇵" },
  ID: { label: "Indonesia", code: "ID", flag: "🇮🇩" },
  TR: { label: "Turkey", code: "TR", flag: "🇹🇷" },
  GB: { label: "UK", code: "GB", flag: "🇬🇧" },
  US: { label: "USA", code: "US", flag: "🇺🇸" },
  FR: { label: "France", code: "FR", flag: "🇫🇷" },
  DE: { label: "Germany", code: "DE", flag: "🇩🇪" },
  AU: { label: "Australia", code: "AU", flag: "🇦🇺" },
  JP: { label: "Japan", code: "JP", flag: "🇯🇵" },
  HK: { label: "Hong Kong", code: "HK", flag: "🇭🇰" },
  CN: { label: "China", code: "CN", flag: "🇨🇳" },
  KR: { label: "South Korea", code: "KR", flag: "🇰🇷" },
  VN: { label: "Vietnam", code: "VN", flag: "🇻🇳" },
  SA: { label: "Saudi Arabia", code: "SA", flag: "🇸🇦" },
  QA: { label: "Qatar", code: "QA", flag: "🇶🇦" },
  OM: { label: "Oman", code: "OM", flag: "🇴🇲" },
  KW: { label: "Kuwait", code: "KW", flag: "🇰🇼" },
  EG: { label: "Egypt", code: "EG", flag: "🇪🇬" },
  ZA: { label: "South Africa", code: "ZA", flag: "🇿🇦" },
};

function getGroup(code: string): string {
  if (COUNTRY_GROUPS[code]) return code;
  if (["FR", "DE", "IT", "ES", "NL", "PT", "GR", "CH"].includes(code)) return "EU";
  if (["JP", "CN", "KR", "VN", "TW"].includes(code)) return "EA";
  if (["SA", "QA", "OM", "KW", "EG", "BH", "JO", "LB"].includes(code)) return "ME";
  return "OTHER";
}

const EU_GROUP = { label: "Europe", code: "EU", flag: "🇪🇺" };
const EA_GROUP = { label: "East Asia", code: "EA", flag: "🌏" };
const ME_GROUP = { label: "Middle East", code: "ME", flag: "🕌" };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "40", 10), 100);

    const airports = await searchAirports(q, limit);

    // Build response with group metadata
    const result = airports.map((a: AirportRow) => ({
      code: a.id,
      name: a.name,
      iata_code: a.iata_code,
      airport_name: a.airport_name,
      country_code: a.country_code,
      flag: a.flag,
      latitude: a.latitude,
      longitude: a.longitude,
      airport_type: a.airport_type,
      group: getGroup(a.country_code || ""),
      source: "db" as const,
    }));

    return NextResponse.json({ airports: result, total: result.length });
  } catch (error) {
    console.error("[AIRPORTS_API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
