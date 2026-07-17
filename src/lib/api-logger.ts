import { prisma } from './prisma';

export type ApiProvider = 'tbo_hotel' | 'tbo_flight' | 'tbo_hotel_static' | 'tbo_hotel_search' | 'tbo_hotel_booking';

// Fire-and-forget logger — NEVER await this. Logs metadata only, not full bodies.
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
}) {
  const environment = process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'dev';
  const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID || null;

  // Truncate bodies to max 2KB to prevent DB bloat and slow writes
  const truncate = (obj: unknown, max = 2048): string | null => {
    if (!obj) return null;
    try {
      const str = JSON.stringify(obj);
      return str.length > max ? str.slice(0, max) + '...[truncated]' : str;
    } catch {
      return null;
    }
  };

  const logData = {
    provider: params.provider,
    endpoint: params.endpoint,
    method: params.method,
    request_body: truncate(params.requestBody),
    response_body: truncate(params.responseBody),
    status_code: params.statusCode ?? null,
    response_time_ms: params.responseTimeMs ?? null,
    error_message: params.errorMessage ?? null,
    request_id: params.requestId ?? null,
    batch_index: params.batchIndex ?? null,
    batch_total: params.batchTotal ?? null,
    environment,
    vercel_deployment_id: vercelDeploymentId,
  };

  // Fire-and-forget: don't await, don't block the caller
  prisma.apiLog.create({ data: logData as never }).catch(() => {});
}
