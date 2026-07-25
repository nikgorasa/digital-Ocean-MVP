-- Add TBO certification columns to api_logs
-- Date: 2026-07-25

ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS token_id STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS end_user_ip STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS city_codes STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS hotel_codes STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS check_in STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS check_out STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS pax_config STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS guest_nationality STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS preferred_currency STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS trace_id STRING NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS cert_case INT NULL;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS cert_label STRING NULL;

CREATE INDEX IF NOT EXISTS idx_api_logs_cert_case ON api_logs(cert_case);
CREATE INDEX IF NOT EXISTS idx_api_logs_trace_id ON api_logs(trace_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_token_id ON api_logs(token_id);
