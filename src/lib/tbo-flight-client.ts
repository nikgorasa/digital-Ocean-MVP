import type {
  TBOFlightAuthRequest,
  TBOFlightSearchRequest,
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
  TBOBookingResult,
  TBOFlightTicketOutput,
} from "./tbo-flight-types";
import * as api from "./tbo-flight-api";
import * as mock from "./tbo-flight-mock";
import { calculatePrice } from "./pricing";
import { readConfig } from "./config-service";

let cachedToken: { tokenId: string; date: string } | null = null;

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

async function checkCredentials(): Promise<boolean> {
  const cfg = await readConfig("tbo_flight");
  const username = cfg.username || process.env.TBO_USERNAME || "";
  const password = cfg.password || process.env.TBO_PASSWORD || "";
  return !!(username && password) && !cfg.forceMock;
}

async function ensureToken(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedToken?.date === today) {
    return cachedToken.tokenId;
  }
  const clientId = await getClientId();
  const username = (await readConfig("tbo_flight")).username || process.env.TBO_USERNAME || "";
  const password = (await readConfig("tbo_flight")).password || process.env.TBO_PASSWORD || "";

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
): Promise<TBOFlightDisplay> {
  const f = firstSeg(r);
  const l = lastSeg(r);
  return {
    resultIndex: r.ResultIndex,
    leg,
    isLCC: r.IsLCC,
    isRefundable: r.IsRefundable,
    isDomestic: f?.TripIndicator === 1,
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
    fareInclusions: r.FareInclusions,
    fareClassification: r.FareClassification,
    isExclusiveFare: r.IsExclusiveFare,
    isFreeMealAvailable: r.IsFreeMealAvailable,
    isHoldAllowedWithSSR: r.IsHoldAllowedWithSSR,
    isUpsellAllowed: r.IsUpsellAllowed,
    gstAllowed: r.GSTAllowed,
    isGSTMandatory: r.IsGSTMandatory,
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
  CabinClass?: string;
  EndUserIp?: string;
  forceMock?: boolean;
}): Promise<TBOFlightSearchOutput> {
  const cabinClassMap: Record<string, number> = {
    "economy": 1,
    "premium economy": 2,
    "business": 3,
    "premium business": 4,
    "first": 5,
    "all": 0,
  };
  const cabinClassNum = cabinClassMap[(params.CabinClass || "economy").toLowerCase()] ?? 1;

  if (!params.forceMock && await checkCredentials()) {
    try {
      const tokenId = await ensureToken();
      const searchReq: TBOFlightSearchRequest = {
        EndUserIp: params.EndUserIp || getEndUserIp(),
        TokenId: tokenId,
        AdultCount: params.AdultCount,
        ChildCount: params.ChildCount,
        InfantCount: params.InfantCount,
        JourneyType: params.JourneyType,
        Segments: [
          {
            Origin: params.Origin,
            Destination: params.Destination,
            FlightCabinClass: cabinClassNum,
            PreferredDepartureTime: params.PreferredDepartureTime || "",
            PreferredArrivalTime: "",
          },
        ],
      };
          const res = await api.searchFlights(tokenId, searchReq);
      if (res.Response?.ResponseStatus === 1) {
        const results = res.Response.Results;
        const flightList: TBOFlightResult[] = Array.isArray(results[0])
          ? (results[0] as TBOFlightResult[])
          : (results as unknown as TBOFlightResult[]);
        const flights = await Promise.all(
          flightList.map(async (r) => {
            const isReturn = params.JourneyType === 2 || params.JourneyType === 5;
            const tripInd = r.Segments?.[0]?.[0]?.TripIndicator ?? 1;
            let leg: "outbound" | "inbound" | "oneway";
            if (!isReturn) leg = "oneway";
            else if (tripInd === 1) leg = "outbound";
            else leg = "inbound";
            return toDisplay(r, leg);
          })
        );
        return { flights, traceId: res.Response.TraceId };
      }
      throw new Error(`TBO search failed: ${res.Response?.ResponseStatus}`);
    } catch (e) {
      console.warn("TBO flight API search failed, fallback to mock:", e);
    }
  }
  const mockRes = mock.mockSearchFlights({
    Origin: params.Origin,
    Destination: params.Destination,
    AdultCount: params.AdultCount,
    ChildCount: params.ChildCount,
    InfantCount: params.InfantCount,
    JourneyType: params.JourneyType,
    PreferredDepartureTime: params.PreferredDepartureTime,
  });
  const mockResults = mockRes.Response.Results;
  const mockFlightList: TBOFlightResult[] = Array.isArray(mockResults[0])
    ? (mockResults[0] as TBOFlightResult[])
    : (mockResults as unknown as TBOFlightResult[]);
  const flights = await Promise.all(
    mockFlightList.map(async (r) => {
      const isReturn = params.JourneyType === 2 || params.JourneyType === 5;
      const tripInd = r.Segments?.[0]?.[0]?.TripIndicator ?? 1;
      let leg: "outbound" | "inbound" | "oneway";
      if (!isReturn) leg = "oneway";
      else if (tripInd === 1) leg = "outbound";
      else leg = "inbound";
      return toDisplay(r, leg);
    })
  );
  return { flights, traceId: mockRes.Response.TraceId };
}

let _lastResults: TBOFlightResult[] = [];

export function setLastResults(results: TBOFlightResult[]): void {
  _lastResults = results;
}

export async function getFareRule(params: {
  traceId: string;
  resultIndex: string;
  EndUserIp?: string;
}): Promise<{ traceId: string; fareRules: any[] }> {
  if (await checkCredentials()) {
    try {
      const tokenId = await ensureToken();
      const req: TBOFlightFareRuleRequest = {
        EndUserIp: params.EndUserIp || getEndUserIp(),
        TokenId: tokenId,
        TraceId: params.traceId,
        ResultIndex: params.resultIndex,
      };
      const res = await api.getFareRule(req);
      if (res.Response?.ResponseStatus === 1) {
        return { traceId: res.Response.TraceId, fareRules: res.Response.FareRules };
      }
      throw new Error(`FareRule failed: ${res.Response?.ResponseStatus}`);
    } catch (e) {
      console.warn("TBO fare rule failed, fallback to mock:", e);
    }
  }
  const mockRes = mock.mockFareRule(params.traceId, params.resultIndex);
  return { traceId: mockRes.Response.TraceId, fareRules: mockRes.Response.FareRules };
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
  if (await checkCredentials()) {
    try {
      const tokenId = await ensureToken();
      const req: TBOFlightFareQuoteRequest = {
        EndUserIp: params.EndUserIp || getEndUserIp(),
        TokenId: tokenId,
        TraceId: params.traceId,
        ResultIndex: params.resultIndex,
      };
      const res = await api.getFareQuote(req);
      if (res.Response?.ResponseStatus === 1) {
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
      throw new Error(`FareQuote failed: ${res.Response?.ResponseStatus}`);
    } catch (e) {
      console.warn("TBO fare quote failed, fallback to mock:", e);
    }
  }
  const mockRes = mock.mockFareQuote(params.traceId, params.resultIndex, _lastResults);
  const r = Array.isArray(mockRes.Response.Results)
    ? mockRes.Response.Results[0]
    : mockRes.Response.Results;
  return {
    isPriceChanged: mockRes.Response.IsPriceChanged,
    traceId: mockRes.Response.TraceId,
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
  if (await checkCredentials()) {
    try {
      const tokenId = await ensureToken();
      const req: TBOFlightSSRRequest = {
        EndUserIp: params.EndUserIp || getEndUserIp(),
        TokenId: tokenId,
        TraceId: params.traceId,
        ResultIndex: params.resultIndex,
      };
      const res = await api.getSSR(req);
      if (res.Response?.ResponseStatus === 1) {
        return {
          isLCC: res.Response.IsLCC,
          baggage: res.Response.Baggage,
          meals: res.Response.MealDynamic,
          seats: res.Response.SeatDynamic,
          traceId: res.Response.TraceId,
        };
      }
      throw new Error(`SSR failed: ${res.Response?.ResponseStatus}`);
    } catch (e) {
      console.warn("TBO SSR failed, fallback to mock:", e);
    }
  }
  const mockRes = mock.mockSSR(params.traceId, params.resultIndex, _lastResults);
  return {
    isLCC: mockRes.Response.IsLCC,
    baggage: mockRes.Response.Baggage,
    meals: mockRes.Response.MealDynamic,
    seats: mockRes.Response.SeatDynamic,
    traceId: mockRes.Response.TraceId,
  };
}

export async function bookFlight(params: {
  traceId: string;
  resultIndex: string;
  passengers: TBOFlightBookRequest["Passengers"];
  EndUserIp?: string;
}): Promise<{ bookingId: string; pnr: string; isPriceChanged: boolean }> {
  if (await checkCredentials()) {
    try {
      const tokenId = await ensureToken();
      const req: TBOFlightBookRequest = {
        EndUserIp: params.EndUserIp || getEndUserIp(),
        TokenId: tokenId,
        TraceId: params.traceId,
        ResultIndex: params.resultIndex,
        Passengers: params.passengers,
      };
      const res = await api.bookFlight(req);
      if (res.Response?.ResponseStatus === 1) {
        return {
          bookingId: res.Response.FlightItinerary.BookingId,
          pnr: res.Response.FlightItinerary.PNR,
          isPriceChanged: res.Response.IsPriceChanged,
        };
      }
      throw new Error(`Book failed: ${res.Response?.ResponseStatus}`);
    } catch (e) {
      console.warn("TBO book failed, fallback to mock:", e);
    }
  }
  const mockReq: TBOFlightBookRequest = {
    EndUserIp: params.EndUserIp || getEndUserIp(),
    TokenId: "",
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
    Passengers: params.passengers,
  };
  const res = mock.mockBook(mockReq);
  return {
    bookingId: res.Response.FlightItinerary.BookingId,
    pnr: res.Response.FlightItinerary.PNR,
    isPriceChanged: res.Response.IsPriceChanged,
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
  if (await checkCredentials()) {
    try {
      const tokenId = await ensureToken();
      if (params.isLCC) {
        // Fetch SSR data to get meal and baggage options
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
            CountryCode: p.CountryCode ?? "IN",
            CountryName: p.CountryName ?? "India",
            ContactNo: p.ContactNo ?? "",
            Email: p.Email ?? "",
            IsLeadPax: p.IsLeadPax ?? false,
            Nationality: p.Nationality ?? "IN",
            Fare: p.Fare ?? { BaseFare: 0, Tax: 0, TransactionFee: 0, YQTax: 0, AdditionalTxnFeeOfrd: 0, AdditionalTxnFeePub: 0, AirTransFee: 0 },
            ...(noBag ? { Baggage: [noBag] } : {}),
            ...(noMeal ? { MealDynamic: [noMeal] } : {}),
          })),
        };
        const res = await api.ticketFlight(req);
        if (res.Response?.ResponseStatus === 1) {
          const r = res.Response.Response;
          return { results: [{ bookingId: r?.BookingId, pnr: r?.PNR }] };
        }
        throw new Error(`Ticket failed: ${res.Response?.ResponseStatus} ${JSON.stringify(res.Response?.Error)}`);
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
        if (res.Response?.ResponseStatus === 1) {
          const r = res.Response.Response;
          return { results: [{ bookingId: r?.BookingId, pnr: r?.PNR }] };
        }
        throw new Error(`Non-LCC Ticket failed: ${res.Response?.ResponseStatus} ${JSON.stringify(res.Response?.Error)}`);
      }
      throw new Error("Ticket failed: unknown path");
    } catch (e) {
      console.warn("TBO ticket failed, fallback to mock:", e);
    }
  }
  const res = mock.mockTicket({
    PNR: params.PNR,
    BookingId: params.BookingId,
    isLCC: params.isLCC,
    passengers: params.passengers,
    segments: params.segments,
    fare: params.fare,
    fareBreakdown: params.fareBreakdown,
  });
  const r = res.Response.Response;
  return { results: [{ bookingId: r?.BookingId, pnr: r?.PNR }] };
}

export async function getBookingDetail(params: {
  bookingIds: string[];
  EndUserIp?: string;
}): Promise<any[]> {
  if (await checkCredentials()) {
    try {
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
    } catch (e) {
      console.warn("TBO booking detail failed, fallback to mock:", e);
    }
  }
  return params.bookingIds.map(bid => {
    const res = mock.mockBookingDetail({ BookingId: bid });
    return res.Response.FlightItinerary;
  });
}

export function forcePriceChange(resultIndex: string): void {
  mock.setPriceChanged(resultIndex);
}

export function resetClient(): void {
  mock.resetMock();
  cachedToken = null;
  _lastResults = [];
}
