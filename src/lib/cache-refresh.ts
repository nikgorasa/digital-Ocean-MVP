import * as api from "./tbo-hotel-api";
import { cacheGet, cacheSet, getTTLSeconds, markRefreshStart, markRefreshEnd } from "./static-cache";

export async function refreshCountries(): Promise<{ count: number; error?: string }> {
  const dataType = "CountryList";
  await markRefreshStart(dataType);
  try {
    const res = await api.getCountries();
    const countries = res.CountryList || [];
    const ttl = await getTTLSeconds(dataType);
    await cacheSet(dataType, countries, undefined, { ttlSeconds: ttl });
    await markRefreshEnd(dataType, true);
    return { count: countries.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markRefreshEnd(dataType, false, msg);
    return { count: 0, error: msg };
  }
}

export async function refreshCities(countryCode?: string): Promise<{ count: number; error?: string }> {
  const dataType = "CityList";
  await markRefreshStart(dataType);
  const codes = countryCode ? [countryCode] : ["IN", "AE", "TH", "SG", "MY", "ID", "VN", "PH", "LK", "NP", "MV", "BH", "QA", "OM", "KW", "SA", "GB", "US", "DE", "FR", "IT", "ES", "NL", "CH", "AT", "BE", "TR", "ZA", "AU", "NZ", "JP", "KR", "CN", "TW", "HK", "MO"];
  let total = 0;
  try {
    const ttl = await getTTLSeconds(dataType);
    for (const cc of codes) {
      try {
        const res = await api.getCities(cc);
        const cities = res.CityList || [];
        await cacheSet(dataType, cities, cc, { ttlSeconds: ttl });
        total += cities.length;
      } catch (e) {
        console.warn(`[cache-refresh] CityList failed for ${cc}:`, e);
      }
    }
    await markRefreshEnd(dataType, true);
    return { count: total };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markRefreshEnd(dataType, false, msg);
    return { count: total, error: msg };
  }
}

export async function refreshHotelCodes(cityCode: string): Promise<{ count: number; error?: string }> {
  const dataType = "HotelCodeList";
  try {
    const res = await api.getHotelCodeList(cityCode);
    const hotels = res.Hotels || [];
    const ttl = await getTTLSeconds(dataType);
    await cacheSet(dataType, hotels, cityCode, { ttlSeconds: ttl });
    return { count: hotels.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { count: 0, error: msg };
  }
}

export async function refreshHotelDetails(hotelCodes: string[]): Promise<{ count: number; error?: string }> {
  const dataType = "HotelDetails";
  const BATCH_SIZE = 15;
  let total = 0;
  try {
    const ttl = await getTTLSeconds(dataType);
    for (let i = 0; i < hotelCodes.length; i += BATCH_SIZE) {
      const batch = hotelCodes.slice(i, i + BATCH_SIZE);
      try {
        const res = await api.getHotelDetails(batch.join(","));
        const details = res.HotelDetails || [];
        for (const d of details) {
          await cacheSet(dataType, d, d.HotelCode, { ttlSeconds: ttl });
          total++;
        }
      } catch (e) {
        console.warn(`[cache-refresh] HotelDetails batch failed:`, e);
      }
    }
    return { count: total };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { count: total, error: msg };
  }
}

export async function refreshAll(): Promise<Record<string, { count: number; error?: string }>> {
  const results: Record<string, { count: number; error?: string }> = {};
  results.countries = await refreshCountries();
  results.cities = await refreshCities();
  return results;
}
