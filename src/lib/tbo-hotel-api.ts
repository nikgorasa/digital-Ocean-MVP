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

const AUTH_URL = "http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
const STATIC_DATA_BASE = process.env.TBO_STATIC_ENDPOINT || "http://api.tbotechnology.in/TBOHolidays_HotelAPI";
const SEARCH_BASE = process.env.TBO_ENDPOINT || "https://affiliate.tektravels.com/HotelAPI";
const BOOKING_BASE = process.env.TBO_BOOKING_ENDPOINT || "https://HotelBE.tektravels.com/hotelservice.svc/rest";

const HOTEL_USERNAME = process.env.TBO_HOTEL_USERNAME || "";
const HOTEL_PASSWORD = process.env.TBO_HOTEL_PASSWORD || "";
const HAS_BASIC_AUTH = !!(HOTEL_USERNAME && HOTEL_PASSWORD);
const AUTH_HEADER: Record<string, string> = HAS_BASIC_AUTH
  ? { Authorization: `Basic ${btoa(`${HOTEL_USERNAME}:${HOTEL_PASSWORD}`)}` }
  : {};

interface LogOptions {
  requestId?: string;
  batchIndex?: number;
  batchTotal?: number;
}

async function staticJsonPost<T>(url: string, body: unknown, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...AUTH_HEADER },
    body: JSON.stringify(body),
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    await logApiCall({
      provider: 'tbo_hotel_static',
      endpoint: url.replace(STATIC_DATA_BASE, ''),
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
  await logApiCall({
    provider: 'tbo_hotel_static',
    endpoint: url.replace(STATIC_DATA_BASE, ''),
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

async function staticGet<T>(url: string, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...AUTH_HEADER },
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    await logApiCall({
      provider: 'tbo_hotel_static',
      endpoint: url.replace(STATIC_DATA_BASE, ''),
      method: 'GET',
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      requestId: logOpts?.requestId,
    });
    throw new Error(`TBO Hotel Static GET ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  await logApiCall({
    provider: 'tbo_hotel_static',
    endpoint: url.replace(STATIC_DATA_BASE, ''),
    method: 'GET',
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
    requestId: logOpts?.requestId,
  });
  return data as T;
}

async function searchPost<T>(url: string, body: unknown, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    await logApiCall({
      provider: 'tbo_hotel_search',
      endpoint: url.replace(SEARCH_BASE, ''),
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
  await logApiCall({
    provider: 'tbo_hotel_search',
    endpoint: url.replace(SEARCH_BASE, ''),
    method: 'POST',
    requestBody: body,
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
    requestId: logOpts?.requestId,
  });
  return data as T;
}

async function bookingPost<T>(url: string, body: unknown, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    await logApiCall({
      provider: 'tbo_hotel_booking',
      endpoint: url.replace(BOOKING_BASE, ''),
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
  await logApiCall({
    provider: 'tbo_hotel_booking',
    endpoint: url.replace(BOOKING_BASE, ''),
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
      await logApiCall({
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
    await logApiCall({
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

export function getCountries(): Promise<{ CountryList: TBOHotelCountry[] }> {
  return staticGet<{ CountryList: TBOHotelCountry[] }>(`${STATIC_DATA_BASE}/CountryList`);
}

export function getCities(countryCode: string): Promise<{ CityList?: TBOHotelCity[] }> {
  return staticJsonPost<{ CityList?: TBOHotelCity[] }>(`${STATIC_DATA_BASE}/CityList`, { CountryCode: countryCode });
}

export function getHotelCodeList(cityCode: string, logOpts?: LogOptions): Promise<{ Status: TBOStatus; Hotels: TBOHotelCodeItem[] }> {
  return staticJsonPost(`${STATIC_DATA_BASE}/TBOHotelCodeList`, { CityCode: cityCode }, logOpts);
}

export function getHotelDetails(hotelCodes: string, logOpts?: LogOptions): Promise<{ Status: { Code: number; Description: string }; HotelDetails: TBOHotelDetail[] }> {
  return staticJsonPost(`${STATIC_DATA_BASE}/HotelDetails`, { HotelCodes: hotelCodes }, logOpts);
}

export function searchHotels(req: TBOHotelSearchRequest, logOpts?: LogOptions): Promise<TBOHotelSearchResponse> {
  return searchPost<TBOHotelSearchResponse>(`${SEARCH_BASE}/Search`, req, logOpts);
}

export function preBook(req: TBOHotelPreBookRequest): Promise<TBOHotelPreBookResponse> {
  return searchPost<TBOHotelPreBookResponse>(`${SEARCH_BASE}/PreBook`, req);
}

export function bookHotel(req: TBOHotelBookRequest): Promise<TBOHotelBookResponse> {
  return bookingPost<TBOHotelBookResponse>(`${BOOKING_BASE}/book`, req);
}

export function getBookingDetail(req: TBOHotelBookingDetailRequest): Promise<TBOHotelBookingDetailResponse> {
  return bookingPost<TBOHotelBookingDetailResponse>(`${BOOKING_BASE}/Getbookingdetail`, req);
}

export function generateVoucher(req: TBOHotelGenerateVoucherRequest): Promise<TBOHotelGenerateVoucherResponse> {
  return bookingPost<TBOHotelGenerateVoucherResponse>(`${BOOKING_BASE}/GenerateVoucher`, req);
}

export function sendChangeRequest(req: TBOHotelSendChangeRequest): Promise<TBOHotelSendChangeResponse> {
  return bookingPost<TBOHotelSendChangeResponse>(`${BOOKING_BASE}/SendChangeRequest`, req);
}

export function getChangeRequestStatus(req: TBOHotelGetChangeRequestStatusRequest): Promise<TBOHotelGetChangeRequestStatusResponse> {
  return bookingPost<TBOHotelGetChangeRequestStatusResponse>(`${BOOKING_BASE}/GetChangeRequestStatus`, req);
}
