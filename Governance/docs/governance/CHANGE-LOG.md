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
| CRDB-GOV-008 | 2026-07-22 10:00 | System | Context-aware governance v2.1.0 — task-aware check routing, 8 behavioral checks, --task/--quick flags | scripts/preflight-check.sh, scripts/post-task-check.sh, AGENTS.md, Governance/scripts/Cckr-governance-check.sh (new), Governance/docs/governance/CONTEXT-AWARE-GOVERNANCE.md (new) | Revert git commit; old scripts preserved as Cckr-preflight-check.sh and Cckr-post-task-check.sh |
| CRDB-GOV-009 | 2026-07-24 18:00 | System | Search Epics 1-6 — global TBO cities, pricing double-count fix, flight API retry, dynamic price ranges, empty filter states, dead code cleanup | src/app/api/cities/tbo/route.ts, src/components/CitySearchDropdown.tsx, src/app/hotels/page.tsx, src/lib/tbo-hotel-client.ts, src/components/HotelBookingModal.tsx, src/components/FlightBookingModal.tsx, src/hooks/useFilters.ts, src/lib/tbo-flight-api.ts, src/app/flights/page.tsx, src/middleware.ts | Revert git commit (559d954) |
| CRDB-GOV-010 | 2026-07-24 20:00 | System | Search UX research — 3 problem areas identified (cold start, domestic/intl separation, display clutter), 3 P0 EPICs created (SEARCH-UX-EPIC-1/2/3), prioritized 3-phase roadmap | Research-Brief-Travel-Portal-Search-UX.md (new), Governance/docs/governance/Cckr-SESSION-LOG.md, Governance/docs/governance/CHANGE-LOG.md, Governance/docs/governance/LEARNING-FROM-MISTAKES.md | Delete research brief and revert governance docs |
| CRDB-GOV-011 | 2026-07-24 22:00 | System | Search UX implementation — status messages (useSearchTimer), per-night price display, domestic/intl tabs, progressive filter disclosure, empty filter states | src/hooks/useSearchTimer.ts, src/app/hotels/page.tsx, src/app/flights/page.tsx, src/components/CitySearchDropdown.tsx, src/components/HotelBookingModal.tsx, src/components/FilterPanel.tsx | Revert git commit (4d99cdf) |
| CRDB-GOV-012 | 2026-07-25 10:00 | System | EPIC/Issue consolidation — audited all governance docs, merged duplicates (CASH→ZAK, REMOVE-INDIA+TBO-01→INTL), closed 15 resolved epics, created single source of truth with 24 open issues across 11 epics | Governance/docs/governance/SPRINT-PLAN.md, Governance/docs/governance/Cckr-SESSION-LOG.md, Governance/docs/governance/MISTAKE-LOG.md | Restore prior SPRINT-PLAN.md and session log |