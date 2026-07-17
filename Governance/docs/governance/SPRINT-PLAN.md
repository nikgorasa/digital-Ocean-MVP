# GoRASA CockroachDB Standalone — Sprint Plan

> **Purpose:** Track sprint goals, priorities, and progress across all EPICs.
> **Last updated:** 2026-07-17 (Session 19 — post-verification)
> **Current Sprint:** Sprint 4 — Production Readiness

---

## Sprint Overview

| Sprint | Goal | Status |
|--------|------|--------|
| Sprint 1 | Security hardening | ✅ Complete (10/10) |
| Sprint 2 | Core features + corporate | ✅ Complete |
| Sprint 3 | HOTEL + FLIGHT + PAY + UX + INTL EPICs | ✅ Complete (48 issues) |
| **Sprint 4** | **Production readiness** | 🔄 In Progress |

---

## Sprint 4 — Remaining Issues (21 open)

### BLOCKERS (must fix before launch)

| # | Issue | Epic | Priority | Status |
|---|-------|------|----------|--------|
| #110 | PAY-03: Missing /payment/failed page | PAY | critical | STILL_OPEN |
| #111 | PAY-08: Missing Zaakpay credentials | PAY | critical | BLOCKED (needs creds) |
| #139 | REMOVE-INDIA-EPIC: 79 hardcoded IN/India/INR in prod code | INTL | critical | STILL_OPEN |
| #150 | TBO-01: PreferredCurrency fallback to INR | TBO | critical | STILL_OPEN |
| #28 | LAUNCH-01: Security headers + rate limiting | LAUNCH | critical | PARTIALLY_DONE (auth done, headers missing) |

### HIGH PRIORITY (should fix before launch)

| # | Issue | Epic | Priority | Status |
|---|-------|------|----------|--------|
| #112 | PAY-06: Cancellation bypasses refund API | PAY | high | STILL_OPEN |
| #29 | LAUNCH-02: Deploy to production | LAUNCH | critical | BLOCKED (needs above fixes) |
| #30 | LAUNCH-03: Post-launch monitoring | LAUNCH | high | BLOCKED (post-deploy) |
| #26 | QA-01: E2E Playwright tests | QA | high | STILL_OPEN (0 test files) |
| #92 | MOCK-EPIC: Remove mock code (24 matches) | MOCK | high | STILL_OPEN |
| #165 | INV-05: Admin invoice edit modal | INVOICE | high | PARTIALLY_DONE |

### MEDIUM PRIORITY (post-launch)

| # | Issue | Epic | Priority | Status |
|---|-------|------|----------|--------|
| #19 | INFRA-02: Error monitoring (Sentry) | INFRA | high | STILL_OPEN |
| #20 | INFRA-03: Custom domain | INFRA | medium | EXTERNAL (DNS) |
| #27 | QA-02: Performance audit | QA | medium | STILL_OPEN |
| #123 | UX-EPIC: Home page polish | UX | high | NEEDS_MOCKUPS |
| #166 | INV-06: Partial payment support | INVOICE | medium | STILL_OPEN |
| #167 | INV-07: Invoice for non-corporate | INVOICE | medium | STILL_OPEN |
| #168 | INV-08: Overdue reminder email cron | INVOICE | medium | STILL_OPEN |

### LOW PRIORITY (future)

| # | Issue | Epic | Priority | Status |
|---|-------|------|----------|--------|
| #169 | INV-09: Booking type filter | INVOICE | low | STILL_OPEN |
| #170 | INV-10: Column sorting + search | INVOICE | low | STILL_OPEN |

---

## Completed This Session (verified + closed)

| Issue | Title | Verification |
|---|---|---|
| #46 | Account Creation | Already fixed — signUpWithEmail wired end-to-end |
| #47 | Scroll on profile | Already fixed — LoginModal has max-h + overflow |
| #48 | Markup visible | Fixed — removed disclosure text |
| #100 | Hotel name search | Fixed — added search input |
| #101 | Home page look and feel | Already done — HeroSection complete |
| #24 | User dashboard | Already done — Trips page serves as dashboard |
| #25 | SEO meta tags | Already done — comprehensive OG/Twitter/JSON-LD |
| #89 | TARIFF-EPIC | Already done — corporateRate system |
| #160 | INVOICE-EPIC | Already done — PDF, cron, email, CSV |
| #31 | EPIC TRACKER | Superseded by SPRINT-PLAN.md |

---

## Dependencies

```
#110 (failed page) ──┐
#112 (refund API) ───┤
#139 (India/INR) ────┼── #29 (deploy to production)
#150 (currency) ─────┤
#28 (security) ──────┘

#29 (deploy) ── #30 (monitoring)
#111 (creds) ── #29 (deploy) [external blocker]
```

---

## Velocity

| Session | Issues Closed | Files Changed | Lines |
|---------|---------------|---------------|-------|
| 19 | 58 issues | 17 files | +851/-298 |
| 18 | 8 issues | 4 files | +120/-40 |

---

## Notes

- #111 (Zaakpay credentials) is external — needs sandbox account
- #123 (Home page) is blocked — needs design mockups from testers
- #92 (Mock removal) is large refactor — do after other EPICs
- #139 (India/INR) has 112 instances total, 79 in production code
- #28 (Security) — auth middleware done, security headers + rate limiting missing
