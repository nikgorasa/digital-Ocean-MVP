-- Add tbo_status_code and summary columns to api_logs
-- Date: 2026-07-25

ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS tbo_status_code INT;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS summary TEXT;

-- Index for filtering by TBO status code (e.g. 201 = no rooms)
CREATE INDEX IF NOT EXISTS idx_api_logs_tbo_status ON api_logs(tbo_status_code);
