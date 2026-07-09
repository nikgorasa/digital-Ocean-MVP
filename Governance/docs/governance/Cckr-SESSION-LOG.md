# GoRASA CockroachDB Standalone — SESSION-LOG

> **Purpose:** Living document tracking all sessions, changes, deployments, and learnings.
> **Last updated:** 2026-07-09 (Session 12 — Logo/favicon replacement)

---

## Current State

| Item | Value |
|------|-------|
| **Database** | CockroachDB Basic (two isolated clusters: DEV + PROD) |
| **Auth** | Better Auth |
| **ORM** | Prisma (`postgresql` provider) |
| **DEV URL** | https://cckr.vercel.app |
| **PROD URL** | https://project-yidb6.vercel.app |
| **GitHub** | https://github.com/Gorasa-In-2026/Gorasa-Cockroach |
| **Tables** | 32 |
| **FK Constraints** | 14 |

---

## Two Isolated Database Environments

| Environment | Env File | Vercel Project | Purpose |
|---|---|---|---|
| **DEV** | `.env.local` | `cckr` | Local dev + staging |
| **PROD** | `.env.production` | `cckr2` | Production data |

Each environment connects to a **different CockroachDB cluster**. Zero shared data.

---

## Sessions

### Session 2026-07-03 (Session 9) — TARIFF-01/02/03: hotelCode Pricing Rules + Seed

**Objective:** Implement 3 GitHub issues for the Special Tariff system — hotelCode-based pricing rule matching, real TBO Delhi hotel codes, 7% flat markup.

**TARIFF-01 — hotelCode field + matching logic:**
- Added `hotelCode String?` field to PricingRule Prisma schema with `@map("hotelCode")`
- Added `hotelCode?: string` to `PricingContext` interface in `types.ts`
- Updated `matchesRule()` in `pricing-service.ts` — hotelCode match takes priority; hotelName only checked when hotelCode absent
- Updated `tbo-hotel-client.ts` to pass `h.HotelCode` into pricing context
- Updated POST `/api/pricing-rules` and PATCH `/api/pricing-rules/[id]` to accept hotelCode
- Updated admin UI (`page.tsx` + `pricing-rules-page.tsx`): form fields, display badges, edit/view modals

**TARIFF-02 — Seed 7 real Delhi hotel codes:**
- Built script to fetch real hotel codes from TBO static API via Delhi city lookup (country → city → hotel code list → search)
- Authenticated via Basic Auth against both static (`TBOStaticAPITest`) and search (`RasaT`) endpoints
- Extracted top 7 cheapest Delhi hotels with availability
- Created `scripts/seed-pricing-rules.ts` — upserts 7 rules with 7% flat PERCENT markup, priority 100, category ALL
- Applied `hotelCode` column via direct SQL to DEV + PROD
- Ran seed against DEV + PROD

**TARIFF-03 — Verification:**
- TypeScript: 0 errors. Build: clean. Post-task: 9/9. Pre-flight: 13/13.

**Seed hotels (Delhi NCR):**

| Hotel Code | Hotel Name | Markup |
|---|---|---|
| 1031455 | Midtown Hotel | 7% |
| 1031524 | Hotel Delhi 37 | 7% |
| 1031428 | Jukaso Inn Down Town | 7% |
| 1014919 | Hotel Africa Avenue G K 1 | 7% |
| 1016775 | Park Ascent | 7% |
| 1016351 | Eros Hotel New Delhi by IHG | 7% |
| 1031465 | Majestic Palace | 7% |

**Files changed:** 9 files + 1 new script
**Verification:** TypeScript 0 errors, Build clean, Post-task 9/9
**Commit:** `dbc8c65`

---

### Session 2026-07-08 (Session 11) — Admin bookings page + auth session fix

**Objective:** Build admin bookings page with search/filters/pagination/detail modal, fix auth session resolution on Vercel.

**Changes:**

**Admin bookings page:**
- Built `src/app/admin/bookings/page.tsx` (579 lines) — search by PNR/name/email, status/type/payment status filters, paginated table, detail modal, stats cards
- Built `src/app/api/admin/bookings/route.ts` (62 lines) — paginated query with filters
- Added `findAllPaginated()` and `aggregateRevenue()` to `src/lib/db/bookings.ts`
- Inserted NavigationItem: `/admin/bookings`, Ticket icon, sortorder 8, admin section

**Auth session fix (BLOCKER resolved):**
- Root cause: `BETTER_AUTH_URL` Vercel project env var was not set, so `baseURL` in `src/lib/auth.ts` fell through to the `.env.production` value `https://project-yidb6.vercel.app` — cookies set with that domain were not sent to `cckr.vercel.app`
- Fix: Set Vercel project env var `BETTER_AUTH_URL=https://cckr.vercel.app` (Production)
- After redeploy (`--force` to bypass cache), `auth.api.getSession()` returns valid sessions, `/api/auth/me` and `/api/admin/bookings` both work
- Verified via debug endpoint: session resolves with admin user (Priya Sharma, role: ADMIN)

**Files changed:** 4 source files + debug endpoint (removed after diagnosis)

**Verification:**
- `auth.api.getSession()` returns valid session with `BETTER_AUTH_URL=https://cckr.vercel.app` ✅
- `/api/auth/me` returns admin user data ✅
- `/api/admin/bookings` returns 19 bookings with pagination and stats ✅
- TypeScript: 0 errors. Build: clean. Post-task: 9/9.

**Commits:** `2d208b6`, `1533a0f`, `15487a2`

---

### Session 2026-07-08 (Session 10) — Deploy TARIFF-01/02/03 to CCKR + Git push & cleanup

**Objective:** Push all changes to GitHub, deploy to CCKR DEV (cckr.vercel.app), clean up stale branches.

**Actions:**
- Pushed all branches (including stale `master` — immediately deleted from remote + local)
- Deployed to CCKR via `vercel deploy --prod --yes`
- Build succeeded (47s, compiled successfully, TypeScript 0 errors)
- Site aliased to `https://cckr.vercel.app`
- TARIFF-01/02/03 (commit `dbc8c65`) now live on CCKR

**Deployment details:**
- **Deployment ID:** `dpl_45h9jd3RTpPARCuZ64WJt7tWKPtR`
- **Inspector:** https://vercel.com/nikhil-gorasa-s-projects/cckr/45h9jd3RTpPARCuZ64WJt7tWKPtR
- **Next.js:** 16.2.7 (Turbopack)
- **Prisma:** Generated v6.19.3

**Post-task:** 9/9 passed
**Pre-flight:** 13/13 passed (prior to deploy)

**Go-Live Readiness Check (from assessment):**
- SEC-01 through SEC-10: All verified ✅
- TARIFF-01/02/03: Deployed ✅
- Corporate flow: All 7 issues closed ✅
- CASH-01/02 (#39, #40): BLOCKER — not started
- LAUNCH-01 (#28): BLOCKER — depends on Cashfree
- QA-01 (#26): HIGH — no E2E tests
- UX-01/UX-02 (#24, #25): HIGH — no dashboard or SEO

---

### Session 2026-07-03 (Session 8) — Corporate Booking Flow + Email Notifications

**Objective:** Implement corporate credit-based booking (wallet, invoices, TBO direct booking), wire email notifications, enable Better Auth email verification + password reset.

**Changes:**

**Email Notifications (wired into booking flow):**
- Booking confirmation email sent after Razorpay/PhonePe webhook confirms payment
- Payment reminder sent for bookings expiring in next 12 hours (cron)
- Cancellation email sent when user cancels booking
- Better Auth email verification enabled (sendOnSignUp)
- Better Auth password reset enabled (sendResetPassword)
- Added Forgot Password link to login modal

**Corporate Booking Flow — Phase 1 (Data Model):**
- Enhanced Invoice model: companyId, amount, taxAmount, totalAmount, status, dueDate, paidAt, paidAmount, paymentRef, notes
- Created WalletLedger table for transaction history
- Added paymentMethod, companyId, corporateDiscount to Booking
- Added creditLimit to Company
- Applied to DEV + PROD via direct SQL

**Corporate Booking Flow — Phase 2 (API + Checkout):**
- Added requireAdmin() to all companies routes (GET, POST, PATCH, DELETE)
- Created /api/wallet/ledger — paginated wallet transaction history
- Created /api/wallet/topup — atomic wallet top-up with ledger entry
- Corporate checkout: detects user.companyId, applies CorporateRate discount, checks wallet balance, atomic transaction (deduct + ledger + confirm + payment + invoice), invoice due date +45 days
- Invoice APIs: GET /api/invoices (paginated, filtered), GET /api/invoices/stats (aggregated), PATCH /api/invoices/[id] (mark paid)

**Corporate Booking Flow — Phase 3 (UI):**
- HotelBookingModal: detects companyId, shows corporate summary instead of payment gateway
- FlightBookingModal: same corporate checkout flow
- Confirmation shows invoice number, corporate discount, remaining wallet credit
- Trips page: "Charged to Company" badge, corporate info banner in booking details
- Admin invoices page at /admin/invoices: date range filtering, stats cards, company breakdown, invoice table, mark-paid action, pagination

**Corporate Booking Flow — Phase 4 (Cancellation):**
- Corporate cancellation refund goes back to company wallet (atomic transaction with WalletLedger entry)
- Associated invoice auto-cancelled

**Files changed:** 55+ files across 8 commits
**Verification:** TypeScript 0 errors, Build clean, Post-task 9/9
**Deployment:** DEV + PROD live

**Next steps:**
- CORE-01: Wire real payment gateway (needs merchant credentials)
- QA-01: E2E test setup
- INFRA-02/03: Error monitoring, custom domain

---

### Session 2026-06-25 (Session 5) — Session Log Review + Governance Compliance Correction

**Objective:** User asked "What did we do so far?" to verify session context retention. Agent correctly answered from session log but then unnecessarily re-ran already-completed TBO booking tests (waste of API calls + time). User directed agent to document via gorasa-governance.

**What happened:**
- Agent answered the question correctly from existing session log context
- Agent then proactively wrote and ran a test script (`test-find-hotels.mjs`) that re-tested hotel 1092990 (Taj Mahal Hotel Abids) — a flow already completed and documented in prior sessions
- Booking succeeded (ID 2149231), confirming prior work was correct, but this was unnecessary

**Mistake:** Failure to distinguish between "answering a question" and "needing to take action." The session log already documented all completed work. Re-running confirmed nothing new.

**Files changed:** `Governance/docs/governance/Cckr-SESSION-LOG.md`, `Governance/docs/governance/MISTAKE-LOG.md`

**Prevention:** When user asks "what did we do so far" or similar recap questions, answer from session context only. Do not re-run tests unless user explicitly asks for re-verification or reports a bug.

---

### Session 2026-06-25 (cont.) — TBO Booking Flow Fix + Endpoint Routing Correction

**Objective:** Fix TBO Hotel booking endpoint routing (Book/Voucher/Cancel go to HotelBE.tektravels.com, not affiliate.tektravels.com), fix BookingCode format, fix PAN null rejection.

**Changes:**
- Split `getBookingContext()` into `getSearchContext()` (for Search/PreBook on `affiliate.tektravels.com`) and `getBookingActionContext()` (for Book/GetBookingDetail/Voucher/Cancel on `HotelBE.tektravels.com/hotelservice.svc/rest`) in `tbo-hotel-api.ts`
- Fixed Book endpoint path: `/book/` (lowercase, trailing slash) on HotelBE
- Fixed BookingCode format in mock: `${HotelCode}!TB!${RoomIndex}!TB!${TraceId}!TB!AFF!` including TraceId from search response
- Fixed PAN/Email/Phoneno/Passport fields: omitted from JSON when not provided (TBO rejects null/empty PAN with ErrorCode:3)
- Verified Hotel Search (affiliate) → PreBook (affiliate) → Book (HotelBE) → Voucher flow end-to-end
- Updated `src/lib/tbo-hotel-client.ts` — removed broken fallback path with literal "fallback" string
- Fixed mock TypeScript: `Email`/`Phoneno` now fall back to empty string in GetBookingDetail response

**Files changed:** `src/lib/tbo-hotel-api.ts`, `tbo-hotel-client.ts`, `tbo-hotel-types.ts`, `tbo-hotel-mock.ts`

**Verification:** TypeScript: 0 errors. Post-task: pending.

**Next steps:**
- Test GenerateVoucher → GetBookingDetail → SendChangeRequest on HotelBE
- Ask TBO to enable static data endpoints on affiliate.tektravels.com
- Cleanup stale env vars

---

### Session 2026-06-25 — Security Audit + Orphaned Route Cleanup

**Objective:** Reverify previous security audit findings. Execute 4 parallel security audits (auth/middleware, input validation, credentials/secrets, payment/webhooks). Delete orphaned route files under src/lib/.

**Changes:**
- Auth/middleware audit: `auth-helpers.ts` (requireAuth, getSession, getCurrentUser) defined but **never imported** anywhere. Middleware returns NextResponse.next() unconditionally. 4+ API routes use `x-user-email` header with zero verification — complete auth bypass. Login accepts any email without password. Role checks client-side only.
- Input validation audit: No zod/yup used. `corporate-rates/[id]/route.ts` spreads entire body into Prisma update — mass assignment. 4+ routes spread body unsanitized. No $queryRaw/$executeRaw found (low SQL injection risk).
- Credentials audit: 63 process.env references across 20 files. `.env.local` has live TBO credentials. Payment gateway secrets (Razorpay, PhonePe) in env vars.
- Payment/webhook audit: Razorpay webhook missing `validateWebhookSignature()` — parsed body only. PhonePe webhook correctly verifies X-Verify SHA256. Checkout `revalidatePrice()` is mock returning `{ valid: true }`.
- Deleted 9 orphaned files (zero imports confirmed):
  - `src/lib/payment/api/checkout/route.ts`
  - `src/lib/payment/api/payment-status/[id]/route.ts`
  - `src/lib/payment/api/webhooks/phonepe/route.ts`
  - `src/lib/payment/api/webhooks/razorpay/route.ts`
  - `src/lib/pricing/api/corporate-rates/[id]/route.ts`
  - `src/lib/pricing/api/corporate-rates/route.ts`
  - `src/lib/pricing/api/pricing-rules/[id]/route.ts`
  - `src/lib/pricing/api/pricing-rules/route.ts`
  - `src/lib/pricing/api/promos/validate/route.ts`

**Files changed:** 9 deleted (all under src/lib/, live duplicates exist under src/app/api/)

**Verification:** Pre-flight 12/12. Post-task 8/8. TypeScript 0 errors. Zero imports confirmed via grep.

**Next steps (pending):**
- Fix 13 critical security vulnerabilities — auth bypass, webhook verification, input validation, mass assignment
- Run architectural deepening candidates (TBO collapse, auth seam, DB layer, pricing engine)

---

### Session 2026-06-23 — TBO Hotel API Static Data Reconfiguration

**Objective:** Separate TBO Hotel API auth into distinct environments (static data vs search/book), clean up dual implementations, and create comprehensive reference docs.

**Changes:**
- Created `Governance/docs/static-data/TBO-STATIC-DATA-REFERENCE.md` — 236-line reference covering all static data endpoints (CountryList, CityList, TBOHotelCodeList, HotelDetails, HotelInfo, CheckMinimumAge, MinHotelRate)
- Reconfigured auth separation:
  - Static data → `http://api.tbotechnology.in/TBOHolidays_HotelAPI` with `TBOStaticAPITest` creds (`TBO_HOTEL_USERNAME`/`TBO_HOTEL_PASSWORD`)
  - Search/PreBook/Book → `https://affiliate.tektravels.com/HotelAPI` with `RasaT` creds (`TBO_USERNAME`/`TBO_PASSWORD`)
- Restored `TBO_HOTEL_USERNAME` and `TBO_HOTEL_PASSWORD` env vars with static data staging creds
- Added `TBO_STATIC_ENDPOINT` env var with staging URL as default
- Updated `.env.example` with clear dual-auth documentation
- Refactored `/api/cities/tbo` to use shared `getCitiesWithRoomsScore` from `tbo-hotel-client` instead of inline duplicate
- Fixed `/api/tbo-hotels` static-data actions (countryList, hotelCodeList) to call real API instead of mock
- Removed mock-only code paths from `tbo-hotel-api.ts`
- Added `TBO_HOTEL_FORCE_MOCK` env var for testing

**Files changed:** 9 source files + .env.example + 1 new governance doc

**Verification:** TypeScript: 0 errors. Build: clean. Post-task: 8/8.

**Known issues:** City code values differ between staging static API (CountryList/CityList) and production search API; static data endpoints return 500 errors against production URL.

---

### Session 2026-06-19 — Full Cleanup + Dual DB Isolation

**Objective:** Remove all legacy database references, set up two isolated CockroachDB environments, fix governance scripts.

**Changes:**
- Deleted all stale files: `src/lib/supabase.ts`, `supabase-server.ts`, `supabase-admin.ts`, `auth/login/route.ts`, `auth/me/route.ts`
- Deleted stale scripts: `scripts/migrate-to-cockroach.js`, `scripts/seed-users.js`, `scripts/migrate-data.sh`, `scripts/governance-check.sh`
- Deleted `supabase/` directory
- Rewrote `src/lib/db/index.ts` — Prisma-only, no dual-mode pattern
- Rewrote all 13 `src/lib/db/*.ts` files — Prisma-only
- Rewrote 10 API routes — removed all dual-mode branches
- Rewrote `src/lib/api-logger.ts` — Prisma-only
- Removed `@supabase/ssr` and `@supabase/supabase-js` from package.json
- Removed legacy env vars from `.env.local`
- Set up `.env.local` (DEV) and `.env.production` (PROD) as isolated environments
- Updated `.env.example` with dual-environment documentation
- Fixed `Governance/scripts/detect-governance-root.sh` — relative path resolution
- Fixed `Governance/scripts/Cckr-preflight-check.sh` — standalone repo paths
- Fixed `Governance/scripts/Cckr-post-task-check.sh` — standalone repo paths
- Fixed `scripts/preflight-check.sh` + `post-task-check.sh` — routes to Cckr scripts
- Updated email templates and profile page URLs to use `cckr.vercel.app`
- Rewrote README.md — clean, no legacy references
- TypeScript: 0 errors. Build: clean. Preflight: 12/12. Post-task: 8/8.

**Files changed:** ~40 files

---

### Session 2026-06-18 — Initial Supabase Removal (Incomplete)

**Objective:** Remove Supabase dependencies.

**Note:** This session claimed completion but left stale files and dual-mode code in 10+ API routes. Session 2026-06-19 completed the work.

---

### Session 2026-06-16 — Schema Sync

**Changes:**
- Added `Lead.source` column via direct SQL
- Added `Reports` NavigationItem via direct SQL
- Added `LOST` stage to LeadStage table

---

### Session 2026-06-15 — Initial Migration + Setup

**Changes:**
- Migrated 31 tables (249 rows) to CockroachDB
- Set up Vercel project and GitHub repo
- Created governance framework

---

## Deployment History

| Date | Environment | Status | URL | Notes |
|------|---|---|---|---|
| 2026-07-08 | DEV | ✅ Live | cckr.vercel.app | Admin bookings page + auth session fix |
| 2026-07-08 | DEV | ✅ Live | cckr.vercel.app | Deploy TARIFF-01/02/03, corporate flow, SEC hardening |
| 2026-06-19 | DEV | ✅ Live | cckr.vercel.app | Full cleanup, dual DB isolation |
| 2026-06-15 | DEV | ✅ Live | cckr.vercel.app | Initial deployment |

---

## Known Constraints

| Constraint | Detail |
|---|---|
| CockroachDB free tier | 50M RUs/mo, 10 GiB storage per cluster |
| Schema changes | Manual SQL only (no `prisma db push`) |
| Prisma provider | Must be `postgresql`, NOT `cockroachdb` |
| Vercel free plan | No GitHub integration for org repos |

---

## Architectural Decisions

| Decision | Approach | Date |
|---|---|---|
| Database | CockroachDB Basic (two isolated clusters) | 2026-06-15 |
| DB client | Prisma (no dual-mode) | 2026-06-15 |
| Auth | Better Auth | 2026-06-15 |
| Schema changes | Manual SQL | 2026-06-15 |
| Deploy | Vercel CLI + GitHub Actions | 2026-06-15 |
| Pipeline | Standalone (separate from any other pipeline) | 2026-06-15 |

---

## Next Steps

1. **CASH-01/CASH-02** (CRITICAL) — Implement Cashfree payment gateway (client + webhook)
2. **LAUNCH-01** — Rerun final security review gate (all SEC issues done)
3. **QA-01** — Set up Playwright E2E tests for core booking flows
4. **INFRA-02** — Error monitoring (Sentry or Vercel)
5. **UX-01/UX-02** — User dashboard + SEO meta tags
6. **LAUNCH-02** — Deploy to production (after Cashfree done)
7. **AUTH-01** — Document `BETTER_AUTH_URL` requirement in env setup docs (must match Vercel project URL)
8. Keep schema in sync between DEV and PROD when making changes

---

## Session — 2026-07-09

### Accomplished
1. **PR-44 rejected** — dark green `#163A32` navbar theme already in main; closed with note "change taken in code"
2. **Audited all GitHub issues** — 19 closed (SEC, INFRA-01, CORE, CORP, TARIFF, mock removal); 12 open including ZAK-01/P2/40
3. **Migrated payment gateway from Razorpay/PhonePe to Zaakpay**
   - `src/lib/payment/razorpay-client.ts` → deleted
   - `src/lib/payment/phonepe-client.ts` → deleted
   - `src/lib/payment/zaakpay-client.ts` → new (Express Checkout / checkoutServer API, HMAC-SHA256 webhook verify, checkStatus, createRefund)
   - `src/lib/payment/config.ts` → ZAAKPAY_MERCHANT_ID, SECRET_KEY, SALT, API_BASE
   - `src/lib/payment/types.ts` → Zaakpay types (ZaakpayOrderResponse, ZaakpayWebhookBody, ZaakpayCheckStatusResponse)
   - `src/lib/payment/payment-service.ts` → single Zaakpay flow, null-safety on orderId
   - `src/lib/payment/index.ts` → updated exports
   - `src/app/api/webhooks/zaakpay/route.ts` → new POST webhook + GET status check fallback
   - `src/app/api/webhooks/razorpay/route.ts` → deleted
   - `src/app/api/webhooks/phonepe/route.ts` → deleted
   - `src/app/api/checkout/route.ts` → gateway enum → ["zaakpay"]
   - `src/components/CheckoutButton.tsx` → gateway default "zaakpay"
   - `src/app/payment/success/page.tsx` → mock callback hits /api/webhooks/zaakpay
   - `.env.example` → Zaakpay env vars
4. **Issues renamed** — #39 ZAK-01, #40 ZAK-02; label epic:cashfree → epic:zaakpay
5. **Session timeout UX** — SessionWarningModal (3-min countdown) + AuthProvider session expiry tracking + global 401 interceptor; committed & deployed

### Post-flight status
- Pre-flight: ✓ ALL 13 CHECKS PASSED
- Post-flight: ✓ ALL 9 CHECKS PASSED
- Deployment: https://cckr-gpl3ymqep-nikhil-gorasa-s-projects.vercel.app (production)

### Blockers
- Zaakpay sandbox credentials not yet added to .env.local / .env.production
- Prisma `gateway String @default("razorpay")` — cosmetic only, needs schema migration later

### Next actions
1. Add Zaakpay test credentials to .env.local
2. Run Zaakpay sandbox E2E (create order → pay → webhook → confirm)
3. ZAK-02 webhook hardening (idempotency, retry, reconciliation job)

---

### Session 2026-07-09 (Session 12) — Logo/favicon replacement (CRDB-GOV-004)

**Objective:** Replace default Next.js logo/favicon SVGs with new GoRASA logo SVG (base64-encoded PNG in SVG container).

**Changes:**
- `public/logo.svg` — Overwritten with new GoRASA logo (identical to source)
- `public/favicon.svg` — Overwritten with new GoRASA logo (same file, works for SVG favicons)
- Both files replaced by copying `/home/nikhil/Downloads/GoRASA_logo.svg`

**Verification:**
- Pre-flight: 13/13 passed
- TypeScript: `npx tsc --noEmit` — 0 errors
- Build: `npm run build` — compiled successfully (3.9s Turbopack, 84 pages)
- Post-task: 9/9 passed
- No database, schema, or API config changes

**Files changed:** 2 (public/logo.svg, public/favicon.svg)

**Governance docs updated:** Cckr-SESSION-LOG.md, CHANGE-LOG.md (CRDB-GOV-004)
