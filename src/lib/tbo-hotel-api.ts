import type {
  TBOHotelAuthRequest,
  TBOHotelAuthResponse,
  TBOHotelSearchRequest,
  TBOHotelSearchResponse,
  TBOHotelPreBookRequest,
  TBOHotelPreBookResponse,
  TBOHotelBookRequest,
  TBOHotelBookResponse,
  TBOHotelBookingDetailRequest,
  TBOHotelBookingDetailResponse,
  TBOHotelCountry,
  TBOHotelCity,
  TBOHotelCodeItem,
  TBOHotelDetail,
  TBOStatus,
  TBOHotelGenerateVoucherRequest,
  TBOHotelGenerateVoucherResponse,
  TBOHotelSendChangeRequest,
  TBOHotelSendChangeResponse,
  TBOHotelGetChangeRequestStatusRequest,
  TBOHotelGetChangeRequestStatusResponse,
} from "./tbo-hotel-types";
import { logApiCall } from "./api-logger";
import { readConfig } from "./config-service";

const AUTH_URL = "http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";

interface ApiContext {
  baseUrl: string;
  authHeader: { Authorization?: string };
}

async function getStaticContext(): Promise<ApiContext> {
  const cfg = await readConfig("tbo_hotel_static");
  const baseUrl = cfg.staticUrl || "http://api.tbotechnology.in/TBOHolidays_HotelAPI";
  const username = cfg.staticUsername || "TBOStaticAPITest";
  const password = cfg.staticPassword || "Tbo@11530818";
  const hasAuth = !!(username && password);
  const authHeader = hasAuth
    ? { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` }
    : {};
  return { baseUrl, authHeader };
}

 async function getSearchContext(): Promise<ApiContext> {
  const cfg = await readConfig("tbo_hotel");
  const baseUrl = cfg.baseUrl || "https://affiliate.tektravels.com/HotelAPI";
  const username = cfg.username || "";
  const password = cfg.password || "";
  const hasAuth = !!(username && password);
  const authHeader = hasAuth
    ? { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` }
    : {};
  return { baseUrl, authHeader };
}

async function getBookingActionContext(): Promise<ApiContext> {
  const cfg = await readConfig("tbo_hotel");
  const bookingUrl = cfg.bookingUrl || "https://HotelBE.tektravels.com/hotelservice.svc/rest";
  const username = cfg.username || "";
  const password = cfg.password || "";
  const hasAuth = !!(username && password);
  const authHeader = hasAuth
    ? { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` }
    : {};
  return { baseUrl: bookingUrl, authHeader };
}

interface LogOptions {
  requestId?: string;
  batchIndex?: number;
  batchTotal?: number;
}

async function staticJsonPost<T>(url: string, body: unknown, ctx: ApiContext, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ctx.authHeader },
    body: JSON.stringify(body),
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    logApiCall({
      provider: 'tbo_hotel_static',
      endpoint: url.replace(ctx.baseUrl, ''),
      method: 'POST',
      requestBody: body,
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      requestId: logOpts?.requestId,
      batchIndex: logOpts?.batchIndex,
      batchTotal: logOpts?.batchTotal,
    });
    throw new Error(`TBO Hotel Static HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  logApiCall({
    provider: 'tbo_hotel_static',
    endpoint: url.replace(ctx.baseUrl, ''),
    method: 'POST',
    requestBody: body,
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
    requestId: logOpts?.requestId,
    batchIndex: logOpts?.batchIndex,
    batchTotal: logOpts?.batchTotal,
  });
  return data as T;
}

async function staticGet<T>(url: string, ctx: ApiContext, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...ctx.authHeader },
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    logApiCall({
      provider: 'tbo_hotel_static',
      endpoint: url.replace(ctx.baseUrl, ''),
      method: 'GET',
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      requestId: logOpts?.requestId,
    });
    throw new Error(`TBO Hotel Static GET ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  logApiCall({
    provider: 'tbo_hotel_static',
    endpoint: url.replace(ctx.baseUrl, ''),
    method: 'GET',
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
    requestId: logOpts?.requestId,
  });
  return data as T;
}

async function searchPost<T>(url: string, body: unknown, ctx: ApiContext, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ctx.authHeader },
    body: JSON.stringify(body),
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    logApiCall({
      provider: 'tbo_hotel_search',
      endpoint: url.replace(ctx.baseUrl, ''),
      method: 'POST',
      requestBody: body,
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      requestId: logOpts?.requestId,
    });
    throw new Error(`TBO Hotel Search HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  logApiCall({
    provider: 'tbo_hotel_search',
    endpoint: url.replace(ctx.baseUrl, ''),
    method: 'POST',
    requestBody: body,
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
    requestId: logOpts?.requestId,
  });
  return data as T;
}

async function bookingPost<T>(url: string, body: unknown, ctx: ApiContext, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ctx.authHeader },
    body: JSON.stringify(body),
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    logApiCall({
      provider: 'tbo_hotel_booking',
      endpoint: url.replace(ctx.baseUrl, ''),
      method: 'POST',
      requestBody: body,
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      requestId: logOpts?.requestId,
    });
    throw new Error(`TBO Hotel Booking HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  logApiCall({
    provider: 'tbo_hotel_booking',
    endpoint: url.replace(ctx.baseUrl, ''),
    method: 'POST',
    requestBody: body,
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
    requestId: logOpts?.requestId,
  });
  return data as T;
}

export function authenticate(req: TBOHotelAuthRequest): Promise<TBOHotelAuthResponse> {
  const start = Date.now();
  return fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  }).then(async (res) => {
    const responseTime = Date.now() - start;
    if (!res.ok) {
      logApiCall({
        provider: 'tbo_hotel',
        endpoint: '/Authenticate',
        method: 'POST',
        requestBody: req,
        statusCode: res.status,
        responseTimeMs: responseTime,
        errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      });
      throw new Error(`TBO Hotel Auth HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    logApiCall({
      provider: 'tbo_hotel',
      endpoint: '/Authenticate',
      method: 'POST',
      requestBody: req,
      responseBody: data,
      statusCode: res.status,
      responseTimeMs: responseTime,
    });
    return data as TBOHotelAuthResponse;
  });
}

export async function getCountries(): Promise<{ CountryList: TBOHotelCountry[] }> {
  const ctx = await getStaticContext();
  return staticGet<{ CountryList: TBOHotelCountry[] }>(`${ctx.baseUrl}/CountryList`, ctx);
}

export async function getCities(countryCode: string): Promise<{ CityList?: TBOHotelCity[] }> {
  const ctx = await getStaticContext();
  return staticJsonPost<{ CityList?: TBOHotelCity[] }>(`${ctx.baseUrl}/CityList`, { CountryCode: countryCode }, ctx);
}

export async function getHotelCodeList(cityCode: string, logOpts?: LogOptions): Promise<{ Status: TBOStatus; Hotels: TBOHotelCodeItem[] }> {
  const ctx = await getStaticContext();
  return staticJsonPost<{ Status: TBOStatus; Hotels: TBOHotelCodeItem[] }>(`${ctx.baseUrl}/TBOHotelCodeList`, { CityCode: cityCode }, ctx, logOpts);
}

export async function getHotelDetails(hotelCodes: string, logOpts?: LogOptions): Promise<{ Status: { Code: number; Description: string }; HotelDetails: TBOHotelDetail[] }> {
  const ctx = await getStaticContext();
  return staticJsonPost<{ Status: { Code: number; Description: string }; HotelDetails: TBOHotelDetail[] }>(`${ctx.baseUrl}/HotelDetails`, { HotelCodes: hotelCodes }, ctx, logOpts);
}

export async function searchHotels(req: TBOHotelSearchRequest, logOpts?: LogOptions): Promise<TBOHotelSearchResponse> {
  const ctx = await getSearchContext();
  return searchPost<TBOHotelSearchResponse>(`${ctx.baseUrl}/Search`, req, ctx, logOpts);
}

export async function preBook(req: TBOHotelPreBookRequest): Promise<TBOHotelPreBookResponse> {
  const ctx = await getSearchContext();
  return searchPost<TBOHotelPreBookResponse>(`${ctx.baseUrl}/PreBook`, req, ctx);
}

export async function bookHotel(req: TBOHotelBookRequest): Promise<TBOHotelBookResponse> {
  const ctx = await getBookingActionContext();
  return bookingPost<TBOHotelBookResponse>(`${ctx.baseUrl}/book/`, req, ctx);
}

export async function getBookingDetail(req: TBOHotelBookingDetailRequest): Promise<TBOHotelBookingDetailResponse> {
  const ctx = await getBookingActionContext();
  return bookingPost<TBOHotelBookingDetailResponse>(`${ctx.baseUrl}/Getbookingdetail/`, req, ctx);
}

export async function generateVoucher(req: TBOHotelGenerateVoucherRequest & { TokenId?: string }): Promise<TBOHotelGenerateVoucherResponse> {
  const ctx = await getBookingActionContext();
  return bookingPost<TBOHotelGenerateVoucherResponse>(`${ctx.baseUrl}/GenerateVoucher/`, req, ctx);
}

export async function sendChangeRequest(req: TBOHotelSendChangeRequest): Promise<TBOHotelSendChangeResponse> {
  const ctx = await getBookingActionContext();
  return bookingPost<TBOHotelSendChangeResponse>(`${ctx.baseUrl}/SendChangeRequest/`, req, ctx);
}

export async function getChangeRequestStatus(req: TBOHotelGetChangeRequestStatusRequest): Promise<TBOHotelGetChangeRequestStatusResponse> {
  const ctx = await getBookingActionContext();
  return bookingPost<TBOHotelGetChangeRequestStatusResponse>(`${ctx.baseUrl}/GetChangeRequestStatus/`, req, ctx);
}
