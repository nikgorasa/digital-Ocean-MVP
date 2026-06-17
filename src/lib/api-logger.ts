import { supabaseAdmin } from './supabase-admin';

export type ApiProvider = 'tbo_hotel' | 'tbo_flight';

export async function logApiCall(params: {
  provider: ApiProvider;
  endpoint: string;
  method: string;
  requestBody?: any;
  responseBody?: any;
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  requestId?: string;
  batchIndex?: number;
  batchTotal?: number;
}) {
  // Detect environment from APP_ENV, VERCEL_ENV, or hostname
  let environment = process.env.APP_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV || 'dev';
  
  // Fallback: detect from hostname if env var not set
  if (environment === 'production' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('biz.gorasa.in') || host.includes('dev-gorasa')) {
      environment = 'development';
    } else if (host.includes('project-sm6gc') || host.includes('qa')) {
      environment = 'preview';
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
    // Always use Supabase for centralized logging across all environments
    await supabaseAdmin.from('api_logs').insert(logData);
  } catch (error) {
    // Don't let logging failures break the API
    console.error('[ApiLogger] Failed to log API call:', error);
  }
}
