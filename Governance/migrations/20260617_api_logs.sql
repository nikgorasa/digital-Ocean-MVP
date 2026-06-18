-- Standalone Build (CockroachDB) - Complete Migration
-- Run this in CockroachDB SQL console
-- Date: 2026-06-17

-- ============================================================
-- 1. API Logs Table (for TBO API logging)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_body JSONB,
  response_body JSONB,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  request_id TEXT,
  batch_index INTEGER,
  batch_total INTEGER,
  environment TEXT NOT NULL,
  vercel_deployment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_api_logs_provider_created ON api_logs(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_request_id ON api_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_environment_created ON api_logs(environment, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at DESC);

-- ============================================================
-- 2. NavigationItem for API Logs
-- ============================================================
-- Check if already exists before inserting
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "NavigationItem" WHERE href = '/admin/api-logs') THEN
    INSERT INTO "NavigationItem" (id, href, label, icon, section, requiredrole, sortorder, isactive, "createdAt")
    VALUES (
      gen_random_uuid(),
      '/admin/api-logs',
      'API Logs',
      'Settings',
      'admin',
      NULL,
      14,
      true,
      NOW()
    );
  END IF;
END $$;

-- ============================================================
-- 3. Booking table - add cancelledAt and cancellationReason
-- ============================================================
-- Check if columns exist before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Booking' AND column_name = 'cancelledAt'
  ) THEN
    ALTER TABLE "Booking" ADD COLUMN "cancelledAt" TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Booking' AND column_name = 'cancellationReason'
  ) THEN
    ALTER TABLE "Booking" ADD COLUMN "cancellationReason" TEXT;
  END IF;
END $$;

-- ============================================================
-- 4. User table - add role column (if not exists)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'role'
  ) THEN
    ALTER TABLE "User" ADD COLUMN role TEXT DEFAULT 'CUSTOMER';
  END IF;
END $$;

-- ============================================================
-- 5. City table - add iata_code column (if not exists)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'City' AND column_name = 'iata_code'
  ) THEN
    ALTER TABLE "City" ADD COLUMN iata_code TEXT;
  END IF;
END $$;

-- ============================================================
-- Verification
-- ============================================================
SELECT 'api_logs' as table_name, COUNT(*) as row_count FROM api_logs
UNION ALL
SELECT 'NavigationItem (API Logs)', COUNT(*) FROM "NavigationItem" WHERE href = '/admin/api-logs'
UNION ALL
SELECT 'Booking (cancelledAt)', COUNT(*) FROM information_schema.columns WHERE table_name = 'Booking' AND column_name = 'cancelledAt'
UNION ALL
SELECT 'User (role)', COUNT(*) FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role'
UNION ALL
SELECT 'City (iata_code)', COUNT(*) FROM information_schema.columns WHERE table_name = 'City' AND column_name = 'iata_code';
