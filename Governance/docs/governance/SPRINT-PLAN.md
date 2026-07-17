# GoRASA CockroachDB Standalone — Sprint Plan

> **Purpose:** Track sprint goals, priorities, and progress across all EPICs.
> **Last updated:** 2026-07-17 (Session 19)
> **Current Sprint:** Sprint 4 — Production Readiness

---

## Sprint Overview

| Sprint | Goal | Status |
|--------|------|--------|
| Sprint 1 | Security hardening | ✅ Complete |
| Sprint 2 | Core features + corporate | ✅ Complete |
| Sprint 3 | HOTEL + FLIGHT + PAY + UX EPICs | ✅ Complete |
| **Sprint 4** | **Production readiness — remaining EPICs** | 🔄 In Progress |

---

## Sprint 4 — Production Readiness

### Remaining Issues (30 open)

#### Blockers (must fix before launch)

| # | Issue | Epic | Priority | Status |
|---|-------|------|----------|--------|
| #110 | PAY-03: Missing /payment/failed page | PAY | critical | OPEN |
| #111 | PAY-08: Missing Zaakpay credentials | PAY | critical | BLOCKED (needs creds) |
| #28 | LAUNCH-01: Final security review | LAUNCH | critical | OPEN |
| #29 | LAUNCH-02: Deploy to production | LAUNCH | critical | OPEN |
| #139 | REMOVE-INDIA-EPIC: Remove hardcoded India/INR | INTL | critical | OPEN |
| #150 | TBO-01: PreferredCurrency hardcoded to INR | TBO | critical | OPEN |
| #161 | INV-01: Invoice PDF generation | INVOICE | critical | OPEN |

#### High Priority (should fix before launch)

| # | Issue | Epic | Priority | Status |
|---|-------|------|----------|--------|
| #112 | PAY-06: Cancellation bypasses refund API | PAY | high | OPEN |
| #30 | LAUNCH-03: Post-launch monitoring | LAUNCH | high | OPEN |
| #26 | QA-01: E2E booking flow test | QA | high | OPEN |
| #89 | TARIFF-EPIC: Special tariff pricing | TARIFF | high | OPEN |
| #92 | MOCK-EPIC: Remove mock code | MOCK | high | OPEN |
| #162 | INV-02: Auto-overdue cron job | INVOICE | critical | OPEN |
| #163 | INV-03: Invoice email template | INVOICE | critical | OPEN |
| #164 | INV-04: CSV export for admin invoices | INVOICE | high | OPEN |
| #165 | INV-05: Invoice detail/edit modal | INVOICE | high | OPEN |
| #101 | Home Page look and feel | UX | high | OPEN (needs mockups) |

#### Medium Priority (post-launch)

| # | Issue | Epic | Priority | Status |
|---|-------|------|----------|--------|
| #19 | INFRA-02: Error monitoring | INFRA | high | OPEN |
| #20 | INFRA-03: Custom domain | INFRA | medium | OPEN |
| #24 | UX-01: User dashboard | UX | medium | OPEN |
| #25 | UX-02: SEO meta tags | UX | medium | OPEN |
| #27 | QA-02: Performance audit | QA | medium | OPEN |
| #166 | INV-06: Partial payment support | INVOICE | medium | OPEN |
| #167 | INV-07: Invoice for non-corporate | INVOICE | medium | OPEN |
| #168 | INV-08: Overdue reminder email cron | INVOICE | medium | OPEN |

#### Low Priority (future)

| # | Issue | Epic | Priority | Status |
|---|-------|------|----------|--------|
| #169 | INV-09: Booking type filter | INVOICE | low | OPEN |
| #170 | INV-10: Column sorting + search | INVOICE | low | OPEN |

---

## Completed EPICs

| Epic | Issues | Completed |
|---|---|---|
| FLIGHT-EPIC | 8 issues | Session 19 |
| HOTEL-EPIC | 14 issues | Session 19 |
| CORP-EPIC | 5 issues | Session 19 |
| UX-EPIC | 5 issues (4 closed, 1 enriched) | Session 19 |
| INTL-EPIC | 25 issues | Session 19 |
| PAY-EPIC | 2 bugs fixed, 3 remaining | Session 19 |
| TBO-TAX-EPIC | 2 issues (already fixed) | Session 19 |
| SECURITY | 10 issues | Session 1-2 |

---

## Sprint 4 Task Breakdown

### Phase 1: Payment + Invoice (can start now)
- [ ] #110: Create /payment/failed page
- [ ] #112: Wire cancellations to processRefund()
- [ ] #161: Invoice PDF generation
- [ ] #162: Auto-overdue cron job
- [ ] #163: Invoice email template
- [ ] #164: CSV export

### Phase 2: India/INR Removal (can start now)
- [ ] #139: Remove all 128 hardcoded India/INR assumptions
- [ ] #150: Make PreferredCurrency dynamic

### Phase 3: Launch Prep (needs Phase 1+2)
- [ ] #28: Final security review
- [ ] #26: E2E Playwright tests
- [ ] #29: Production deployment
- [ ] #30: Post-launch monitoring

### Phase 4: Post-Launch (deferred)
- [ ] #19: Error monitoring (Sentry/LogRocket)
- [ ] #20: Custom domain
- [ ] #89: Special tariff pricing
- [ ] #92: Remove mock code
- [ ] #101: Home page redesign

---

## Dependencies

```
#110 (failed page) → #29 (deploy)
#112 (refund API) → #29 (deploy)
#139 (India/INR) → #29 (deploy)
#150 (currency) → #29 (deploy)
#161 (invoice PDF) → #163 (email template)
#28 (security review) → #29 (deploy)
#26 (E2E test) → #29 (deploy)
```

---

## Velocity Tracking

| Session | Issues Closed | Files Changed | Lines Changed |
|---------|---------------|---------------|---------------|
| Session 19 | 48 issues | 17 files | +851/-298 |
| Session 18 | 8 issues | 4 files | +120/-40 |
| Session 17 | 6 issues | 8 files | +200/-80 |

---

## Notes

- #111 (Zaakpay credentials) is blocked — needs sandbox account setup
- #101 (Home page) is blocked — needs design mockups from testers
- #92 (Mock-EPIC) is a large refactor — should be done after all other EPICs
- Invoice EPIC (#160-#170) was created by INTL agent — needs review
