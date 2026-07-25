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
  TBOFlightGetCancellationChargesRequest,
  TBOFlightGetCancellationChargesResponse,
  TBOFlightSendChangeRequest,
  TBOFlightSendChangeResponse,
  TBOFlightGetChangeRequestStatusRequest,
  TBOFlightGetChangeRequestStatusResponse,
  TBOFlightReleasePNRRequest,
  TBOFlightReleasePNRResponse,
} from "./tbo-flight-types";
import { logApiCall } from "./api-logger";
import { fetchWithRetry } from "./fetch-with-retry";
import { readConfig } from "./config-service";

async function getAuthUrl(): Promise<string> {
  const cfg = await readConfig("tbo_flight");
  return cfg.baseUrl || "http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
}

async function getApiBase(): Promise<string> {
  const cfg = await readConfig("tbo_flight");
  return cfg.bookingUrl || "http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest";
}

async function post<T>(url: string, body: unknown, maxRetries = 1): Promise<T> {
  const start = Date.now();
  const endpointShort = url.split('/').pop() || url;

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, maxRetries, 1000);

  const responseTime = Date.now() - start;
  console.log(`[TBO-API] ${endpointShort}: ${responseTime}ms (HTTP ${res.status})`);

  if (!res.ok) {
    logApiCall({
      provider: 'tbo_flight',
      endpoint: url,
      method: 'POST',
      requestBody: body,
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
    });
    throw new Error(`TBO HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (endpointShort === 'Book' || endpointShort === 'Ticket') {
    console.log(`[TBO-API] ${endpointShort} raw response:`, JSON.stringify(data).slice(0, 4000));
  }
  logApiCall({
    provider: 'tbo_flight',
    endpoint: url,
    method: 'POST',
    requestBody: body,
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
  });

  return data as T;
}

export async function authenticate(req: TBOFlightAuthRequest): Promise<TBOFlightAuthResponse> {
  const url = await getAuthUrl();
  return post<TBOFlightAuthResponse>(url, req);
}

export async function searchFlights(tokenId: string, req: Omit<TBOFlightSearchRequest, "TokenId">): Promise<TBOFlightSearchResponse> {
  const base = await getApiBase();
  return post<TBOFlightSearchResponse>(`${base}/Search`, { ...req, TokenId: tokenId });
}

export async function getFareRule(req: TBOFlightFareRuleRequest): Promise<TBOFlightFareRuleResponse> {
  const base = await getApiBase();
  return post<TBOFlightFareRuleResponse>(`${base}/FareRule`, req);
}

export async function getFareQuote(req: TBOFlightFareQuoteRequest): Promise<TBOFlightFareQuoteResponse> {
  const base = await getApiBase();
  return post<TBOFlightFareQuoteResponse>(`${base}/FareQuote`, req);
}

export async function getSSR(req: TBOFlightSSRRequest): Promise<TBOFlightSSRResponse> {
  const base = await getApiBase();
  return post<TBOFlightSSRResponse>(`${base}/SSR`, req, 2);
}

export async function bookFlight(req: TBOFlightBookRequest): Promise<TBOFlightBookResponse> {
  const base = await getApiBase();
  return post<TBOFlightBookResponse>(`${base}/Book`, req, 2);
}

export async function ticketFlight(req: TBOFlightTicketNonLCCRequest | TBOFlightTicketLCCRequest): Promise<TBOFlightTicketResponse> {
  const base = await getApiBase();
  return post<TBOFlightTicketResponse>(`${base}/Ticket`, req, 2);
}

export async function getBookingDetail(req: TBOFlightBookingDetailRequest): Promise<TBOFlightBookingDetailResponse> {
  const base = await getApiBase();
  return post<TBOFlightBookingDetailResponse>(`${base}/GetBookingDetail`, req);
}

// Flight Cancellation APIs

export async function getCancellationCharges(req: TBOFlightGetCancellationChargesRequest): Promise<TBOFlightGetCancellationChargesResponse> {
  const base = await getApiBase();
  return post<TBOFlightGetCancellationChargesResponse>(`${base}/GetCancellationCharges`, req);
}

export async function sendChangeRequest(req: TBOFlightSendChangeRequest): Promise<TBOFlightSendChangeResponse> {
  const base = await getApiBase();
  return post<TBOFlightSendChangeResponse>(`${base}/SendChangeRequest`, req);
}

export async function getChangeRequestStatus(req: TBOFlightGetChangeRequestStatusRequest): Promise<TBOFlightGetChangeRequestStatusResponse> {
  const base = await getApiBase();
  return post<TBOFlightGetChangeRequestStatusResponse>(`${base}/GetChangeRequestStatus`, req);
}

export async function releasePNR(req: TBOFlightReleasePNRRequest): Promise<TBOFlightReleasePNRResponse> {
  const base = await getApiBase();
  return post<TBOFlightReleasePNRResponse>(`${base}/ReleasePNRRequest`, req);
}