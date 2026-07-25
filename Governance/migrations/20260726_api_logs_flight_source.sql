-- Migration: Add flight_source column to api_logs
-- Purpose: Store TBO Source field (4=Amadeus, 5=Galileo, 14=AirIndiaExpress, etc.)
--          for filtering GDS vs LCC flights in admin logs
-- Applied to: DEV + PROD CockroachDB clusters

ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS flight_source INTEGER;
CREATE INDEX IF NOT EXISTS idx_api_logs_flight_source ON api_logs(flight_source);
