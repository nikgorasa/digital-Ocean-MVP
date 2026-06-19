import { prisma } from './prisma';

export type ApiProvider = 'tbo_hotel' | 'tbo_flight' | 'tbo_hotel_static' | 'tbo_hotel_search' | 'tbo_hotel_booking';

export async function logApiCall(params: {
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
  let environment = process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'dev';

  if (environment === 'production' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('biz.gorasa.in') || host.includes('dev-gorasa')) {
      environment = 'development';
    } else if (host.includes('cckr') || host.includes('standalone')) {
      environment = 'standalone';
    }
  }
  const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID || null;

  const logData = {
    provider: params.provider,
    endpoint: params.endpoint,
    method: params.method,
    request_body: params.requestBody ?? null,
    response_body: params.responseBody ?? null,
    status_code: params.statusCode ?? null,
    response_time_ms: params.responseTimeMs ?? null,
    error_message: params.errorMessage ?? null,
    request_id: params.requestId ?? null,
    batch_index: params.batchIndex ?? null,
    batch_total: params.batchTotal ?? null,
    environment,
    vercel_deployment_id: vercelDeploymentId,
  };

  try {
    await prisma.apiLog.create({ data: logData as never });
  } catch (error) {
    console.error('[ApiLogger] Failed to log API call:', error);
  }
}
