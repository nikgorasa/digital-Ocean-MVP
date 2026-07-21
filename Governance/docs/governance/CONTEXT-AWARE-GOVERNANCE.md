# Context-Aware Governance Protocol

**Version:** 2.1.0
**Introduced:** 2026-07-22
**Supersedes:** v2.0.0 (flat 14-check preflight)

---

## Problem Statement

The v2.0.0 governance protocol ran the same 14 checks regardless of task type. This caused two problems:

1. **Irrelevant checks wasted time and attention** — a CSS fix triggered an airport DB query, a governance doc update ran TypeScript compilation, and an email template change validated TBO endpoint routing.

2. **Critical behavioral checks were missing** — 8 regressions occurred because the checks that would have caught them didn't exist:

| Session | Regression | Missing Check |
|---------|-----------|---------------|
| S13 | New API route → silent 401 | Middleware whitelist validation |
| S14 | TBO response type crash | API response type mapping |
| S25→S27 | Cabin class filter broke all searches | TBO response shape validation |
| S26 | Hotel city codes used for flight search | CitySearchDropdown mode validation |
| S33 | Airport data leaked into hotel search | Cross-context data isolation |

---

## Solution: Task-Aware Check Routing

The unified script `Governance/scripts/Cckr-governance-check.sh` accepts a `--task` flag and runs only the checks relevant to that type of work.

### Usage

```bash
# Context-aware (recommended)
bash scripts/preflight-check.sh --task css          # 3 checks
bash scripts/preflight-check.sh --task tbo          # 7 checks
bash scripts/preflight-check.sh --task api_new      # 5 checks
bash scripts/preflight-check.sh --task flight_ui    # 5 checks
bash scripts/preflight-check.sh --task config       # 6 checks
bash scripts/preflight-check.sh --task schema       # 7 checks
bash scripts/preflight-check.sh --task deploy       # 9 checks

# Backward compatible (runs all 18)
bash scripts/preflight-check.sh

# Quick mode (gating checks only, skip informational)
bash scripts/preflight-check.sh --task tbo --quick

# Post-task phase
bash scripts/post-task-check.sh --task tbo
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--task TYPE` | `all` | Task type — determines which checks run |
| `--phase PHASE` | `preflight` | `preflight` (before work), `post-task` (after work), `all` (both) |
| `--quick` | off | Run only gating checks, skip informational |

---

## Task Types

| Type | Description | Typical Use |
|------|-------------|-------------|
| `css` | Styling, layout, Tailwind, globals.css | CSS fixes, design token changes |
| `ui` | React component changes (non-API) | UI component refactors |
| `api_new` | Adding a new API route | New `/api/xyz/route.ts` |
| `api_modify` | Modifying existing API route | Changing request/response handling |
| `tbo` | TBO hotel/flight API code | Changes to `tbo-hotel-api.ts`, `tbo-flight-client.ts` |
| `schema` | Prisma schema changes | Adding/modifying database models |
| `db_seed` | Database seed scripts | Running `seed-config.ts`, `seed-airports.ts` |
| `flight_ui` | Flight search/booking UI | Changes to `flights/page.tsx`, flight components |
| `hotel_ui` | Hotel search/booking UI | Changes to `hotels/page.tsx`, hotel components |
| `config` | Configuration changes | `config-service.ts`, `seed-config.ts`, admin config |
| `middleware` | Middleware changes | `src/middleware.ts` |
| `email` | Email templates and service | Email template changes, SMTP config |
| `payment` | Payment gateway, webhooks | Zaakpay integration, checkout flow |
| `governance` | Governance docs, scripts | `AGENTS.md`, governance scripts |
| `deploy` | Deployment, vercel.json | Vercel deployment, build config |
| `all` | Everything | Full audit (backward compatible) |

---

## Check Inventory (18 Total)

### Core Checks (4 — always run)

| ID | Check | Gating | What It Validates |
|----|-------|--------|-------------------|
| GOV-01 | Docs exist | Yes | 5 governance doc files present |
| GOV-02 | Environment vars | Yes | `.env.local` exists, required vars set, no stale Supabase |
| GOV-03 | TypeScript compile | Yes | `npx tsc --noEmit` passes |
| GOV-04 | No stale Supabase | Yes | No `@supabase/*` imports in `src/` |

### Structural Checks (6 — task-dependent)

| ID | Check | Gating | What It Validates |
|----|-------|--------|-------------------|
| GOV-05 | Prisma provider | Yes | `schema.prisma` uses `postgresql` not `cockroachdb` |
| GOV-06 | vercel.json safe | Yes | No `prisma db push` in build command |
| GOV-07 | Git email valid | Yes | Not a Vercel-blocked email |
| GOV-08 | Dual DB isolation | Info | DEV and PROD have different `DATABASE_URL` |
| GOV-09 | API config guard | Yes | 6 sub-checks for TBO endpoint correctness |
| GOV-10 | Airport count | Info | ≥ 2,000 airports in DB |

### Behavioral Checks (8 — NEW, task-dependent)

| ID | Check | Gating | What It Catches |
|----|-------|--------|-----------------|
| BEH-01 | Middleware whitelist | Info | New API route not in `PUBLIC_API_ROUTES` → silent 401 |
| BEH-02 | Flight city mode | Yes | Flight pages using hotel city data instead of IATA codes |
| BEH-03 | Hotel city mode | Yes | Hotel pages accidentally using `mode="flight"` |
| BEH-04 | TBO endpoint routing | Yes | Search→affiliate, booking→HotelBE routing correctness |
| BEH-05 | Config multi-source | Yes | `config-service.ts`, `tbo-hotel-api.ts`, `admin/page.tsx` all agree |
| BEH-06 | Schema cluster reminder | Info | Reminder to apply SQL to BOTH DEV and PROD clusters |
| BEH-07 | Webhook signatures | Info | Payment webhook handlers have signature verification |
| BEH-08 | Currency hardcoded | Info | No `₹` or `INR` in email templates |

---

## Check Routing Matrix

This matrix shows which checks run for each task type. `✓` = runs, `-` = skipped.

| Check | css | ui | api_new | api_modify | tbo | schema | db_seed | flight_ui | hotel_ui | config | middleware | email | payment | governance | deploy |
|-------|-----|----|---------|-----------|-----|--------|---------|----------|---------|--------|-----------|-------|---------|------------|--------|
| GOV-01 Docs | - | - | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ | - | - | ✓ | ✓ | ✓ |
| GOV-02 Env vars | ✓ | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ | - | ✓ |
| GOV-03 TypeScript | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ |
| GOV-04 Stale imports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ |
| GOV-05 Prisma | - | - | - | - | - | ✓ | ✓ | - | - | - | - | - | - | - | ✓ |
| GOV-06 vercel.json | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ✓ |
| GOV-07 Git email | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ✓ |
| GOV-08 Dual DB | - | - | - | - | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | ✓ |
| GOV-09 API config | - | - | - | ✓ | ✓ | - | - | - | - | ✓ | - | - | - | - | - |
| GOV-10 Airports | - | - | - | - | - | - | ✓ | ✓ | - | - | - | - | - | - | - |
| BEH-01 Middleware | - | - | ✓ | - | - | - | - | - | - | - | ✓ | - | - | - | - |
| BEH-02 Flight mode | - | - | - | - | - | - | - | ✓ | - | - | - | - | - | - | - |
| BEH-03 Hotel mode | - | - | - | - | - | - | - | - | ✓ | - | - | - | - | - | - |
| BEH-04 TBO routing | - | - | - | - | ✓ | - | - | - | - | - | - | - | - | - | - |
| BEH-05 Config sync | - | - | - | - | - | - | - | - | - | ✓ | - | - | - | - | - |
| BEH-06 Schema reminder | - | - | - | - | - | ✓ | - | - | - | - | - | - | - | - | - |
| BEH-07 Webhooks | - | - | - | - | - | - | - | - | - | - | - | - | ✓ | - | - |
| BEH-08 Currency | - | - | - | - | - | - | - | - | - | - | - | ✓ | - | - | - |

---

## How the Behavioral Checks Work

### BEH-01: Middleware Whitelist
Scans all `src/app/api/*/route.ts` files and compares against the `PUBLIC_API_ROUTES` array in `src/middleware.ts`. Warns on routes not in the whitelist (they may intentionally require auth).

**Prevents:** Silent 401 errors when new public API routes are added but not whitelisted.

### BEH-02: Flight City Mode
Finds all `CitySearchDropdown` usages in `src/app/flights/` and `src/components/Flight*`. Verifies each has `mode="flight"` set within 15 lines of the component tag.

**Prevents:** Hotel city codes (numeric, e.g., "15648") being sent to the Flight API which requires IATA airport codes (e.g., "GOI").

### BEH-03: Hotel City Mode
Finds all `CitySearchDropdown` usages in `src/app/hotels/`. Verifies none have `mode="flight"` set (which would use airport data instead of hotel city data).

**Prevents:** Airport data being used for hotel searches.

### BEH-04: TBO Endpoint Routing
Validates that each function in `tbo-hotel-api.ts` uses the correct context:
- `searchHotels()`, `preBook()` → `getSearchContext()` (affiliate endpoint)
- `bookHotel()`, `generateVoucher()`, `getBookingDetail()`, `sendChangeRequest()`, `getChangeRequestStatus()` → `getBookingActionContext()` (HotelBE endpoint)

**Prevents:** Booking calls going to the search endpoint or vice versa.

### BEH-05: Config Multi-Source Sync
Validates that the 3 code config sources have matching TBO endpoint URLs:
- `src/lib/config-service.ts` — envFallback defaults
- `src/lib/tbo-hotel-api.ts` — function-level fallbacks
- `src/app/admin/config/page.tsx` — UI display defaults

Also checks that no `bookingUrl` incorrectly points to the affiliate endpoint.

**Prevents:** Config drift where different code paths use different endpoints.

### BEH-06: Schema Cluster Reminder
Prints a reminder that schema changes must be applied to BOTH `.env.local` (DEV) and `.env.production` (PROD) clusters via direct SQL.

**Prevents:** Schema drift between DEV and PROD clusters.

### BEH-07: Webhook Signatures
Finds all webhook route handlers and checks for signature verification patterns (`validateWebhookSignature`, `X-Verify`, `hmac`, `crypto.createHmac`).

**Prevents:** Payment webhooks being processed without signature verification.

### BEH-08: Currency Hardcoded
Scans email template files for hardcoded `₹` or `INR` symbols.

**Prevents:** Indian Rupee symbols appearing in emails sent to international users.

---

## Migration from v2.0.0

### What Changed
- `scripts/preflight-check.sh` now delegates to `Governance/scripts/Cckr-governance-check.sh --phase preflight "$@"`
- `scripts/post-task-check.sh` now delegates to `Governance/scripts/Cckr-governance-check.sh --phase post-task "$@"`
- The old scripts (`Cckr-preflight-check.sh`, `Cckr-post-task-check.sh`) are preserved and unchanged

### Backward Compatibility
- `bash scripts/preflight-check.sh` (no args) runs all 18 checks — identical behavior to v2.0.0 plus 8 new behavioral checks
- `bash scripts/post-task-check.sh` (no args) runs all post-task checks
- All exit codes preserved: 0 = pass, 1 = fail

### What's New
- `--task` flag for context-aware check routing
- `--quick` flag for gating-only checks
- 8 behavioral checks that catch real regression bugs
- `--phase` flag for preflight vs post-task selection

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `AGENTS.md` (v2.1.0) | Governance rules, task type reference |
| `LEARNING-FROM-MISTAKES.md` | Issue 004 (middleware whitelist), Issue 005 (type mismatch), Issue 006 (JourneyType) |
| `MISTAKE-LOG.md` | CRDB-002, CRDB-003 (incomplete cleanup patterns) |
| `Governance/scripts/Cckr-api-config-check.sh` | 6 sub-checks for TBO endpoint validation |
| `Governance/scripts/Cckr-governance-check.sh` | Unified context-aware governance script |
