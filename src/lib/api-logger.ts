import { prisma } from './prisma';

export type ApiProvider =
  | 'tbo_hotel'
  | 'tbo_flight'
  | 'tbo_hotel_static'
  | 'tbo_hotel_search'
  | 'tbo_hotel_booking'
  | 'tbo_hotel_prebook'
  | 'tbo_hotel_cancel'
  | 'tbo_hotel_voucher'
  | 'zaakpay'
  | 'brevo'
  | 'razorpay';

// Fire-and-forget logger — NEVER await this.
export function logApiCall(params: {
  provider: ApiProvider;
  endpoint: string;
  method: string;
  requestBody?: unknown;
  responseBody?: unknown;
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  requestId?: string;
  batchIndex?: number;
  batchTotal?: number;
  // Certification fields
  tokenId?: string;
  endUserIp?: string;
  traceId?: string;
}) {
  const environment = process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'dev';
  const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID || null;

  const stringify = (obj: unknown): string | null => {
    if (!obj) return null;
    try {
      return JSON.stringify(obj);
    } catch {
      return null;
    }
  };

  // Extract structured fields from request body
  let cityCodes: string | null = null;
  let hotelCodes: string | null = null;
  let checkIn: string | null = null;
  let checkOut: string | null = null;
  let paxConfig: string | null = null;
  let guestNationality: string | null = null;
  let preferredCurrency: string | null = null;

  if (params.requestBody && typeof params.requestBody === 'object') {
    const req = params.requestBody as Record<string, unknown>;
    if (typeof req.CityCode === 'string') cityCodes = req.CityCode;
    if (typeof req.HotelCodes === 'string') hotelCodes = req.HotelCodes;
    if (typeof req.CheckIn === 'string') checkIn = req.CheckIn;
    if (typeof req.CheckOut === 'string') checkOut = req.CheckOut;
    if (typeof req.GuestNationality === 'string') guestNationality = req.GuestNationality;
    if (typeof req.PreferredCurrency === 'string') preferredCurrency = req.PreferredCurrency;
    if (Array.isArray(req.PaxRooms)) {
      paxConfig = JSON.stringify(req.PaxRooms);
    }
  }

  // Extract TBO status code, summary, and flight source from response body
  let tboStatusCode: number | null = null;
  let summary: string | null = null;
  let traceId = params.traceId || null;
  let flightSource: number | null = null;

  if (params.responseBody && typeof params.responseBody === 'object') {
    const resp = params.responseBody as Record<string, unknown>;
    // TBO flight wraps under .Response, hotel API has Status at top level
    const innerResp = (resp.Response || resp) as Record<string, unknown>;
    const status = innerResp.Status as Record<string, unknown> | undefined;
    if (status && typeof status.Code === 'number') {
      tboStatusCode = status.Code;
    }
    const statusDesc = status?.Description as string | undefined;
    if (statusDesc) {
      summary = statusDesc;
    } else if (Array.isArray(innerResp.HotelResult)) {
      summary = `${innerResp.HotelResult.length} hotels found`;
    } else if (Array.isArray(innerResp.FlightResult)) {
      summary = `${innerResp.FlightResult.length} flights found`;
    }
    // Extract TraceId from response if not passed explicitly
    if (!traceId && typeof innerResp.TraceId === 'string') {
      traceId = innerResp.TraceId;
    }
    // Extract Source from flight search Response.Results[0][0].Source
    const results = innerResp.Results;
    if (Array.isArray(results) && results[0]) {
      const firstGroup = Array.isArray(results[0]) ? results[0] : [results[0]];
      if (firstGroup[0] && typeof firstGroup[0] === 'object') {
        const firstResult = firstGroup[0] as Record<string, unknown>;
        if (typeof firstResult.Source === 'number') {
          flightSource = firstResult.Source;
        }
      }
    }
  }

  const logData = {
    provider: params.provider,
    endpoint: params.endpoint,
    method: params.method,
    request_body: stringify(params.requestBody),
    response_body: stringify(params.responseBody),
    status_code: params.statusCode ?? null,
    tbo_status_code: tboStatusCode,
    response_time_ms: params.responseTimeMs ?? null,
    error_message: params.errorMessage ?? null,
    request_id: params.requestId ?? null,
    batch_index: params.batchIndex ?? null,
    batch_total: params.batchTotal ?? null,
    summary,
    token_id: params.tokenId ?? null,
    end_user_ip: params.endUserIp ?? null,
    city_codes: cityCodes,
    hotel_codes: hotelCodes,
    check_in: checkIn,
    check_out: checkOut,
    pax_config: paxConfig,
    guest_nationality: guestNationality,
    preferred_currency: preferredCurrency,
    trace_id: traceId,
    flight_source: flightSource,
    cert_case: null,
    cert_label: null,
    environment,
    vercel_deployment_id: vercelDeploymentId,
  };

  // Fire-and-forget: don't await, don't block the caller
  prisma.apiLog.create({ data: logData as never }).catch(() => {});
}
