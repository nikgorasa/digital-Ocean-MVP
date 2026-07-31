# GoRASA CockroachDB Standalone — EPIC/Issue Tracker

> **Title:** EPIC/Issue Tracker — Active Work Registry
> **Version:** 1.0.0
> **Last Updated:** 2026-08-01 (Session 50 — Hotels Search Regression + Cache Re-population + Calendar Fix)
> **Current Sprint:** Sprint 4 — Production Readiness
> **Maximum GitHub Issue Number:** 316 (new issues start from #317)
> **Source of Truth:** This file is the canonical registry of all epics and open GitHub issues. It MUST be updated before any PR/commit. No work can be committed if its EPIC/issue is not tracked here.
> **SPRINT-PLAN.md:** Condensed view (16 epics grouped by priority). This file is the full view (every open issue individually).

---

## Section A: Active Epics Registry

> All open (non-closed) epics. Status codes: **IN_PROGRESS** (code changes active), **STILL_OPEN** (no active work), **PARTIAL** (some issues done, some open), **BLOCKED** (external dependency blocking progress).

| Epic ID | Epic Name | GitHub Label | Total Issues | Open | In Progress | Closed | Owner (Session) | Created | Status | GitHub URL |
|---------|-----------|-------------|-------------|------|-------------|--------|-----------------|---------|--------|-----------|
| ZAAKPAY-EPIC | Payment gateway — Zaakpay production readiness | `epic:payment` | 6 | 2 | — | 4 | Session 44 | 2026-07-16 | PARTIAL | [ZAAKPAY-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/109) |
| CANCEL-EPIC | Real TBO cancellation flow — flights + hotels | *(none)* | 5 | 5 | — | 0 | Session 44 | 2026-07-24 | IN_PROGRESS | [CANCEL-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/292) |
| TBO-ARCH-EPIC | TBO API architecture — resilience, config, mock fallback | `epic:tbo-architecture` | 8 | 7 | — | 1 | Session 44 | 2026-07-17 | PARTIAL | [TBO-ARCH-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/237) |
| FLIGHT-UX-EPIC | Flight search UX — premium economy, cabin class filter | `epic:flight-ux` | 2 | 2 | — | 0 | Session 44 | 2026-07-11 | STILL_OPEN | [FLIGHT-UX-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/102) |
| CORP-EPIC | Corporate booking — stuck PENDING reconciliation, voucher verification | `epic:corporate` | 2 | 2 | — | 0 | Session 44 | 2026-07-22 | PARTIAL | [CORP-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/286) |
| BREVO-EPIC | Brevo SMTP / Transactional emails migration | `epic:infra` | 20 | 20 | — | 0 | Session 44 | 2026-07-17 | STILL_OPEN | [BREVO-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/251) |
| SEARCH-UX-EPIC | Search UX — cold start, domestic/intl tabs, display clutter | `epic` | 3 | 3 | — | 0 | Session 44 | 2026-07-24 | IN_PROGRESS | [SEARCH-UX-EPIC-1](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/297) |
| INVOICE-EPIC | Admin invoice — edit modal, partial payment, non-corporate | `epic:invoice` | 5 | 5 | — | 0 | Session 44 | 2026-07-17 | STILL_OPEN | [INVOICE-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/165) |
| MOCK-EPIC | Remove all mock/fallback/demo code from production booking | *(none)* | 1 | 1 | — | 0 | Session 44 | 2026-07-09 | STILL_OPEN | [MOCK-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/92) |
| UX-A11Y-EPIC | UX/Accessibility — aria-labels, error states, ConfirmDialog | `epic:ux` | 6 | 6 | — | 0 | Session 44 | 2026-07-17 | STILL_OPEN | [UX-A11Y-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/211) |
| TBO-CERT-EPIC | TBO certification UX fixes (see closed #289) | *(closed)* | 0 | 0 | — | 1 | Session 44 | 2026-07-24 | CLOSED | [TBO-CERT-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/289) |
| INTL-EPIC | Remove India-only assumptions — global platform (see closed #139) | *(closed)* | 0 | 0 | — | 1 | Session 44 | 2026-07-16 | CLOSED | [INTL-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/139) |
| PRICING-EPIC | Pricing module work | *(NEW — no GitHub label yet)* | 0 | 0 | — | 0 | Session 44 | 2026-07-25 | STILL_OPEN | *(no GitHub issue — create before work starts)* |
| QA-EPIC | Quality assurance — E2E tests, performance audit | `epic:qa` | 2 | 2 | — | 0 | Session 44 | 2026-07-02 | STILL_OPEN | [QA-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/26) |
| INFRA-EPIC | Production infrastructure — monitoring, DNS, fonts | `epic:infra` | 3 | 3 | — | 0 | Session 44 | 2026-07-02 | STILL_OPEN | [INFRA-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/19) |
| LAUNCH-EPIC | Go-live — deploy to production, 24h monitoring | `epic:launch` | 2 | 2 | — | 0 | Session 44 | 2026-07-02 | BLOCKED | [LAUNCH-EPIC](https://github.com/Gorasa-In-2026/Gorasa-Cockroach/issues/29) |

---

## Section B: Open Issues Detail Table

> ALL open GitHub issues. Sorted by number ascending. Exact titles from GitHub. New issues #300+ will be added here when created.

| # | Title | Epic | Priority | Status | Blocked By | Last Updated | Last Session |
|---|-------|------|----------|--------|-----------|-------------|-------------|
| 19 | INFRA-02: Set up error monitoring and logging | INFRA-EPIC | high | STILL_OPEN | — | 2026-07-02 | Session 44 |
| 20 | INFRA-03: Configure custom domain and SSL | INFRA-EPIC | medium | STILL_OPEN | External: DNS | 2026-07-02 | Session 44 |
| 26 | QA-01: End-to-end booking flow test | QA-EPIC | high | STILL_OPEN | — | 2026-07-22 | Session 44 |
| 27 | QA-02: Performance audit and optimization | QA-EPIC | medium | STILL_OPEN | — | 2026-07-02 | Session 44 |
| 29 | LAUNCH-02: Deploy to production | LAUNCH-EPIC | critical | BLOCKED | ZAAKPAY creds, CANCEL-EPIC complete, TBO-ARCH config | 2026-07-02 | Session 44 |
| 30 | LAUNCH-03: Post-launch monitoring (24h) | LAUNCH-EPIC | high | BLOCKED | LAUNCH-02 | 2026-07-02 | Session 44 |
| 92 | MOCK-EPIC: Remove all mock/fallback/demo code from production booking flow | MOCK-EPIC | high | STILL_OPEN | — | 2026-07-22 | Session 44 |
| 102 | Getting Premium economy rates/label when searched for economy class | FLIGHT-UX-EPIC | — | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 109 | PAY-EPIC: Payment gateway — mock/simulation audit, fixes, and production readiness | ZAAKPAY-EPIC | critical | PARTIAL | — | 2026-07-22 | Session 44 |
| 112 | PAY-06: Cancellation bypasses Zaakpay refund API — uses calculateMockRefund instead | ZAAKPAY-EPIC | high | PARTIAL | — | 2026-07-16 | Session 44 |
| 123 | UX-EPIC: User experience, search, and UI polish — post-launch gaps | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 165 | INV-05: Invoice detail/edit modal for admin | INVOICE-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 166 | INV-06: Partial payment support | INVOICE-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 167 | INV-07: Invoice creation for non-corporate bookings | INVOICE-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 169 | INV-09: Booking type filter in admin invoices | INVOICE-EPIC | low | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 170 | INV-10: Column sorting and invoice search | INVOICE-EPIC | low | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 206 | UI-PREMIUM-01: Design token system + fluid typography | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 207 | UI-PREMIUM-02: Scroll animation system (FadeIn, StaggerContainer) | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 208 | UI-PREMIUM-03: Skeleton loaders for search results | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 209 | UI-PREMIUM-04: Immersive hero section with parallax | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 210 | UI-PREMIUM-05: Spring physics micro-interactions | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 211 | UX-ERR-01: Error state handling — trips, profile, admin dashboard | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 212 | UX-ERR-02: ConfirmDialog replacing alert()/window.confirm() | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 213 | UX-ERR-03: LoginModal forgot-password UX fix | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 214 | UX-ERR-04: Support page fallback quick replies | UX-A11Y-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 215 | UX-A11Y-01: Accessibility improvements — aria-labels, status labels, touch targets | UX-A11Y-EPIC | high | STILL_OPEN | — | 2026-07-23 | Session 44 |
| 219 | FLIGHT-UX-03: Filter results by requested cabin class | FLIGHT-UX-EPIC | high | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 223 | [P0] Self-host fonts to eliminate CDN dependency | INFRA-EPIC | — | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 224 | [P1] Replace duplicate package images with unique photos per tier | UX-A11Y-EPIC | — | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 237 | TBO-ARCH-EPIC: TBO API architecture — resilience, config, mock fallback, error handling | TBO-ARCH-EPIC | critical | PARTIAL | — | 2026-07-23 | Session 44 |
| 238 | TBO-ARCH-01: Flight API ConfigProvider integration (DB-configurable endpoints) | TBO-ARCH-EPIC | critical | PARTIAL | — | 2026-07-17 | Session 44 |
| 239 | TBO-ARCH-02: Mock fallback when TBO returns no results or errors | TBO-ARCH-EPIC | critical | PARTIAL | — | 2026-07-17 | Session 44 |
| 241 | TBO-ARCH-04: Graceful error handling — never show raw TBO errors to users | TBO-ARCH-EPIC | high | PARTIAL | — | 2026-07-17 | Session 44 |
| 242 | TBO-ARCH-05: Flight API endpoint configuration via env vars (not hardcoded) | TBO-ARCH-EPIC | high | PARTIAL | — | 2026-07-17 | Session 44 |
| 243 | TBO-ARCH-06: API response caching for repeated searches | TBO-ARCH-EPIC | medium | PARTIAL | — | 2026-07-21 | Session 44 |
| 244 | TBO-ARCH-07: Admin API health check / test connection for flights | TBO-ARCH-EPIC | medium | PARTIAL | — | 2026-07-17 | Session 44 |
| 251 | EPIC: Brevo SMTP Infrastructure | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 252 | EPIC: Migrate Transactional Emails to Brevo | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 253 | EPIC: Brevo Sender Domain & List Setup | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 254 | EPIC: Verify Email Setup via Brevo MCP | BREVO-EPIC | medium | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 255 | A1: Add Brevo SMTP env vars to .env.local + .env.production | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 256 | A2: Refactor email.ts to read Brevo SMTP config (remove Gmail default) | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 257 | A3: Enforce verified Brevo sender for from-address | BREVO-EPIC | medium | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 258 | A4: Remove or wire dead verifyEmailConnection() | BREVO-EPIC | low | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 259 | A5 (optional): Replace nodemailer with @getbrevo/brevo Transactional API | BREVO-EPIC | low | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 260 | B1: Route auth.ts password reset email through Brevo | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 261 | B2: Route auth.ts email verification through Brevo | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 262 | B3: Route booking confirmation (payment-service) through Brevo | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-22 | Session 44 |
| 263 | B4: Route corporate invoice email through Brevo | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-22 | Session 44 |
| 264 | B5: Route payment reminder (expire-bookings cron) through Brevo | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 265 | B6: Route booking cancellation email through Brevo | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-22 | Session 44 |
| 266 | B7: Resolve orphan invoiceOverdue template | BREVO-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 267 | B8: Make email template links env-driven (NEXT_PUBLIC_APP_URL) | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 268 | C1: Verify sending domain (SPF + DKIM) in Brevo | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 269 | C2: Create & validate Brevo Sender identity | BREVO-EPIC | high | STILL_OPEN | External: Brevo account | 2026-07-17 | Session 44 |
| 270 | C3 (Future): Brevo Lists + Contacts for marketing | BREVO-EPIC | low | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 271 | D1: Activate brevo MCP (restart opencode, confirm token) | BREVO-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 272 | D2: Verify Brevo sender domains via MCP | BREVO-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 273 | D3: Verify Brevo sender identities via MCP | BREVO-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 274 | D4: Confirm/import transactional templates via MCP | BREVO-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 275 | D5: End-to-end test send + delivery confirmation via MCP | BREVO-EPIC | medium | STILL_OPEN | — | 2026-07-17 | Session 44 |
| 286 | CORP-RECONCILE-01: Stuck PENDING bookings when TBO reservation succeeds but checkout fails | CORP-EPIC | high | PARTIAL | — | 2026-07-22 | Session 44 |
| 287 | CORP-VERIFY-01: Automated TBO voucher verification after booking | CORP-EPIC | high | PARTIAL | — | 2026-07-22 | Session 44 |
| 288 | Remove Demo Mode entirely | *(none)* | — | STILL_OPEN | — | 2026-07-22 | Session 44 |
| 292 | CANCEL-EPIC: Real TBO cancellation flow — flights + hotels | CANCEL-EPIC | critical | IN_PROGRESS | — | 2026-07-24 | Session 44 |
| 293 | CANCEL-01: Wire flight cancel into /api/cancellations route | CANCEL-EPIC | critical | IN_PROGRESS | — | 2026-07-24 | Session 44 |
| 294 | CANCEL-02: Replace calculateMockRefund with real TBO charges | CANCEL-EPIC | critical | IN_PROGRESS | — | 2026-07-24 | Session 44 |
| 295 | CANCEL-03: Build styled cancellation dialog with real charges | CANCEL-EPIC | high | IN_PROGRESS | — | 2026-07-24 | Session 44 |
| 296 | CANCEL-04: Add cancel button to FlightBookingModal | CANCEL-EPIC | high | IN_PROGRESS | — | 2026-07-24 | Session 44 |
| 297 | SEARCH-UX-EPIC-1: Cold Start & Loading States (P0) | SEARCH-UX-EPIC | high | IN_PROGRESS | — | 2026-07-24 | Session 44 |
| 298 | SEARCH-UX-EPIC-2: Domestic/International Separation (P0) | SEARCH-UX-EPIC | high | IN_PROGRESS | — | 2026-07-24 | Session 44 |
| 299 | SEARCH-UX-EPIC-3: Display Clutter Reduction (P0) | SEARCH-UX-EPIC | high | IN_PROGRESS | — | 2026-07-24 | Session 44 |
| 300 | UI-POLISH-01: Session-gated responsive splash, viewport meta, booking modal alignment, emoji planner + chat | UX-A11Y-EPIC | high | IN_PROGRESS | — | 2026-07-31 | Session 45 |
| 301 | RETURN-FLIGHT-UX: Return flight selection UX — step indicator, leg tabs, price preview, mobile bottom sheet, micro-interactions | SEARCH-UX-EPIC | high | DONE | — | 2026-08-01 | Session 47 |
| 316 | HOTELS-SEARCH-FIX: Hotels search broken (stale city codes + dropped PROD static cache) + calendar last-row clipping | TBO-ARCH-EPIC | high | IN_PROGRESS | — | 2026-08-01 | Session 50 |

**Total open issues: 74**
**Highest open issue number: 316**
**Next new issue number: #302**

---

## Section C: Recently Closed Issues (Sessions 40–44)

> Issues closed in the last 5 sessions as referenced in SPRINT-PLAN.md. Audit history — do not reopen without explicit approval.

| # | Title | Close Date | Session | Notes |
|---|-------|-----------|---------|-------|
| 139 | REMOVE-INDIA-EPIC: Remove all 128 hardcoded India/INR assumptions — make platform global | 2026-07-16 | Session 40 | India-only restriction removed |
| 150 | TBO-01 | 2026-07-16 | Session 41 | PreferredCurrency=INR kept for display, formatCurrency() handles intl |
| 240 | TBO-ARCH-03: Retry logic with exponential backoff for transient failures | 2026-07-25 | Session 44 | fetchWithRetry added |
| 250 | FLT: Search results pricing not multiplied by passenger count | 2026-07-23 | Session 43 | |
| 276 | EPIC: Airport Data — Replace Hardcoded List with DB-Backed Airport Registry | 2026-07-20 | Session 42 | |
| 277 | AIRPORT-01: Schema — Add airport columns to City model | 2026-07-20 | Session 42 | |
| 278 | AIRPORT-02: Seed — Airport data download + DB upsert script | 2026-07-20 | Session 42 | |
| 279 | AIRPORT-03: API — New /api/cities/airports endpoint | 2026-07-20 | Session 42 | |
| 280 | AIRPORT-04: Component — CitySearchDropdown fetches from API | 2026-07-20 | Session 42 | |
| 281 | AIRPORT-05: Preflight — Airport count validation check | 2026-07-20 | Session 42 | |
| 282 | PERF-01: Hotel search result caching + lazy image loading | 2026-07-20 | Session 42 | |
| 283 | UI-01: Fix light color scheme — text-brand-sand WCAG contrast failure | 2026-07-20 | Session 42 | |
| 284 | HOTEL-PRICING-01: Room Fare multiplied by nights when roomFare is already stay total | 2026-07-23 | Session 43 | |
| 285 | HOTEL-PRICING-02: Card per-night price doesn't match modal per-night price | 2026-07-23 | Session 43 | |
| 289 | TBO-CERT-UX: Fix all UX issues for TBO certification (8 critical gaps) | 2026-07-23 | Session 43 | All 13 cert cases UI-supported |
| 290 | PRICING-FIX: Multi-room pricing display and calculation fixes | 2026-07-25 | Session 44 | multi-room pricing display fixed |
| 291 | COMPAT-FIX: Opera/Vivaldi browser compatibility fixes | 2026-07-25 | Session 44 | Removed active:scale, replaced cmdk, removed autoFocus. REGRESSION fixed 2026-07-31: added pointer-events (Issue 018) |

---

## Section D: Missing EPIC/Issue Detection — Pre-Commit Checklist

> **This checklist MUST be completed before any code commit.** All items must pass.

- [x] **1. Every code change maps to at least one open GitHub issue** — No untracked work committed (Issue #316)
- [x] **2. Every open GitHub issue is listed in Section B** — No missing issues in the registry
- [x] **3. Every active epic has at least one open issue** — No empty epics
- [x] **4. No duplicates** — Same work tracked in multiple issues must be merged, not duplicated
- [x] **5. All closed issues in the current session are recorded in Section C** — Audit trail maintained
- [x] **6. Issue status matches code state** — DONE = closed on GitHub; IN_PROGRESS = code changes in progress; STILL_OPEN = no active work

---

## Section E: Session Update Log

> Records every session that updates this file. Required for audit trail.

| Session | Date | Issues Added | Issues Closed | Epics Created | Epics Closed | Updated By |
|---------|------|-------------|---------------|---------------|--------------|-----------|
| 50 | 2026-08-01 | 1 (#316) | 0 | — | — | Agent (Hotels Search Regression + Cache + Calendar Fix) |
| 49 | 2026-08-01 | 1 (#301) | 0 | — | — | Agent (Return Flight UX P0+P1+P2) |
| 48 | 2026-07-31 | 0 | 0 | — | — | General agent |
| 47 | 2026-07-31 | 0 | 0 | — | — | General agent |
| 46 | 2026-07-31 | 0 | 0 | — | — | General agent |
| 44 | 2026-07-25 | 5 (#292–296, #297–299) | 4 (#240, #290, #291, #139 ref) | SEARCH-UX-EPIC, PRICING-EPIC | — | General agent |
| 43 | 2026-07-23 | 0 | 7 (#250, #276–281, #284–285, #289) | — | — | General agent |
| 42 | 2026-07-20 | 0 | 9 (#277–283) | — | — | General agent |
| 41 | 2026-07-17 | 0 | 1 (#150) | — | — | General agent |
| 40 | 2026-07-16 | 0 | 1 (#139) | — | — | General agent |

---

## Section F: Enforcement Rules

> These rules apply to all agents (human and AI). Violation = commit rejected.

1. **No code can be committed without updating this file.** Every commit must reference at least one open issue from Section B.
2. **New work must have a GitHub issue before code starts.** Create the issue first, then link it in Section B before writing any code.
3. **Closing an issue MUST be accompanied by a session log entry.** Add the closed issue to Section C and update Section E in the same session.
4. **Duplicate issues must be merged, not created.** Before creating a new issue, search Section B for existing coverage. If work is tracked in multiple issues, merge them and close duplicates.
5. **SPRINT-PLAN.md is the condensed view; this file is the full view.** SPRINT-PLAN.md groups epics by priority. This file lists every issue individually. Both must stay in sync.
6. **Maximum issue number is 299 until next session.** Any new issues created after this session will start from #300. Verify the number before creating.
7. **Epic labels must match GitHub.** When tagging an issue with an epic label, confirm the label exists on GitHub (e.g., `epic:payment`, `epic:corporate`). Do not invent new labels without creating them on GitHub first.
8. **PRICING-EPIC requires a GitHub issue before any work.** This epic has no GitHub issue yet. Create one before implementing any pricing module changes.

---

*This file is maintained by the `general` planning agent. Update it at the start and end of every session. Do not delete historical entries.*
