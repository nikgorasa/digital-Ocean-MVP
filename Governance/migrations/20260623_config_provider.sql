-- ═══════════════════════════════════════════════════════════
-- Migration: 20260623_config_provider
-- Creates ConfigProvider and ConfigAuditLog tables for
-- runtime-configurable API provider credentials.
-- Applies to both DEV and PROD CockroachDB clusters.
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────
-- 1. ConfigProvider
-- ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "ConfigProvider" (
  id STRING PRIMARY KEY DEFAULT gen_random_uuid(),
  provider STRING NOT NULL,
  label STRING NOT NULL DEFAULT '',
  "baseUrl" STRING,
  "bookingUrl" STRING,
  "staticUrl" STRING,
  "clientId" STRING,
  "encryptedUsername" STRING,
  "encryptedPassword" STRING,
  "encryptedStaticUsername" STRING,
  "encryptedStaticPassword" STRING,
  "forceMock" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  version INT8 NOT NULL DEFAULT 1,
  "createdBy" STRING,
  "updatedBy" STRING,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider)
);

-- ──────────────────────────────────
-- 2. ConfigAuditLog
-- ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "ConfigAuditLog" (
  id STRING PRIMARY KEY DEFAULT gen_random_uuid(),
  provider STRING NOT NULL,
  action STRING NOT NULL,
  field STRING,
  "oldValue" STRING,
  "newValue" STRING,
  "performedBy" STRING,
  "ipAddress" STRING,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  INDEX idx_config_audit_log_provider_created (provider, "createdAt" DESC)
);

-- ──────────────────────────────────
-- 3. Verify
-- ──────────────────────────────────
SELECT 'ConfigProvider' AS table_name, COUNT(*) AS row_count FROM "ConfigProvider"
UNION ALL
SELECT 'ConfigAuditLog', COUNT(*) FROM "ConfigAuditLog";
