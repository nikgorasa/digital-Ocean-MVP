import { NextRequest, NextResponse } from "next/server";
import { refreshCountries, refreshCities, refreshHotelCodes } from "@/lib/cache-refresh";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    // 1. Refresh countries (249 items)
    console.log("[Cron] Refreshing countries...");
    results.countries = await refreshCountries();

    // 2. Refresh cities for all key countries (no arg = refresh all)
    console.log("[Cron] Refreshing cities for all key countries...");
    results.cities = await refreshCities();

    // 3. Refresh hotel codes for key cities (top cities per country)
    const keyCities = [
      { code: "15648", name: "Goa", country: "IN" },
      { code: "13484", name: "Mumbai", country: "IN" },
      { code: "13482", name: "Delhi", country: "IN" },
      { code: "14565", name: "Bangalore", country: "IN" },
    ];
    console.log(`[Cron] Refreshing hotel codes for ${keyCities.length} cities...`);
    const hotelResults = [];
    for (const city of keyCities) {
      try {
        const result = await refreshHotelCodes(city.code);
        hotelResults.push({ city: city.name, ...result });
      } catch (e) {
        hotelResults.push({ city: city.name, error: e instanceof Error ? e.message : String(e) });
      }
    }
    results.hotelCodes = hotelResults;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (e) {
    console.error("[Cron] Sync failed:", e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      results,
    }, { status: 500 });
  }
}
