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
  TBOBookingResult,
  TBOFlightTicketOutput,
} from "./tbo-flight-types";
import * as api from "./tbo-flight-api";
import * as mock from "./tbo-flight-mock";
import { calculatePrice } from "./pricing";

const hasCredentials = !!(process.env.TBO_USERNAME && process.env.TBO_PASSWORD)
  && process.env.TBO_FLIGHT_FORCE_MOCK !== "true";

const CLIENT_ID = process.env.TBO_CLIENT_ID || "ApiIntegrationNew";

let cachedToken: { tokenId: string; date: string } | null = null;

function getEndUserIp(): string {
  return "192.168.1.1";
}

async function ensureToken(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedToken?.date === today) {
    return cachedToken.tokenId;
  }
  const req: TBOFlightAuthRequest = {
    ClientId: CLIENT_ID,
    UserName: process.env.TBO_USERNAME || "",
    Password: process.env.TBO_PASSWORD || "",
    EndUserIp: getEndUserIp(),
  };
  const res = await api.authenticate(req);
  if (res.Status !== 1) {
    throw new Error(`TBO auth failed: Status=${res.Status} ${res.Error?.ErrorMessage || ""}`);
  }
  cachedToken = { tokenId: res.TokenId, date: today };
  return res.TokenId;
}

async function toDisplay(
  r: TBOFlightResult,
  leg: "outbound" | "inbound" | "oneway",
): Promise<TBOFlightDisplay> {
  return {
    resultIndex: r.ResultIndex,
    leg,
    isLCC: r.IsLCC,
    isRefundable: r.IsRefundable,
    isDomestic: r.Segments[0]?.TripIndicator === 1,
    source: r.Source,
    airline: r.Segments[0]?.Airline ?? "",
    airlineCode: r.Segments[0]?.AirlineCode ?? "",
    flightNumber: r.Segments[0]?.FlightNumber ?? "",
    operatingCarrier: r.Segments[0]?.OperatingCarrier ?? "",
    origin: r.Segments[0]?.Origin ?? "",
    destination: r.Segments[0]?.Destination ?? "",
    departureTime: r.Segments[0]?.DepTime ?? "",
    arrivalTime: r.Segments[0]?.ArrTime ?? "",
    duration: r.Segments[0]?.Duration ?? "",
    cabinClass: r.Segments[0]?.CabinClass ?? "",
    baggage: r.Segments[0]?.Baggage ?? "",
    cabinBaggage: r.Segments[0]?.CabinBaggage ?? "",
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
  EndUserIp?: string;
  forceMock?: boolean;
}): Promise<TBOFlightSearchOutput> {
  if (!params.forceMock && hasCredentials) {
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
            FlightCabinClass: 1,
            PreferredDepartureTime: params.PreferredDepartureTime || "",
            PreferredArrivalTime: "",
          },
        ],
      };
          const res = await api.searchFlights(tokenId, searchReq);
      if (res.Response?.ResponseStatus === 1) {
        const flights = await Promise.all(
          res.Response.Results.map(async (r) => {
            const isReturn = params.JourneyType === 2 || params.JourneyType === 5;
            const tripInd = r.Segments[0]?.TripIndicator ?? 1;
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
  const flights = await Promise.all(
    mockRes.Response.Results.map(async (r) => {
      const isReturn = params.JourneyType === 2 || params.JourneyType === 5;
      const tripInd = r.Segments[0]?.TripIndicator ?? 1;
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
  if (hasCredentials) {
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
  if (hasCredentials) {
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
        const r = res.Response.Results[0];
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
  const r = mockRes.Response.Results[0];
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
  if (hasCredentials) {
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
          baggage: res.Response.SSR.Baggage,
          meals: res.Response.SSR.MealDynamic,
          seats: res.Response.SSR.SeatDynamic,
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
    baggage: mockRes.Response.SSR.Baggage,
    meals: mockRes.Response.SSR.MealDynamic,
    seats: mockRes.Response.SSR.SeatDynamic,
    traceId: mockRes.Response.TraceId,
  };
}

export async function bookFlight(params: {
  traceId: string;
  resultIndex: string;
  passengers: TBOFlightBookRequest["Passengers"];
  EndUserIp?: string;
}): Promise<{ bookingId: string; pnr: string; isPriceChanged: boolean }> {
  if (hasCredentials) {
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
  if (hasCredentials) {
    try {
      const tokenId = await ensureToken();
      if (params.isLCC) {
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
          })),
        };
        const res = await api.ticketFlight(req);
        if (res.Response?.ResponseStatus === 1) {
          return { results: [{ bookingId: res.Response.BookingId, pnr: res.Response.PNR }] };
        }
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
          return { results: [{ bookingId: res.Response.BookingId, pnr: res.Response.PNR }] };
        }
      }
      throw new Error("Ticket failed");
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
  return { results: [{ bookingId: res.Response.BookingId, pnr: res.Response.PNR }] };
}

export async function getBookingDetail(params: {
  bookingIds: string[];
  EndUserIp?: string;
}): Promise<any[]> {
  if (hasCredentials) {
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
