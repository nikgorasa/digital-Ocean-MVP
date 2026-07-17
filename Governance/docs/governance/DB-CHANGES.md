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
