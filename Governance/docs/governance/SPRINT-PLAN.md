# GoRASA CockroachDB Standalone — Sprint Plan

> **Last updated:** 2026-07-17 (post-verification)
> **Current Sprint:** Sprint 4 — Production Readiness

---

## Sprint 4 — Remaining Issues (19 open)

### BLOCKERS (must fix before launch)

| # | Issue | Epic | Status |
|---|-------|------|--------|
| #110 | PAY-03: Missing /payment/failed page | PAY | STILL_OPEN |
| #111 | PAY-08: Missing Zaakpay credentials | PAY | BLOCKED (external) |
| #139 | REMOVE-INDIA-EPIC: 27 hardcoded IN/India/INR | INTL | STILL_OPEN |
| #150 | TBO-01: PreferredCurrency fallback to INR | TBO | STILL_OPEN |

### HIGH PRIORITY

| # | Issue | Epic | Status |
|---|-------|------|--------|
| #112 | PAY-06: Cancellation bypasses refund API | PAY | STILL_OPEN |
| #29 | LAUNCH-02: Deploy to production | LAUNCH | BLOCKED (needs above) |
| #30 | LAUNCH-03: Post-launch monitoring | LAUNCH | BLOCKED (post-deploy) |
| #26 | QA-01: E2E Playwright tests | QA | STILL_OPEN |
| #92 | MOCK-EPIC: Remove mock code (5 instances) | MOCK | STILL_OPEN |
| #165 | INV-05: Admin invoice edit modal | INVOICE | STILL_OPEN |

### MEDIUM PRIORITY

| # | Issue | Epic | Status |
|---|-------|------|--------|
| #19 | INFRA-02: Error monitoring (Sentry) | INFRA | STILL_OPEN |
| #20 | INFRA-03: Custom domain | INFRA | EXTERNAL (DNS) |
| #27 | QA-02: Performance audit | QA | STILL_OPEN |
| #123 | UX-EPIC: Home page polish | UX | NEEDS_MOCKUPS |
| #166 | INV-06: Partial payment support | INVOICE | STILL_OPEN |
| #167 | INV-07: Invoice for non-corporate | INVOICE | STILL_OPEN |

### LOW PRIORITY

| # | Issue | Epic | Status |
|---|-------|------|--------|
| #169 | INV-09: Booking type filter | INVOICE | STILL_OPEN |
| #170 | INV-10: Column sorting + search | INVOICE | STILL_OPEN |

---

## Completed This Session

| Issue | Verification |
|---|---|
| #28 LAUNCH-01 | Security headers in next.config.ts (5 headers) |
| #168 INV-08 | Overdue cron exists at api/cron/overdue-invoices |
| #89 TARIFF-EPIC | Corporate rate system exists |
| #101 Home page | HeroSection fully implemented |
| #24 User dashboard | Trips page serves as dashboard |
| #25 SEO meta tags | Comprehensive OG/Twitter/JSON-LD |
| #160 INVOICE-EPIC | PDF, cron, email, CSV all done |
| #46 Account creation | signUpWithEmail wired end-to-end |
| #47 Scroll on profile | LoginModal has max-h + overflow |
| #48 Markup visible | Removed disclosure text |
| #100 Hotel name search | Added search input |
| GROWTH-EPIC (30 issues) | All closed by parallel agent |

---

## Dependencies

```
#110 (failed page) ──┐
#112 (refund API) ───┤
#139 (India/INR) ────┼── #29 (deploy)
#150 (currency) ─────┘

#111 (creds) ── #29 (deploy) [external]
#29 (deploy) ── #30 (monitoring)
```
