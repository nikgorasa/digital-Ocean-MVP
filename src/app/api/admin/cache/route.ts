import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { cacheStats, cacheFlush, cacheDelete, updateTTL, getCacheConfigs, clearMemoryCache } from "@/lib/static-cache";
import { refreshCountries, refreshCities, refreshHotelCodes, refreshHotelDetails, refreshAll } from "@/lib/cache-refresh";

export async function GET() {
  try {
    await requireAdmin();
    const [stats, configs] = await Promise.all([cacheStats(), getCacheConfigs()]);
    return NextResponse.json({ stats, configs });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; dataType?: string; qualifier?: string; ttlSeconds?: number; hotelCodes?: string[]; countryCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, dataType, qualifier, ttlSeconds, hotelCodes, countryCode } = body;

  switch (action) {
    case "refresh": {
      if (!dataType) return NextResponse.json({ error: "dataType required" }, { status: 400 });
      let result: { count: number; error?: string };
      switch (dataType) {
        case "CountryList":
          result = await refreshCountries();
          break;
        case "CityList":
          result = await refreshCities(countryCode);
          break;
        case "HotelCodeList":
          if (!qualifier) return NextResponse.json({ error: "qualifier (cityCode) required" }, { status: 400 });
          result = await refreshHotelCodes(qualifier);
          break;
        case "HotelDetails":
          if (!hotelCodes?.length) return NextResponse.json({ error: "hotelCodes required" }, { status: 400 });
          result = await refreshHotelDetails(hotelCodes);
          break;
        default:
          return NextResponse.json({ error: `Unknown dataType: ${dataType}` }, { status: 400 });
      }
      return NextResponse.json({ success: !result.error, ...result });
    }
    case "refresh-all": {
      const results = await refreshAll();
      return NextResponse.json({ results });
    }
    case "flush": {
      if (!dataType) return NextResponse.json({ error: "dataType required" }, { status: 400 });
      const count = await cacheFlush(dataType);
      return NextResponse.json({ success: true, deleted: count });
    }
    case "delete": {
      if (!dataType) return NextResponse.json({ error: "dataType required" }, { status: 400 });
      await cacheDelete(dataType, qualifier);
      return NextResponse.json({ success: true });
    }
    case "update-ttl": {
      if (!dataType || !ttlSeconds) return NextResponse.json({ error: "dataType and ttlSeconds required" }, { status: 400 });
      await updateTTL(dataType, ttlSeconds);
      return NextResponse.json({ success: true });
    }
    case "clear-memory": {
      clearMemoryCache();
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
