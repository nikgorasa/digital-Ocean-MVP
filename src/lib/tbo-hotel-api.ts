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
} from "./tbo-hotel-types";
import { logApiCall } from "./api-logger";

const BASE_URL = "https://api.tbotechnology.in/TBOHolidays_HotelAPI";

const HOTEL_USERNAME = process.env.TBO_HOTEL_USERNAME || "";
const HOTEL_PASSWORD = process.env.TBO_HOTEL_PASSWORD || "";

const AUTH_HEADER = { Authorization: `Basic ${btoa(`${HOTEL_USERNAME}:${HOTEL_PASSWORD}`)}` };

interface LogOptions {
  requestId?: string;
  batchIndex?: number;
  batchTotal?: number;
}

async function post<T>(url: string, body: unknown, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...AUTH_HEADER },
    body: JSON.stringify(body),
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    await logApiCall({
      provider: 'tbo_hotel',
      endpoint: url.replace(BASE_URL, ''),
      method: 'POST',
      requestBody: body,
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      requestId: logOpts?.requestId,
      batchIndex: logOpts?.batchIndex,
      batchTotal: logOpts?.batchTotal,
    });
    throw new Error(`TBO Hotel HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  await logApiCall({
    provider: 'tbo_hotel',
    endpoint: url.replace(BASE_URL, ''),
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

async function get<T>(url: string, logOpts?: LogOptions): Promise<T> {
  const start = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...AUTH_HEADER },
  });
  const responseTime = Date.now() - start;

  if (!res.ok) {
    await logApiCall({
      provider: 'tbo_hotel',
      endpoint: url.replace(BASE_URL, ''),
      method: 'GET',
      statusCode: res.status,
      responseTimeMs: responseTime,
      errorMessage: `HTTP ${res.status}: ${res.statusText}`,
      requestId: logOpts?.requestId,
      batchIndex: logOpts?.batchIndex,
      batchTotal: logOpts?.batchTotal,
    });
    throw new Error(`TBO Hotel HTTP GET ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  await logApiCall({
    provider: 'tbo_hotel',
    endpoint: url.replace(BASE_URL, ''),
    method: 'GET',
    responseBody: data,
    statusCode: res.status,
    responseTimeMs: responseTime,
    requestId: logOpts?.requestId,
    batchIndex: logOpts?.batchIndex,
    batchTotal: logOpts?.batchTotal,
  });

  return data as T;
}

export function authenticate(req: TBOHotelAuthRequest): Promise<TBOHotelAuthResponse> {
  return post<TBOHotelAuthResponse>(`${BASE_URL}/Authenticate`, req);
}

export function searchHotels(req: TBOHotelSearchRequest, logOpts?: LogOptions): Promise<TBOHotelSearchResponse> {
  return post<TBOHotelSearchResponse>(`${BASE_URL}/Search`, req, logOpts);
}

export function preBook(req: TBOHotelPreBookRequest): Promise<TBOHotelPreBookResponse> {
  return post<TBOHotelPreBookResponse>(`${BASE_URL}/PreBook`, req);
}

export function bookHotel(req: TBOHotelBookRequest): Promise<TBOHotelBookResponse> {
  return post<TBOHotelBookResponse>(`${BASE_URL}/Book`, req);
}

export function getBookingDetail(req: TBOHotelBookingDetailRequest): Promise<TBOHotelBookingDetailResponse> {
  return post<TBOHotelBookingDetailResponse>(`${BASE_URL}/GetBookingDetail`, req);
}

export function getCountries(): Promise<TBOHotelCountry[]> {
  return get<TBOHotelCountry[]>(`${BASE_URL}/CountryList`);
}

export function getCities(countryCode: string): Promise<TBOHotelCity[]> {
  return post<TBOHotelCity[]>(`${BASE_URL}/CityList`, { CountryCode: countryCode });
}

export function getHotelCodeList(cityCode: string, logOpts?: LogOptions): Promise<{ Status: TBOStatus; Hotels: TBOHotelCodeItem[] }> {
  return post(`${BASE_URL}/TBOHotelCodeList`, { CityCode: cityCode }, logOpts);
}

export function getHotelDetails(hotelCodes: string, logOpts?: LogOptions): Promise<{ Status: { Code: number; Description: string }; HotelDetails: TBOHotelDetail[] }> {
  return post(`${BASE_URL}/HotelDetails`, { HotelCodes: hotelCodes }, logOpts);
}
