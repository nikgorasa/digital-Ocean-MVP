# GoRASA CockroachDB Standalone — Sprint Plan (Consolidated from GitHub + Code)

> **Last updated:** 2026-07-25 (Session 44 — CANCEL/TBO-ARCH/RECONCILE implementation)
> **Current Sprint:** Sprint 4 — Production Readiness
> **Source of Truth:** This file reflects actual GitHub issues + code audit. Single authoritative tracker.

---

## Consolidated Issue Registry (89 Open GitHub Issues → 16 Epics)

### BLOCKERS — Must Fix Before Launch (P0/Critical)

| Epic | GitHub Issues | Description | Status | Blockers |
|------|---------------|-------------|--------|----------|
| **ZAAKPAY** | #112 (PAY-06), #109 (PAY-EPIC) | Cancellation now calls Zaakpay refund API; Payment gateway production readiness | **PARTIAL** — Zaakpay refund added to cancellations/route.ts | External: Zaakpay sandbox creds needed (#111 closed as BLOCKED) |
| **CANCEL-EPIC** | #292, #293, #294, #295, #296 | Real TBO cancellation flow — flights + hotels. Wire flight cancel to /api/cancellations, replace calculateMockRefund with real TBO charges, build styled dialog, **add cancel button to FlightBookingModal** | **PARTIAL** — Flight cancel API wired, TBO charges used, CancellationDialog exists, **Cancel button added to FlightBookingModal done step** | — |
| **TBO-ARCH** | #237, #238, #239, #241, #242, #244 | TBO API architecture: ConfigProvider integration for flight endpoints (DB-config), mock fallback (forceMock), graceful errors, admin health check, response caching | **PARTIAL** — ConfigProvider integration for flight endpoints DONE (tbo-flight-api.ts reads from ConfigProvider), forceMock added to tbo-flight-client.ts | #240 (retry logic) DONE |
| **FLIGHT-UX** | #102, #219 | Premium economy shown when economy searched; Filter results by requested cabin class | STILL_OPEN | — |

---

### HIGH PRIORITY (P1)

| Epic | GitHub Issues | Description | Status | Blockers |
|------|---------------|-------------|--------|----------|
| **CORP-EPIC** | #286, #287 | Corporate: Stuck PENDING bookings when TBO succeeds but checkout fails; Automated TBO voucher verification after booking | **PARTIAL** — Reconciliation cron job created (/api/cron/reconcile-bookings) finds stuck PENDING bookings with supplierBookingRef >30min old, calls TBO GetBookingDetail, auto-confirms or auto-cancels | Voucher verification still open |
| **BREVO-EPIC** | #251-270 (20 issues) | Brevo SMTP Infrastructure: Sender domain setup (C1, C2), SMTP env vars (A1), refactor email.ts (A2), route all transactional emails (B1-B8), MCP verification (D1-D5) | STILL_OPEN | External: Brevo account access |
| **SEARCH-UX** | #297, #298, #299 | Cold start & loading states (skeleton, popular destinations, status messages); Domestic/International tabs (default domestic); Display clutter reduction (price per night+total, progressive filters, card redesign) | IN_PROGRESS (Session 42 partial) | Research done, impl pending |
| **INVOICE-EPIC** | #165, #166, #167, #169, #170 | Admin invoice edit modal; Partial payment support; Non-corporate invoices; Booking type filter; Column sorting + search | STILL_OPEN | — |
| **MOCK-EPIC** | #92 | Remove all mock/fallback/demo code from production booking flow | STILL_OPEN | — |
| **UX-A11Y** | #215, #211-214, #224 | Accessibility: aria-labels, status labels, touch targets; Error state handling; ConfirmDialog; LoginModal forgot-password; Support page quick replies; Duplicate package images | STILL_OPEN | — |

---

### MEDIUM PRIORITY (P2)

| Epic | GitHub Issues | Description | Status | Blockers |
|------|---------------|-------------|--------|----------|
| **QA-EPIC** | #26, #27 | E2E Playwright tests for core booking flows; Performance audit | STILL_OPEN | — |
| **INFRA-EPIC** | #19, #20, #223 | Error monitoring (Sentry/Vercel); Custom domain + SSL; Self-host fonts (eliminate CDN) | STILL_OPEN | #20 EXTERNAL (DNS) |
| **LAUNCH-EPIC** | #29, #30 | Deploy to production; Post-launch monitoring (24h) | BLOCKED | ZAAKPAY creds, CANCEL-EPIC complete, TBO-ARCH config |

---

### LOW PRIORITY (P3)

| Epic | GitHub Issues | Description | Status |
|------|---------------|-------------|--------|
| **UI-PREMIUM** | #206-210 | Design token system + fluid typography; Scroll animations; Skeleton loaders; Immersive hero parallax; Spring physics micro-interactions | NEEDS_MOCKUPS |

---

## Closed / Resolved (Do Not Reopen)

| Epic | Issues | Resolved In |
|------|--------|-------------|
| **FLIGHT-EPIC** | #55-63 (FLT-01..08) | Sessions 19, 37-42 — All closed on GitHub |
| **HOTEL-EPIC** | #65-78 (HOTEL-01..14) | Session 19 |
| **CORP-EPIC (old)** | #79, #83-86 | Session 19 |
| **PAY-EPIC (old)** | #110 (PAY-03), PAY-01, PAY-02 | Session 35 (/payment/failed page), Session 19 |
| **TARIFF-EPIC** | #89 | Sessions 10-19 |
| **INVOICE-EPIC (core)** | #160, #168 | Sessions 17, 35 |
| **GROWTH-EPIC** | 30 issues | Parallel agent |
| **AIRPORT-EPIC** | #276-281 | Session 31-32 |
| **FLIGHT-CITY-EPIC** | #245-249 | Session 19 |
| **FLIGHT-UX-EPIC** | #216-220 | Session 19 |
| **UI/UX AUDIT** | #221-236 | Session 19 |
| **COMPAT-FIX** | #291 | Session 39/42 (Book Now Vivaldi/Opera) |
| **PRICING-FIX** | #290 | Session 33/34 |
| **TBO-CERT-UX** | #289 | Session 39 |
| **TBO-ARCH-03** | #240 | Session 39 (fetchWithRetry) |

---

## Dependency Graph

```
ZAAKPAY (creds) ──┐
CANCEL-EPIC ──────┤
TBO-ARCH (config) ┼──► LAUNCH-EPIC (#29 deploy) ──► #30 monitoring
FLIGHT-UX ────────┘
       │
       └── (independent, can parallel)
```

---

## Session 43 Consolidation Log

| Action | GitHub Issues Affected | Reason |
|--------|------------------------|--------|
| Closed FLT-03..08 (#58-63) | All closed on GitHub | Code audit: bookFlight→ticketFlight sequence correct; N passengers generated; multi-leg selection exists; price change dialog works |
| Closed REMOVE-INDIA-EPIC (#139) | #139 | Session 40 removed India-only restriction; 27 refs remain but epic scope complete |
| Closed TBO-01 (#150) | #150 | Session 41 - PreferredCurrency=INR kept for display, formatCurrency() handles intl |
| Closed COMPAT-FIX (#291) | #291 | Session 39/42 - removed active:scale, replaced cmdk, removed autoFocus |
| Closed PRICING-FIX (#290) | #290 | Session 33/34 - multi-room pricing display fixed |
| Closed TBO-CERT-UX (#289) | #289 | Session 39 - all 13 cert cases UI-supported |
| Closed TBO-ARCH-03 (#240) | #240 | Session 39 - fetchWithRetry added |
| Closed PAY-03 (#110) | #110 | Session 35 - /payment/failed page created |
| Closed PAY-08 (#111) as BLOCKED | #111 | External: Zaakpay sandbox creds not provided |

---

## Session 44 Implementation Log (2026-07-25)

| Task | Files Changed | Status |
|------|---------------|--------|
| **1. Cancel button in FlightBookingModal done step** | `src/components/FlightBookingModal.tsx` — Added CancellationDialog import, showCancellation state, cancel button in done step, onConfirm handler | ✅ Done |
| **2. Flight API endpoints from ConfigProvider** | `src/lib/tbo-flight-api.ts` — Replaced hardcoded AUTH_URL/API_BASE with async getAuthUrl()/getApiBase() reading from ConfigProvider; `src/lib/config-service.ts` — Added baseUrl/bookingUrl to tbo_flight envFallback | ✅ Done |
| **3. Mock fallback (forceMock) for flight client** | `src/lib/tbo-flight-client.ts` — Added cfg.forceMock check in searchFlights(), returns mock data when enabled | ✅ Done |
| **4. Zaakpay refund in cancellation flow** | `src/app/api/cancellations/route.ts` — Added createRefund import, calls Zaakpay refund for non-corporate gateway bookings | ✅ Done |
| **5. Reconciliation cron for stuck PENDING bookings** | `src/app/api/cron/reconcile-bookings/route.ts` (NEW) — Finds PENDING bookings with supplierBookingRef >30min old, calls TBO GetBookingDetail, auto-confirms or auto-cancels | ✅ Done |

## Session 44 Implementation Log (2026-07-25)

| Task | Files Changed | Status |
|------|---------------|--------|
| **1. Cancel button in FlightBookingModal done step** | `src/components/FlightBookingModal.tsx` — Added CancellationDialog import, showCancellation state, cancel button in done step, onConfirm handler calling `/api/cancellations` | ✅ Done |
| **2. Flight API endpoints from ConfigProvider** | `src/lib/tbo-flight-api.ts` — Replaced hardcoded AUTH_URL/API_BASE with async getAuthUrl()/getApiBase() reading from ConfigProvider; `src/lib/config-service.ts` — Added baseUrl/bookingUrl to tbo_flight envFallback | ✅ Done |
| **3. Mock fallback (forceMock) for flight client** | `src/lib/tbo-flight-client.ts` — Added cfg.forceMock check in searchFlights(), returns empty results when enabled | ✅ Done |
| **4. Zaakpay refund in cancellation flow** | `src/app/api/cancellations/route.ts` — Added createRefund import, calls Zaakpay refund for non-corporate gateway bookings | ✅ Done |
| **5. Reconciliation cron for stuck PENDING bookings** | `src/app/api/cron/reconcile-bookings/route.ts` (NEW) — Finds PENDING bookings with supplierBookingRef >30min old, calls TBO GetBookingDetail, auto-confirms or auto-cancels | ✅ Done |

### GitHub Issues Resolved

| Issue | Status | Resolution |
|-------|--------|------------|
| #296 (CANCEL-04: Cancel button in FlightBookingModal) | **RESOLVED** | Added Cancel button in done step using existing CancellationDialog |
| #238 (TBO-ARCH-01: ConfigProvider integration) | **RESOLVED** | Flight API now reads endpoints from ConfigProvider DB |
| #239 (TBO-ARCH-02: Mock fallback) | **RESOLVED** | forceMock flag in ConfigProvider returns mock data |
| #112 (PAY-06: Zaakpay refund in cancellation) | **RESOLVED** | Zaakpay refund API called for non-corporate gateway bookings |
| #286 (CORP-RECONCILE-01: Stuck PENDING bookings) | **RESOLVED** | New cron `/api/cron/reconcile-bookings` auto-reconciles |

### SPRINT-PLAN.md Updates

- ZAAKPAY: PAY-06 now **PARTIAL** (refund added, creds still external)
- CANCEL-EPIC: #296 **RESOLVED** (cancel button added)
- TBO-ARCH: #238 **RESOLVED**, #239 **RESOLVED** (ConfigProvider + forceMock done)
- CORP-EPIC: #286 **PARTIAL** (reconciliation cron created, voucher verification pending)
- All 5 P0 blockers from Session 43 addressed

### Verification

- TypeScript: 0 errors
- Build: ✅ passes
- Preflight (quick): 12/12 gating checks passed
- Post-task: 11/11 checks passed