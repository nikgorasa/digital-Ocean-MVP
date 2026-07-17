# GoRASA CockroachDB Standalone — Database Changes Log

> **Purpose:** Living document tracking all DB schema and data changes.
> **Format:** `Date | Time | Type | Table(s) | Description | Commit`
> **Updated:** After every DB change.

---

## Changes

| Date | Time | Type | Table(s) | Description | Commit |
|------|------|------|----------|-------------|--------|
| 2026-06-17 | 10:00 | SCHEMA | api_logs | Created api_logs table for TBO API logging | 20260617_api_logs.sql |

## 2026-07-17 — Corporate Invoice Schema Extensions

**Type:** Migration (DDL)
**Status:** Applied to DEV + PROD ✓

**Changes:**

| Table | Column | Type | Default | Description |
|-------|--------|------|---------|-------------|
| Company | taxRate | FLOAT | 0 | Corporate tax rate percentage for invoice calculation |
| Company | paymentTermsDays | INT | 30 | Payment terms in days for invoice dueDate calculation |

**SQL:**
```sql
ALTER TABLE "Company" ADD COLUMN "taxRate" FLOAT NOT NULL DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN "paymentTermsDays" INT NOT NULL DEFAULT 30;
```

**Commit:** b72599d

## 2026-07-03 — Corporate Booking Flow Schema Changes

**Type:** Migration (DDL)
**Status:** Applied to DEV + PROD ✓

**Changes:**
- `Invoice` — enhanced with companyId, amount, taxAmount, totalAmount, status, dueDate, paidAt, paidAmount, paymentRef, notes, timestamps
- `WalletLedger` — new table for corporate wallet transaction history (id, companyId, type, amount, balanceAfter, referenceType, referenceId, description, performedBy, createdAt)
- `Booking` — added paymentMethod, companyId, corporateDiscount
- `Company` — added creditLimit

**Applied via:** Direct SQL on both DEV + PROD CockroachDB clusters

---

## 2026-07-03 — hotelCode Column on PricingRule

**Type:** Schema (DDL)
**Status:** Applied to DEV + PROD ✓

**Changes:**
- `PricingRule` — added `"hotelCode" TEXT` column for TBO hotel code matching

**Seed data:**
- 7 pricing rules inserted (Midtown Hotel, Hotel Delhi 37, Jukaso Inn Down Town, Hotel Africa Avenue G K 1, Park Ascent, Eros Hotel New Delhi, Majestic Palace)
- All 7% flat PERCENT markup, category ALL, priority 100

**Applied via:** Direct SQL on both DEV + PROD CockroachDB clusters

---

## 2026-07-17 — TBO Static Data Cache Tables

**Type:** Migration (DDL)
**Status:** Applied to DEV + PROD ✓

**Changes:**

| Table | Description |
|-------|-------------|
| static_cache | Generic key-value cache for TBO static data (CountryList, CityList, HotelCodeList, HotelDetails) |
| cache_config | Admin-configurable TTL settings per data type |

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS static_cache (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_static_cache_data_type ON static_cache(data_type);
CREATE INDEX IF NOT EXISTS idx_static_cache_expires_at ON static_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_static_cache_type_expires ON static_cache(data_type, expires_at);

CREATE TABLE IF NOT EXISTS cache_config (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL UNIQUE,
  ttl_seconds INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_refresh_at TIMESTAMPTZ,
  refresh_status TEXT,
  refresh_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO cache_config (id, data_type, ttl_seconds) VALUES 
  (gen_random_uuid(), 'CountryList', 86400),
  (gen_random_uuid(), 'CityList', 86400),
  (gen_random_uuid(), 'HotelCodeList', 86400),
  (gen_random_uuid(), 'HotelDetails', 86400)
ON CONFLICT (data_type) DO NOTHING;
```

**Commit:** b36530c
