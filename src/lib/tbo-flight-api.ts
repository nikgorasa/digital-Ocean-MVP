import type {
  TBOFlightAuthRequest,
  TBOFlightAuthResponse,
  TBOFlightSearchRequest,
  TBOFlightSearchResponse,
  TBOFlightFareRuleRequest,
  TBOFlightFareRuleResponse,
  TBOFlightFareQuoteRequest,
  TBOFlightFareQuoteResponse,
  TBOFlightSSRRequest,
  TBOFlightSSRResponse,
  TBOFlightBookRequest,
  TBOFlightBookResponse,
  TBOFlightTicketNonLCCRequest,
  TBOFlightTicketLCCRequest,
  TBOFlightTicketResponse,
  TBOFlightBookingDetailRequest,
  TBOFlightBookingDetailResponse,
} from "./tbo-flight-types";
import { logApiCall } from "./api-logger";

const AUTH_URL = "http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
const API_BASE = "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest";

async function post<T>(url: string, body: unknown): Promise<T> {
  const start = Date.now();
  const endpointShort = url.split('/').pop() || url;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseTime = Date.now() - start;
  console.log(`[TBO-API] ${endpointShort}: ${responseTime}ms (HTTP ${res.status})`);

  if (!res.ok) {
    logApiCall({
      provider: 'tbo_flight',
      endpoint: url.replace(API_BASE, '').replace(AUTH_URL, '/Authenticate'),
      method: 'POST',
      requestBody: body,
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
    });
    throw new Error(`TBO HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  logApiCall({
    provider: 'tbo_flight',
    endpoint: url.replace(API_BASE, '').replace(AUTH_URL, '/Authenticate'),
    method: 'POST',
    requestBody: body,
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
  });

  return data as T;
}

export function authenticate(req: TBOFlightAuthRequest): Promise<TBOFlightAuthResponse> {
  return post<TBOFlightAuthResponse>(AUTH_URL, req);
}

export function searchFlights(tokenId: string, req: Omit<TBOFlightSearchRequest, "TokenId">): Promise<TBOFlightSearchResponse> {
  return post<TBOFlightSearchResponse>(`${API_BASE}/Search`, { ...req, TokenId: tokenId });
}

export function getFareRule(req: TBOFlightFareRuleRequest): Promise<TBOFlightFareRuleResponse> {
  return post<TBOFlightFareRuleResponse>(`${API_BASE}/FareRule`, req);
}

export function getFareQuote(req: TBOFlightFareQuoteRequest): Promise<TBOFlightFareQuoteResponse> {
  return post<TBOFlightFareQuoteResponse>(`${API_BASE}/FareQuote`, req);
}

export function getSSR(req: TBOFlightSSRRequest): Promise<TBOFlightSSRResponse> {
  return post<TBOFlightSSRResponse>(`${API_BASE}/SSR`, req);
}

export function bookFlight(req: TBOFlightBookRequest): Promise<TBOFlightBookResponse> {
  return post<TBOFlightBookResponse>(`${API_BASE}/Book`, req);
}

export function ticketFlight(req: TBOFlightTicketNonLCCRequest | TBOFlightTicketLCCRequest): Promise<TBOFlightTicketResponse> {
  return post<TBOFlightTicketResponse>(`${API_BASE}/Ticket`, req);
}

export function getBookingDetail(req: TBOFlightBookingDetailRequest): Promise<TBOFlightBookingDetailResponse> {
  return post<TBOFlightBookingDetailResponse>(`${API_BASE}/GetBookingDetail`, req);
}
