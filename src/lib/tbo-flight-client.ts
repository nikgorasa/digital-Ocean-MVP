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
  TBOFlightGetCancellationChargesRequest,
  TBOFlightSendChangeRequest,
  TBOFlightGetChangeRequestStatusRequest,
} from "./tbo-flight-types";
import * as api from "./tbo-flight-api";
import { readConfig } from "./config-service";
import { calculatePrice } from "./pricing/pricing-service";

let cachedToken: { tokenId: string; date: string } | null = null;

// Flight search result cache (5-minute TTL)
const SEARCH_CACHE_TTL_MS = 0; // Disabled — caching returns stale TraceIds

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

async function toDisplay(
  r: TBOFlightResult,
  leg: "outbound" | "inbound" | "oneway",
  unitCount: number = 1,
): Promise<TBOFlightDisplay> {
  const f = firstSeg(r);
  const l = lastSeg(r);
  const originCountry = f?.Origin?.Airport?.CountryCode || "";
  const destCountry = l?.Destination?.Airport?.CountryCode || "";
  const isDomestic = originCountry === destCountry && originCountry === "IN";

  const pricing = await calculatePrice(
    r.Fare.PublishedFare,
    { category: "FLIGHT", airlineCode: f?.Airline?.AirlineCode, unitCount },
    r.Fare.Currency || "INR",
  );

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
    publishedFare: pricing.displayedPrice,
    baseRate: pricing.baseRate,
    markupAmount: pricing.markupAmount,
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

  // Cache disabled — always fetch fresh TraceId
  console.log(`[TBO] Fetching fresh results for ${params.Origin}→${params.Destination}`);

  // Read config ONCE (cached 60s in config-service)
  const cfg = await readConfig("tbo_flight");
  const username = cfg.username || process.env.TBO_USERNAME || "";
  const password = cfg.password || process.env.TBO_PASSWORD || "";
  if (!username || !password) {
    throw new Error("TBO flight credentials not configured.");
  }

  // Mock fallback: if forceMock is enabled in ConfigProvider, return empty results
  if (cfg.forceMock) {
    console.log("[TBO-FLIGHT] forceMock enabled — returning empty results");
    return { flights: [], traceId: `MOCK-TRACE-${Date.now()}` };
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

  const flights = await Promise.all(filteredList.map((r) => {
    const isReturn = params.JourneyType === 2 || params.JourneyType === 5;
    let leg: "outbound" | "inbound" | "oneway";
    if (!isReturn) {
      leg = "oneway";
    } else {
      // Iterate ALL segments — TBO packs both legs under Segments[0]
      const allSegs = (r.Segments ?? []).flat();
      const hasInbound = allSegs.some(s => s?.TripIndicator === 2);
      leg = hasInbound ? "inbound" : "outbound";
    }
    return toDisplay(r, leg, (params.AdultCount || 1) + (params.ChildCount || 0) + (params.InfantCount || 1));
  }));
  const result: TBOFlightSearchOutput = { flights, traceId: res.Response.TraceId };
  const t4 = Date.now();
  console.log(`[TBO] Result processing: ${t4 - t3}ms (${flightList.length} flights → ${result.flights.length} displayed)`);
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
    const err: any = new Error(`FareQuote failed: ${res.Response?.Error?.ErrorMessage || res.Response?.ResponseStatus}`);
    err.freshTraceId = res.Response?.TraceId || null;
    err.errorCode = res.Response?.Error?.ErrorCode || res.Response?.ResponseStatus;
    throw err;
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
  console.log("[TBO-SSR] Request:", JSON.stringify({ ...req, TokenId: "..." }));
  const res = await api.getSSR(req);
  console.log("[TBO-SSR] Response status:", res.Response?.ResponseStatus, "error:", res.Response?.Error?.ErrorMessage);
  if (res.Response?.ResponseStatus !== 1) {
    const err: any = new Error(`SSR failed: ${res.Response?.Error?.ErrorMessage || res.Response?.ResponseStatus}`);
    err.freshTraceId = res.Response?.TraceId || null;
    err.errorCode = res.Response?.Error?.ErrorCode || res.Response?.ResponseStatus;
    throw err;
  }
  return {
    isLCC: res.Response.IsLCC,
    baggage: (res.Response.Baggage || []).flat(),
    meals: (res.Response.MealDynamic || []).flat(),
    seats: (res.Response.SeatDynamic || []).flat().flatMap(seg =>
      (seg?.RowSeats?.RowSeats || [])
    ),
    specialServices: (res.Response as any).SpecialServices?.flat() || [],
    seatPreference: (res.Response as any).SeatPreference || [],
    meal: (res.Response as any).Meal || [],
    traceId: res.Response.TraceId,
  };
}

export async function bookFlight(params: {
  traceId: string;
  resultIndex: string;
  passengers: TBOFlightBookRequest["Passengers"];
  EndUserIp?: string;
  }): Promise<{ bookingId: string; pnr: string; isPriceChanged: boolean; isTimeChanged: boolean; traceId: string | null }> {
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
  const rawJson = JSON.stringify(res);
  console.log("[TBO-BOOK] Raw response (first 5000 chars):", rawJson.slice(0, 5000));
  console.log("[TBO-BOOK] Top-level keys:", Object.keys(res));
  console.log("[TBO-BOOK] res.Response keys:", res.Response ? Object.keys(res.Response) : "null/undefined");
  
  // TBO Book response has ResponseStatus at TOP level (sibling of Response), not inside Response.
  // Structure: { ResponseStatus: 1, Response: { PNR, BookingId, FlightItinerary: {...} } }
  // BUT some responses put ResponseStatus inside Response. Handle both.
  const outerResponseStatus = (res as any).ResponseStatus;
  const innerResponseStatus = res.Response?.ResponseStatus;
  const responseStatus = outerResponseStatus ?? innerResponseStatus;
  
  if (responseStatus !== 1) {
    const errMsg = (res as any).Error?.ErrorMessage || res.Response?.Error?.ErrorMessage || responseStatus;
    const err: any = new Error(`Flight book failed: ${errMsg}`);
    err.freshTraceId = res.Response?.TraceId || (res as any).TraceId || null;
    err.errorCode = (res as any).Error?.ErrorCode || res.Response?.Error?.ErrorCode || responseStatus;
    throw err;
  }
  
  // FlightItinerary may be at different nesting levels depending on TBO response version
  const itinerary = res.Response?.FlightItinerary
    || (res.Response as any)?.Response?.FlightItinerary
    || (res as any).FlightItinerary;
  
  if (!itinerary) {
    console.error("[TBO-BOOK] FlightItinerary not found at any nesting level.");
    console.error("[TBO-BOOK] res.Response.Response:", (res.Response as any)?.Response ? Object.keys((res.Response as any).Response) : "N/A");
    console.error("[TBO-BOOK] res keys:", Object.keys(res));
    throw new Error("Flight book succeeded (ResponseStatus=1) but FlightItinerary not found in response.");
  }
  
  return {
    bookingId: itinerary.BookingId,
    pnr: itinerary.PNR,
    isPriceChanged: (res.Response?.IsPriceChanged ?? (res as any).IsPriceChanged) || false,
    isTimeChanged: (res.Response?.IsTimeChanged ?? (res as any).IsTimeChanged) || false,
    traceId: res.Response?.TraceId || (res as any).TraceId || null,
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
  ssrBaggage?: any[];
  ssrMeals?: any[];
  ssrSeats?: any[];
  EndUserIp?: string;
}): Promise<TBOFlightTicketOutput> {
  await validateCredentials();
  const tokenId = await ensureToken();

  if (params.isLCC) {
    if (!params.resultIndex) throw new Error("LCC ticket requires resultIndex");

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
        ...(params.ssrBaggage?.length ? { Baggage: params.ssrBaggage } : {}),
        ...(params.ssrMeals?.length ? { MealDynamic: params.ssrMeals } : {}),
        ...(params.ssrSeats?.length ? { SeatDynamic: params.ssrSeats } : {}),
      })),
    };
    console.log("[TBO-TICKET] LCC request body:", JSON.stringify({ ...req, TokenId: "..." }));
    const res = await api.ticketFlight(req);
    console.log("[TBO-TICKET] LCC response status:", res.Response?.ResponseStatus, "error:", res.Response?.Error?.ErrorMessage);
    if (res.Response?.ResponseStatus !== 1) {
      const err: any = new Error(`Ticket failed: ${res.Response?.ResponseStatus} ${JSON.stringify(res.Response?.Error)}`);
      err.freshTraceId = res.Response?.TraceId || null;
      err.errorCode = res.Response?.Error?.ErrorCode || res.Response?.ResponseStatus;
      throw err;
    }
    const r = res.Response.Response;
    return { results: [{ bookingId: r?.BookingId, pnr: r?.PNR }], traceId: res.Response?.TraceId || null };
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
    console.log("[TBO-TICKET] Non-LCC request body:", JSON.stringify({ ...req, TokenId: "..." }));
    const res = await api.ticketFlight(req);
    console.log("[TBO-TICKET] Non-LCC response status:", res.Response?.ResponseStatus, "error:", res.Response?.Error?.ErrorMessage);
    if (res.Response?.ResponseStatus !== 1) {
      const err: any = new Error(`Non-LCC Ticket failed: ${res.Response?.ResponseStatus} ${JSON.stringify(res.Response?.Error)}`);
      err.freshTraceId = res.Response?.TraceId || null;
      err.errorCode = res.Response?.Error?.ErrorCode || res.Response?.ResponseStatus;
      throw err;
    }
    const r = res.Response.Response;
    return { results: [{ bookingId: r?.BookingId, pnr: r?.PNR }], traceId: res.Response?.TraceId || null };
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

// Flight Cancellation Functions

export async function getCancellationCharges(params: {
  bookingId: string;
  EndUserIp?: string;
}): Promise<{
  refundAmount: number;
  cancellationCharge: number;
  currency: string;
  remarks: string;
}> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const req: TBOFlightGetCancellationChargesRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: tokenId,
    RequestType: 1, // FullCancellation
    BookingId: Number(params.bookingId),
  };
  const res = await api.getCancellationCharges(req);
  if (res.Response?.ResponseStatus !== 1) {
    throw new Error(`GetCancellationCharges failed: ${res.Response?.Error?.ErrorMessage || res.Response?.ResponseStatus}`);
  }
  return {
    refundAmount: res.Response.RefundAmount,
    cancellationCharge: res.Response.CancellationCharge,
    currency: res.Response.Currency,
    remarks: res.Response.Remarks,
  };
}

export async function cancelFlight(params: {
  bookingId: string;
  remarks?: string;
  EndUserIp?: string;
}): Promise<{
  changeRequestId: number;
  status: number;
  remarks: string;
}> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const req: TBOFlightSendChangeRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: tokenId,
    BookingId: Number(params.bookingId),
    RequestType: 1, // FullCancellation
    CancellationType: 3, // Others
    Remarks: params.remarks || "Customer requested cancellation",
  };
  console.log("[TBO-FLIGHT-CANCEL] Request:", JSON.stringify(req));
  const res = await api.sendChangeRequest(req);
  console.log("[TBO-FLIGHT-CANCEL] Response:", JSON.stringify(res));
  
  // Check for various response formats
  if (!res) {
    throw new Error("Flight cancel failed: Empty response from TBO");
  }
  
  if (res.Response?.ResponseStatus !== 1) {
    const errorMsg = res.Response?.Error?.ErrorMessage || 
                     res.Response?.TicketCRInfo?.Remarks ||
                     res.Response?.ResponseStatus ||
                     "Unknown error";
    throw new Error(`Flight cancel failed: ${errorMsg}`);
  }
  
  return {
    changeRequestId: res.Response.TicketCRInfo?.ChangeRequestId || 0,
    status: res.Response.TicketCRInfo?.Status || 0,
    remarks: res.Response.TicketCRInfo?.Remarks || "",
  };
}

export async function getCancelStatus(params: {
  changeRequestId: number;
  EndUserIp?: string;
}): Promise<{
  status: number;
  remarks: string;
}> {
  await validateCredentials();
  const tokenId = await ensureToken();
  const req: TBOFlightGetChangeRequestStatusRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: tokenId,
    ChangeRequestId: params.changeRequestId,
  };
  const res = await api.getChangeRequestStatus(req);
  if (res.Response?.ResponseStatus !== 1) {
    throw new Error(`GetChangeRequestStatus failed: ${res.Response?.Error?.ErrorMessage || res.Response?.ResponseStatus}`);
  }
  return {
    status: res.Response.Status,
    remarks: res.Response.Remarks,
  };
}
