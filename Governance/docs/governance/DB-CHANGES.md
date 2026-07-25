# GoRASA CockroachDB Standalone — Database Changes Log

> **Purpose:** Living document tracking all DB schema and data changes.
> **Format:** `Date | Time | Type | Table(s) | Description | Commit`
> **Updated:** After every DB change.

---

## Changes

| Date | Time | Type | Table(s) | Description | Commit |
|------|------|------|----------|-------------|--------|
| 2026-07-26 | — | SCHEMA | api_logs | Added flight_source column + index for GDS/LCC filtering | 20260726_api_logs_flight_source.sql |
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

---

## DONE — City Table: Airport Columns (EPIC #276)

**Type:** Schema (DDL) + Data Seed
**Status:** Applied to DEV + PROD ✓
**GitHub Issue:** #277, #278

**Changes:**

| Table | Column | Type | Default | Description |
|-------|--------|------|---------|-------------|
| City | airport_name | STRING | NULL | Full airport name (e.g., "Chhatrapati Shivaji International Airport") |
| City | country_code | STRING | NULL | ISO 3166-1 Alpha-2 code (e.g., "IN") |
| City | flag | STRING | NULL | Emoji flag (e.g., "🇮🇳") |
| City | latitude | FLOAT8 | NULL | Airport latitude in decimal degrees |
| City | longitude | FLOAT8 | NULL | Airport longitude in decimal degrees |
| City | airport_type | STRING | NULL | OurAirports type ("large_airport" or "medium_airport") |

**SQL applied:**
```sql
ALTER TABLE "City" ADD COLUMN "airport_name" STRING;
ALTER TABLE "City" ADD COLUMN "country_code" STRING;
ALTER TABLE "City" ADD COLUMN "flag" STRING;
ALTER TABLE "City" ADD COLUMN "latitude" FLOAT8;
ALTER TABLE "City" ADD COLUMN "longitude" FLOAT8;
ALTER TABLE "City" ADD COLUMN "airport_type" STRING;
```

**Applied via:** Direct SQL on both DEV + PROD CockroachDB clusters (2026-07-18)

**Seed data:** 2,161 airports from OurAirports (CC0 public domain, filtered: large/medium, scheduled service, IATA code present). Source: `ourairports.com/data/airports.csv`

## 2026-07-20 — AYJ Airport Rename: Faizabad → Ayodhya

**Type:** Data Update (DML)
**Status:** Applied to DEV + PROD ✓

**Changes:**

| Table | Column | Before | After |
|-------|--------|--------|-------|
| City | name | "Faizabad" | "Ayodhya" |

**SQL:**
```sql
UPDATE "City" SET name = 'Ayodhya' WHERE iata_code = 'AYJ';
```

**Applied via:** Direct SQL on both DEV + PROD CockroachDB clusters (2026-07-20)

**Reason:** AYJ airport has been officially renamed to reflect Ayodhya (Faizabad name retired). Airport name remains "Maharshi Valmiki International Airport".

## 2026-07-20 — Indian Airport Official Name Corrections (Batch)

**Type:** Data Update (DML)
**Status:** Applied to DEV + PROD ✓

**Changes:**

| IATA | Before (OurAirports municipality) | After (Official Name) |
|------|------------------------------------|----------------------|
| AYJ | Faizabad | Ayodhya |
| IXD | Allahabad | Prayagraj |
| CCJ | Calicut | Kozhikode |
| GOI | Vasco da Gama | Goa |
| IXG | Belgaum | Belagavi |

**SQL:**
```sql
UPDATE "City" SET name = 'Ayodhya' WHERE iata_code = 'AYJ';
UPDATE "City" SET name = 'Prayagraj' WHERE iata_code = 'IXD';
UPDATE "City" SET name = 'Kozhikode' WHERE iata_code = 'CCJ';
UPDATE "City" SET name = 'Goa' WHERE iata_code = 'GOI';
UPDATE "City" SET name = 'Belagavi' WHERE iata_code = 'IXG';
```

**Applied via:** Direct SQL on both DEV + PROD CockroachDB clusters (2026-07-20)

**Seed script:** Added `CITY_NAME_OVERRIDES` map in `seed-airports.ts` to preserve official names on future re-seeds.

---

## 2026-07-22 — EPIC-DISC: Pricing Breakdown + Rewards Schema

**Type:** Migration (DDL + DML)
**Status:** Applied to DEV + PROD ✓

**Changes:**

| Table | Column | Type | Default | Purpose |
|-------|--------|------|---------|---------|
| Booking | baseRate | FLOAT | null | TBO base price before markup |
| Booking | markupAmount | FLOAT | null | GoRASA markup from PricingRule |
| Booking | totalDiscount | FLOAT | 0 | Sum of all discounts (promo + corporate + admin) |
| Booking | rewardPointsEarned | INT | 0 | Gorasa Reward points (1.5% of paid amount) |
| PricingRule | (seed row) | — | — | Flight default 5% markup |

**SQL (DEV + PROD):**
```sql
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "baseRate" FLOAT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "markupAmount" FLOAT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "totalDiscount" FLOAT DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "rewardPointsEarned" INT DEFAULT 0;
```

**Seed (both clusters):**
```sql
INSERT INTO "PricingRule" (id, type, name, category, "markupType", "markupValue", "isActive", priority, "createdAt", "updatedAt")
VALUES ('default-flight-markup', 'GLOBAL', 'Flight Default 5%', 'FLIGHT', 'PERCENT', 5, true, 0, now(), now());
```

**Applied via:** Direct SQL on both DEV + PROD CockroachDB clusters (2026-07-22)
