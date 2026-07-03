# GoRASA CockroachDB Standalone — Database Changes Log

> **Purpose:** Living document tracking all DB schema and data changes.
> **Format:** `Date | Time | Type | Table(s) | Description | Commit`
> **Updated:** After every DB change.

---

## Changes

| Date | Time | Type | Table(s) | Description | Commit |
|------|------|------|----------|-------------|--------|
| 2026-06-17 | 10:00 | SCHEMA | api_logs | Created api_logs table for TBO API logging | 20260617_api_logs.sql |

## 2026-07-03 — Corporate Booking Flow Schema Changes

**Type:** Migration (DDL)
**Status:** Applied to DEV + PROD ✓

**Changes:**
- `Invoice` — enhanced with companyId, amount, taxAmount, totalAmount, status, dueDate, paidAt, paidAmount, paymentRef, notes, timestamps
- `WalletLedger` — new table for corporate wallet transaction history (id, companyId, type, amount, balanceAfter, referenceType, referenceId, description, performedBy, createdAt)
- `Booking` — added paymentMethod, companyId, corporateDiscount
- `Company` — added creditLimit

**Applied via:** Direct SQL on both DEV + PROD CockroachDB clusters
