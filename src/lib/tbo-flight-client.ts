import type {
  TBOFlightAuthRequest,
  TBOFlightSearchRequest,
  TBOFlightSearchSegment,
  TBOFlightFareRuleRequest,
  TBOFlightFareQuoteRequest,
  TBOFlightSSRRequest,
  TBOFlightBookRequest,
  TBOFlightTicketLCCRequest,
  TBOFlightTicketNonLCCRequest,
  TBOFlightBookingDetailRequest,
  TBOFlightDisplay,
  TBOFlightSearchOutput,
  TBOFlightResult,
  TBOFlightSegment,
  TBOFlightTicketOutput,
} from "./tbo-flight-types";
import * as api from "./tbo-flight-api";
import { readConfig } from "./config-service";

let cachedToken: { tokenId: string; date: string } | null = null;

// Flight search result cache (5-minute TTL)
const searchCache = new Map<string, { data: TBOFlightSearchOutput; ts: number }>();
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSearchCacheKey(params: {
  Origin: string; Destination: string; AdultCount: number; ChildCount: number;
  InfantCount: number; JourneyType: number; PreferredDepartureTime?: string;
  PreferredArrivalTime?: string; CabinClass?: string;
  multiCityLegs?: { origin: string; destination: string; date: string }[];
}): string {
  return JSON.stringify({
    o: params.Origin, d: params.Destination, a: params.AdultCount,
    c: params.ChildCount, i: params.InfantCount, j: params.JourneyType,
    dep: params.PreferredDepartureTime, ret: params.PreferredArrivalTime,
    cab: params.CabinClass, mcl: params.multiCityLegs,
  });
}

function cleanSearchCache() {
  const now = Date.now();
  for (const [key, val] of searchCache) {
    if (now - val.ts > SEARCH_CACHE_TTL_MS) searchCache.delete(key);
  }
}

let _defaultEndUserIp = "192.168.1.1";

function getEndUserIp(): string {
  return _defaultEndUserIp;
}

export function setEndUserIp(ip: string): void {
  _defaultEndUserIp = ip;
}

async function getClientId(): Promise<string> {
  const cfg = await readConfig("tbo_flight");
  return cfg.clientId || process.env.TBO_CLIENT_ID || "ApiIntegrationNew";
}

async function validateCredentials(): Promise<void> {
  const cfg = await readConfig("tbo_flight");
  const username = cfg.username || process.env.TBO_USERNAME || "";
  const password = cfg.password || process.env.TBO_PASSWORD || "";
  if (!username || !password) {
    throw new Error("TBO flight credentials not configured. Set TBO_USERNAME and TBO_PASSWORD.");
  }
}

async function ensureToken(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedToken?.date === today) {
    return cachedToken.tokenId;
  }
  const clientId = await getClientId();
  const cfg = await readConfig("tbo_flight");
  const username = cfg.username || process.env.TBO_USERNAME || "";
  const password = cfg.password || process.env.TBO_PASSWORD || "";

  const req: TBOFlightAuthRequest = {
    ClientId: clientId,
    UserName: username,
    Password: password,
    EndUserIp: getEndUserIp(),
  };
  const res = await api.authenticate(req);
  if (res.Status !== 1) {
    throw new Error(`TBO auth failed: Status=${res.Status} ${res.Error?.ErrorMessage || ""}`);
  }
  cachedToken = { tokenId: res.TokenId, date: today };
  return res.TokenId;
}

// TBO returns inclusions as "Meal:Included&&Seat:Excluded&&Lounge Pass&&Excluded"
// Split on &&, clean up labels
function parseTboInclusions(raw?: string[]): string[] {
  if (!raw || raw.length === 0) return [];
  const joined = raw.join(" ");
  const items = joined.split("&&").map(s => s.trim()).filter(Boolean);
  return items.map(item => {
    // "Meal:Included" → "Meal: Included"
    // "Seat:Excluded" → "Seat: Excluded"
    // "Lounge Pass" → "Lounge Pass"
    const colonIdx = item.indexOf(":");
    if (colonIdx > 0) {
      const key = item.slice(0, colonIdx).trim();
      const val = item.slice(colonIdx + 1).trim();
      if (val) return `${key}: ${val}`;
      return key;
    }
    return item;
  });
}

function firstSeg(r: TBOFlightResult): TBOFlightSegment | undefined {
  return r.Segments?.[0]?.[0];
}

function lastSeg(r: TBOFlightResult): TBOFlightSegment | undefined {
  const legs = r.Segments?.[0];
  return legs?.[legs.length - 1];
}

function toDisplay(
  r: TBOFlightResult,
  leg: "outbound" | "inbound" | "oneway",
): TBOFlightDisplay {
  const f = firstSeg(r);
  const l = lastSeg(r);
  const originCountry = f?.Origin?.Airport?.CountryCode || "";
  const destCountry = l?.Destination?.Airport?.CountryCode || "";
  const isDomestic = originCountry === destCountry && originCountry === "IN";
  return {
    resultIndex: r.ResultIndex,
    leg,
    isLCC: r.IsLCC,
    isRefundable: r.IsRefundable,
    isDomestic,
    originCountry,
    destCountry,
    source: r.Source,
    airline: f?.Airline?.AirlineName ?? "",
    airlineCode: f?.Airline?.AirlineCode ?? "",
    flightNumber: f?.Airline?.FlightNumber ?? "",
    operatingCarrier: f?.Airline?.OperatingCarrier ?? "",
    origin: f?.Origin?.Airport?.AirportCode ?? "",
    destination: l?.Destination?.Airport?.AirportCode ?? "",
    departureTime: f?.Origin?.DepTime ?? "",
    arrivalTime: l?.Destination?.ArrTime ?? "",
    duration: (r.Segments?.[0] ?? []).reduce((sum, s) => sum + s.Duration, 0),
    cabinClass: f?.CabinClass ?? 0,
    baggage: f?.Baggage ?? "",
    cabinBaggage: f?.CabinBaggage ?? "",
    currency: r.Fare.Currency,
    publishedFare: r.Fare.PublishedFare,
    offeredFare: r.Fare.OfferedFare,
    baseFare: r.Fare.BaseFare,
    tax: r.Fare.Tax,
    yqTax: r.Fare.YQTax,
    discount: r.Fare.Discount,
    commissionEarned: r.Fare.CommissionEarned,
    penalty: r.Penalty,
    lastTicketDate: r.LastTicketDate,
    fareRules: r.FareRules,
    segments: r.Segments,
    fareBreakdown: r.FareBreakdown,
    airlineRemark: r.AirlineRemark,
    fareInclusions: parseTboInclusions(r.FareInclusions),
    fareClassification: r.FareClassification,
    isExclusiveFare: r.IsExclusiveFare,
    isFreeMealAvailable: r.IsFreeMealAvailable,
    isHoldAllowedWithSSR: r.IsHoldAllowedWithSSR,
    isUpsellAllowed: r.IsUpsellAllowed,
    gstAllowed: r.GSTAllowed,
    isGSTMandatory: r.IsGSTMandatory,
    isPassportRequiredAtBook: r.IsPassportRequiredAtBook,
    isPanRequiredAtBook: r.IsPanRequiredAtBook,
    validatingAirline: r.ValidatingAirline,
    penaltyCharges: r.PenaltyCharges,
    ticketAdvisory: r.TicketAdvisory,
  };
}

export async function searchFlights(params: {
  Origin: string;
  Destination: string;
  AdultCount: number;
  ChildCount: number;
  InfantCount: number;
  JourneyType: number;
  PreferredDepartureTime?: string;
  PreferredArrivalTime?: string;
  CabinClass?: string;
  EndUserIp?: string;
  multiCityLegs?: { origin: string; destination: string; date: string }[];
}): Promise<TBOFlightSearchOutput> {
  const t0 = Date.now();

  // Check cache first
  cleanSearchCache();
  const cacheKey = getSearchCacheKey(params);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL_MS) {
    console.log(`[TBO] Cache HIT for ${params.Origin}→${params.Destination}`);
    return cached.data;
  }
  console.log(`[TBO] Cache MISS for ${params.Origin}→${params.Destination} — fetching`);

  // Read config ONCE (cached 60s in config-service)
  const cfg = await readConfig("tbo_flight");
  const username = cfg.username || process.env.TBO_USERNAME || "";
  const password = cfg.password || process.env.TBO_PASSWORD || "";
  if (!username || !password) {
    throw new Error("TBO flight credentials not configured.");
  }

  const t1 = Date.now();
  const cabinClassMap: Record<string, number> = {
    "economy": 1,
    "premium economy": 2,
    "business": 3,
    "premium business": 4,
    "first": 5,
    "all": 0,
  };
  const cabinClassNum = cabinClassMap[(params.CabinClass || "economy").toLowerCase()] ?? 1;

  const tokenId = await ensureToken();
  const t2 = Date.now();
  const segments: TBOFlightSearchSegment[] = [];
  if (params.JourneyType === 3 && params.multiCityLegs?.length) {
    params.multiCityLegs.forEach((leg) => {
      segments.push({
        Origin: leg.origin,
        Destination: leg.destination,
        FlightCabinClass: cabinClassNum,
        PreferredDepartureTime: leg.date || "",
        PreferredArrivalTime: "",
      });
    });
  } else {
    segments.push({
      Origin: params.Origin,
      Destination: params.Destination,
      FlightCabinClass: cabinClassNum,
      PreferredDepartureTime: params.PreferredDepartureTime || "",
      PreferredArrivalTime: "",
    });
    if (params.JourneyType === 2 && params.PreferredArrivalTime) {
      segments.push({
        Origin: params.Destination,
        Destination: params.Origin,
        FlightCabinClass: cabinClassNum,
        PreferredDepartureTime: params.PreferredArrivalTime,
        PreferredArrivalTime: "",
      });
    }
  }
  const searchReq: TBOFlightSearchRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: tokenId,
    AdultCount: params.AdultCount,
    ChildCount: params.ChildCount,
    InfantCount: params.InfantCount,
    JourneyType: params.JourneyType,
    Segments: segments,
  };
  const res = await api.searchFlights(tokenId, searchReq);
  const t3 = Date.now();
  console.log(`[TBO] Search API call: ${t3 - t2}ms`);
  if (res.Response?.ResponseStatus !== 1) {
    const errorMsg = res.Response?.Error?.ErrorMessage || "";
    // "No Result Found" is a valid TBO response — not an error, just no flights for this route/date
    // Do NOT cache empty results (API might be temporarily unavailable)
    if (errorMsg.toLowerCase().includes("no result")) {
      return { flights: [], traceId: res.Response?.TraceId || "" };
    }
    throw new Error(`Flight search failed: ${errorMsg || res.Response?.ResponseStatus}`);
  }
  const results = res.Response.Results;
  const flightList: TBOFlightResult[] = Array.isArray(results[0])
    ? (results as TBOFlightResult[][]).flat()
    : (results as unknown as TBOFlightResult[]);

  // NOTE: TBO's CabinClass in responses is unreliable — it often returns 2 (Premium Economy)
  // even when Economy (1) is requested. The API-side filtering is inconsistent.
  // Do NOT filter by cabin class here — show all results and let the UI tier label reflect
  // what TBO actually returns. This prevents "No flights found" for valid searches.
  const filteredList = flightList;

  const flights = filteredList.map((r) => {
    const isReturn = params.JourneyType === 2 || params.JourneyType === 5;
    const tripInd = r.Segments?.[0]?.[0]?.TripIndicator ?? 1;
    let leg: "outbound" | "inbound" | "oneway";
    if (!isReturn) leg = "oneway";
    else if (tripInd === 1) leg = "outbound";
    else leg = "inbound";
    return toDisplay(r, leg);
  });
  const result: TBOFlightSearchOutput = { flights, traceId: res.Response.TraceId };
  const t4 = Date.now();
  console.log(`[TBO] Result processing: ${t4 - t3}ms (${flightList.length} flights → ${result.flights.length} displayed)`);
  // Cache the result
  searchCache.set(cacheKey, { data: result, ts: Date.now() });
  console.log(`[TBO] Total search: ${t4 - t0}ms (config: ${t1-t0}ms, token: ${t2-t1}ms, api: ${t3-t2}ms, process: ${t4-t3}ms)`);
  return result;
}

export async function getFareRule(params: {
  traceId: string;
  resultIndex: string;
  EndUserIp?: string;
}): Promise<{ traceId: string; fareRules: any[] }> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const req: TBOFlightFareRuleRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
  };
  const res = await api.getFareRule(req);
  if (res.Response?.ResponseStatus !== 1) {
    throw new Error(`FareRule failed: ${res.Response?.Error?.ErrorMessage || res.Response?.ResponseStatus}`);
  }
  return { traceId: res.Response.TraceId, fareRules: res.Response.FareRules };
}

export async function getFareQuote(params: {
  traceId: string;
  resultIndex: string;
  EndUserIp?: string;
}): Promise<{
  isPriceChanged: boolean;
  traceId: string;
  fare: any;
  fareBreakdown: any[];
  segments: any[];
}> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const req: TBOFlightFareQuoteRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
  };
  const res = await api.getFareQuote(req);
  if (res.Response?.ResponseStatus !== 1) {
    throw new Error(`FareQuote failed: ${res.Response?.Error?.ErrorMessage || res.Response?.ResponseStatus}`);
  }
  const r = Array.isArray(res.Response.Results)
    ? res.Response.Results[0]
    : res.Response.Results;
  return {
    isPriceChanged: res.Response.IsPriceChanged,
    traceId: res.Response.TraceId,
    fare: r?.Fare,
    fareBreakdown: r?.FareBreakdown ?? [],
    segments: r?.Segments ?? [],
  };
}

export async function getSSR(params: {
  traceId: string;
  resultIndex: string;
  EndUserIp?: string;
}): Promise<any> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const req: TBOFlightSSRRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
  };
  const res = await api.getSSR(req);
  if (res.Response?.ResponseStatus !== 1) {
    throw new Error(`SSR failed: ${res.Response?.Error?.ErrorMessage || res.Response?.ResponseStatus}`);
  }
  return {
    isLCC: res.Response.IsLCC,
    baggage: res.Response.Baggage,
    meals: res.Response.MealDynamic,
    seats: res.Response.SeatDynamic,
    traceId: res.Response.TraceId,
  };
}

export async function bookFlight(params: {
  traceId: string;
  resultIndex: string;
  passengers: TBOFlightBookRequest["Passengers"];
  EndUserIp?: string;
  }): Promise<{ bookingId: string; pnr: string; isPriceChanged: boolean; isTimeChanged: boolean }> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const req: TBOFlightBookRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
    Passengers: params.passengers,
  };
  const res = await api.bookFlight(req);
  if (res.Response?.ResponseStatus !== 1) {
    throw new Error(`Flight book failed: ${res.Response?.Error?.ErrorMessage || res.Response?.ResponseStatus}`);
  }
  return {
    bookingId: res.Response.FlightItinerary.BookingId,
    pnr: res.Response.FlightItinerary.PNR,
    isPriceChanged: res.Response.IsPriceChanged,
    isTimeChanged: res.Response.IsTimeChanged || false,
  };
}

export async function ticketFlight(params: {
  traceId: string;
  resultIndex?: string;
  PNR?: string;
  BookingId?: string;
  passengers: {
    PaxId: number;
    Title: string;
    FirstName: string;
    LastName: string;
    DateOfBirth?: string;
    Gender?: number;
    PassportNo?: string;
    PassportExpiry?: string;
    AddressLine1?: string;
    City?: string;
    CountryCode?: string;
    CountryName?: string;
    ContactNo?: string;
    Email?: string;
    IsLeadPax?: boolean;
    Nationality?: string;
    PaxType?: number;
    Fare?: any;
  }[];
  segments: any[];
  fare: any;
  fareBreakdown: any[];
  isLCC: boolean;
  EndUserIp?: string;
}): Promise<TBOFlightTicketOutput> {
  await validateCredentials();
  const tokenId = await ensureToken();

  if (params.isLCC) {
    const ssrReq: TBOFlightSSRRequest = {
      EndUserIp: params.EndUserIp || getEndUserIp(),
      TokenId: tokenId,
      TraceId: params.traceId,
      ResultIndex: params.resultIndex || "",
    };
    const ssrRes = await api.getSSR(ssrReq);
    const allMeals = (ssrRes.Response?.MealDynamic || []).flat();
    const allBaggage = (ssrRes.Response?.Baggage || []).flat();
    const noMeal = allMeals.find((m: any) => m.Code === "NoMeal") || allMeals[0];
    const noBag = allBaggage.find((b: any) => b.Code === "NoBaggage") || allBaggage[0];

    const req: TBOFlightTicketLCCRequest = {
      EndUserIp: params.EndUserIp || getEndUserIp(),
      TokenId: tokenId,
      TraceId: params.traceId,
      ResultIndex: params.resultIndex || "",
      Passengers: params.passengers.map(p => ({
        ...p,
        PaxType: p.PaxType ?? 1,
        DateOfBirth: p.DateOfBirth ?? "",
        Gender: p.Gender ?? 1,
        AddressLine1: p.AddressLine1 ?? "",
        City: p.City ?? "",
        CountryCode: p.CountryCode ?? "",
        CountryName: p.CountryName ?? "",
        ContactNo: p.ContactNo ?? "",
        Email: p.Email ?? "",
        IsLeadPax: p.IsLeadPax ?? false,
        Nationality: p.Nationality ?? "",
        Fare: p.Fare ?? { BaseFare: 0, Tax: 0, TransactionFee: 0, YQTax: 0, AdditionalTxnFeeOfrd: 0, AdditionalTxnFeePub: 0, AirTransFee: 0 },
        ...(noBag ? { Baggage: [noBag] } : {}),
        ...(noMeal ? { MealDynamic: [noMeal] } : {}),
      })),
    };
    const res = await api.ticketFlight(req);
    if (res.Response?.ResponseStatus !== 1) {
      throw new Error(`Ticket failed: ${res.Response?.ResponseStatus} ${JSON.stringify(res.Response?.Error)}`);
    }
    const r = res.Response.Response;
    return { results: [{ bookingId: r?.BookingId, pnr: r?.PNR }] };
  } else {
    if (!params.BookingId || !params.PNR) throw new Error("Non-LCC ticket requires BookingId and PNR");
    const req: TBOFlightTicketNonLCCRequest = {
      EndUserIp: params.EndUserIp || getEndUserIp(),
      TokenId: tokenId,
      TraceId: params.traceId,
      PNR: params.PNR,
      BookingId: params.BookingId,
      Passport: params.passengers.map(p => ({
        PaxId: p.PaxId,
        PassportNo: p.PassportNo ?? "",
        PassportExpiry: p.PassportExpiry ?? "",
        DateOfBirth: p.DateOfBirth ?? "",
      })),
    };
    const res = await api.ticketFlight(req);
    if (res.Response?.ResponseStatus !== 1) {
      throw new Error(`Non-LCC Ticket failed: ${res.Response?.ResponseStatus} ${JSON.stringify(res.Response?.Error)}`);
    }
    const r = res.Response.Response;
    return { results: [{ bookingId: r?.BookingId, pnr: r?.PNR }] };
  }
}

export async function getBookingDetail(params: {
  bookingIds: string[];
  EndUserIp?: string;
}): Promise<any[]> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const results = [];
  for (const bid of params.bookingIds) {
    const req: TBOFlightBookingDetailRequest = {
      EndUserIp: params.EndUserIp || getEndUserIp(),
      TokenId: tokenId,
      BookingId: bid,
    };
    const res = await api.getBookingDetail(req);
    if (res.Response?.ResponseStatus === 1) {
      results.push(res.Response.FlightItinerary);
    }
  }
  return results;
}
