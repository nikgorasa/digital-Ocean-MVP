# GoRASA CockroachDB Standalone — SESSION-LOG

> **Purpose:** Living document tracking all sessions, changes, deployments, and learnings.
> **Last updated:** 2026-07-03 (Session 7 — Security Hardening + Auth Setup)

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

### Session 2026-07-03 (Session 7) — Security Hardening + Auth Setup

**Objective:** Fix all 14 critical/high security vulnerabilities, set up Better Auth with passwords, deploy to DEV.

**Changes:**
- SEC-01: Middleware validates session cookie on all /api/* routes (public routes whitelisted)
- SEC-02: requireAdmin() added to 15+ admin API routes
- SEC-03: Login requires password in production, sanitized responses
- SEC-04: Removed all 17 x-user-email header usages, replaced with session-based auth
- SEC-05: Zod validation on checkout, bookings, cancellations
- SEC-06: Webhook signature always required, mock defaults to false in production
- SEC-07: Security headers (X-Frame-Options, HSTS, CSP, etc) in next.config.ts
- SEC-08: Deleted /api/debug-ip, fixed cron auth bypass
- SEC-09: sanitizeUser() helper, applied to all user-returning routes
- SEC-10: Fixed mass assignment in corporate-rates/[id], rewards/[id], leads/[id]
- Created Better Auth tables (session, account, verification) in DEV + PROD CockroachDB
- Set passwords for all 7 users in both clusters
- Demo login now goes through Better Auth (no more insecure bypass)
- Payment config: mock=false in production by default
- Deployed to DEV: https://cckr.vercel.app

**Files changed:** 44 files, 517 insertions, 348 deletions
**Verification:** TypeScript 0 errors, Build clean, Post-task 9/9, Preflight 13/13
**Deployment:** DEV live at cckr.vercel.app

**Next steps:**
- INFRA-01: Set Vercel PROD env vars
- CORE-01: Wire real payment gateway
- CORE-02: Wire email notifications

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

1. Set actual CockroachDB connection strings in `.env.local` (DEV) and `.env.production` (PROD)
2. Monitor CockroachDB free tier usage
3. Keep schema in sync between DEV and PROD when making changes
