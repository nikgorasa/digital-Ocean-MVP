# GoRASA CockroachDB Standalone — Change Log

> **Purpose:** Governance change log. Append-only. Tracks rule changes, version bumps, and governance decisions.
> **Format:** `change-id | timestamp | author | reason | scope | rollback-note`
> **Updated:** After every governance rule change.

---

## Changes

| Change ID | Timestamp | Author | Reason | Scope | Rollback Note |
|-----------|-----------|--------|--------|-------|---------------|
| CRDB-GOV-001 | 2026-06-14 10:00 | System | Initial governance restructure | All | Restore from git history |
| CRDB-GOV-002 | 2026-06-19 10:00 | System | Full Supabase purge, dual DB isolation, governance script fixes | All code + scripts + env | Revert git commit |
| CRDB-GOV-003 | 2026-06-19 10:00 | System | Fixed detect-governance-root.sh hardcoded path | Governance/scripts | Revert git commit |
| CRDB-GOV-004 | 2026-07-09 17:30 | System | Replace default Next.js logo/favicon SVGs with new GoRASA logo | public/logo.svg, public/favicon.svg | Revert git commit |
| CRDB-GOV-005 | 2026-07-17 01:30 | System | INVOICE-EPIC: PDF generation, CSV export, email templates, auto-overdue cron | src/lib/invoice-pdf.ts, src/app/api/invoices/*, src/lib/email.ts | Revert git commit |
| CRDB-GOV-006 | 2026-07-17 02:00 | System | TBO-CACHE: DB-based static data caching with L1 memory + L2 CockroachDB | src/lib/static-cache.ts, src/lib/cache-refresh.ts, prisma/schema.prisma | Revert git commit |
| CRDB-GOV-007 | 2026-07-17 02:30 | System | INTL-EPIC: International travel support — country selector, currency, visa warnings | src/components/CitySearchDropdown.tsx, src/lib/visa-requirements.ts, src/lib/utils.ts | Revert git commit |
