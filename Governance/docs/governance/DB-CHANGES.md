# GoRASA CockroachDB Standalone — Database Changes Log

> **Purpose:** Living document tracking all DB schema and data changes.
> **Format:** `Date | Time | Type | Table(s) | Description | Commit`
> **Updated:** After every DB change.

---

## Changes

| Date | Time | Type | Table(s) | Description | Commit |
|------|------|------|----------|-------------|--------|
| 2026-06-17 | 10:00 | SCHEMA | api_logs | Created api_logs table for TBO API logging | 20260617_api_logs.sql |

## 2026-06-23 — ConfigProvider + ConfigAuditLog

**Type:** Migration (DDL)
**Status:** Applied to DEV ✓

**Changes:**
- `ConfigProvider` — stores per-provider API config with AES-256-GCM encrypted credentials
- `ConfigAuditLog` — append-only audit trail for config changes

**Migration file:** `Governance/migrations/20260623_config_provider.sql`

**Applied via:** Node.js pg client against DEV cluster
