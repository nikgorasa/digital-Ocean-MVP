<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# GoRASA CockroachDB Standalone — Governance

**Version:** 2.1.0

> This governance framework is MANDATORY for all work on this project.
> Non-compliance will result in incomplete work being rejected.

---

## Two Isolated Database Environments

| Environment | Env File | Vercel Project | URL |
|---|---|---|---|
| **DEV** | `.env.local` | `cckr` | https://cckr.vercel.app |
| **PROD** | `.env.production` | `cckr2` | https://project-yidb6.vercel.app |

Each connects to a **different CockroachDB cluster**. Zero shared data.

---

## Before Starting

**Run the pre-flight check with your task type:**

```bash
# Context-aware (recommended) — runs only checks relevant to your task
bash scripts/preflight-check.sh --task css          # CSS fix — 3 checks
bash scripts/preflight-check.sh --task tbo          # TBO API work — 8 checks
bash scripts/preflight-check.sh --task api_new      # New API route — 7 checks
bash scripts/preflight-check.sh --task flight_ui    # Flight page UI — 5 checks
bash scripts/preflight-check.sh --task config       # Config changes — 6 checks
bash scripts/preflight-check.sh --task schema       # Schema change — 7 checks
bash scripts/preflight-check.sh --task deploy       # Deployment — 9 checks

# Backward compatible — runs all 18 checks
bash scripts/preflight-check.sh
```

**Task types:** css, ui, api_new, api_modify, tbo, schema, db_seed, flight_ui, hotel_ui, config, middleware, email, payment, governance, deploy, all

**Flags:** `--quick` (gating checks only, skip informational)

---

## Blocked Actions — NEVER Do These

**NEVER DELETE:**
- `.env.local`, `.env.production` — contain database credentials
- `.vercel/` — links to Vercel
- `prisma/schema.prisma` — database schema
- `.github/workflows/*.yml` — deploy automation

**NEVER RUN:**
- `git push --force` — breaks history
- `prisma db push` — fails on CockroachDB

**NEVER CHANGE WITHOUT USER APPROVAL:**
- Git remotes
- GitHub Actions workflows
- Vercel environment variables
- Prisma schema
- Database connection strings

---

## Operational Modes

### Plan Mode (Read-Only)
- Only read and analyze — no file changes, no shell commands, no commits

### Build Mode (Read-Write)
- Full access — edit files, run commands, commit, deploy
- Must follow governance protocol before making changes

---

## Required-First-Read — CRITICAL

BEFORE using ANY database-related MCP tool (Neon, Supabase, or others), you MUST:
1. Read `Governance/docs/governance/DB-PLATFORM.md` — identifies the active DB platform
2. Read `Governance/docs/governance/Cckr-SESSION-LOG.md` — current state and pending items
3. Read `AGENTS.md` — governance rules and blocked actions
4. Check if `secrets.file` exists in project root (it is the credential source of truth)
5. **Validate DATABASE_URL format**: Any DATABASE_URL returned must match the CockroachDB pattern `postgresql://<user>:<password>@<cluster>.<region>.cockroachlabs.cloud:26257/`. If it matches `db.neon.tech` or `supabase.co`, it is WRONG for this project.

---

## Pre-Flight Check (18 checks — MANDATORY)

**Before starting ANY significant work:**

```bash
bash scripts/preflight-check.sh --task TYPE
```

**Core checks (always run):** TypeScript, stale imports, env vars, docs exist

**Structural checks (task-dependent):** Prisma provider, vercel.json, git email, dual DB isolation, API config guard, airport count

**Behavioral checks (NEW — catch real regression bugs):**
- BEH-01: Middleware whitelist — new API route not in `PUBLIC_API_ROUTES` → silent 401
- BEH-02: Flight city mode — flight pages must use `mode="flight"` on CitySearchDropdown
- BEH-03: Hotel city mode — hotel pages must NOT use `mode="flight"`
- BEH-04: TBO endpoint routing — search→affiliate, booking→HotelBE
- BEH-05: Config multi-source sync — 4 config sources must match
- BEH-06: Schema cluster reminder — apply SQL to BOTH DEV and PROD
- BEH-07: Webhook signatures — payment webhooks must verify signatures
- BEH-08: Currency hardcoded — no ₹ or INR in email templates

---

## Post-Task Check (9 checks — MANDATORY)

**After completing ANY significant task:**

```bash
bash scripts/post-task-check.sh
```

Checks: TypeScript, build, no stale imports, git status, session log, DB changes log, no stale env vars, dual DB isolation, API config guard.

---

## Enforcement Rules

### Rule 1: No Changes Without Context
Read project docs and understand current state before making changes.

### Rule 2: Document All Issues
Every >30min debug session → `Governance/docs/governance/LEARNING-FROM-MISTAKES.md`

### Rule 3: Track All Deployments
Every deployment → `Governance/docs/governance/DEPLOYMENT-LOG.md`

### Rule 4: Verification Before Completion
- TypeScript must compile (`npx tsc --noEmit`)
- Build must pass (`npm run build`)
- No stale database imports

### Rule 5: NEVER Force-Push to main
Always use normal push or PR.

### Rule 6: Schema Changes via Manual SQL Only
`prisma db push` does NOT work on CockroachDB. Use direct SQL on BOTH clusters.

### Rule 7: API Config Guard (MANDATORY)
The TBO Hotel API has **dual endpoint architecture**. Every change to API configuration must be validated:

**Dual endpoint architecture (single source of truth):**
| Endpoint Group | Base URL | Credentials |
|---|---|---|
| **Search/PreBook** | `https://affiliate.tektravels.com/HotelAPI` | RasaT / RasaT@123 |
| **Book/Voucher/Cancel** | `https://HotelBE.tektravels.com/hotelservice.svc/rest` | RasaT / RasaT@123 |
| **Static Data** | `http://api.tbotechnology.in/TBOHolidays_HotelAPI` | TBOStaticAPITest / Tbo@11530818 |

**NEVER** set `bookingUrl` to the affiliate endpoint — it must point to HotelBE.
**NEVER** run `npx tsx scripts/seed-config.ts` without verifying all URLs are correct.
**ALWAYS** run `Governance/scripts/Cckr-api-config-check.sh` after any API config change.
**ALWAYS** update BOTH `ConfigProvider` DB table AND the 3 code defaults (seed-config.ts, config-service.ts envFallback, page.tsx PROVIDER_META) in sync.

### Rule 8: Flight vs Hotel City Data (CRITICAL)
The `CitySearchDropdown` component has a `mode` prop that controls data source:

| Mode | Data Source | Use For |
|---|---|---|
| `mode="hotel"` (default) | TBO Hotel API (`/api/cities/tbo`) | Hotel search pages |
| `mode="flight"` | Curated airport list (FALLBACK_CITIES) | Flight search pages |

**NEVER** use hotel city data for flight searches — hotel codes (e.g., "15648") don't work with the Flight API which requires IATA airport codes (e.g., "GOI").
**ALWAYS** use `mode="flight"` on flight pages (`/flights`).
**ALWAYS** use `mode="hotel"` or default on hotel pages (`/hotels`).

---

## Key Files

| File | Purpose |
|---|---|
| `Governance/docs/governance/DB-PLATFORM.md` | DB platform identification (MUST read before any MCP use) |
| `Governance/docs/governance/Cckr-SESSION-LOG.md` | Session history |
| `Governance/docs/governance/Cckr-CONFIG-REFERENCE.md` | Configuration |
| `Governance/docs/governance/CHANGE-LOG.md` | Governance changes |
| `Governance/docs/governance/MISTAKE-LOG.md` | Mistakes |
| `Governance/docs/governance/DB-CHANGES.md` | DB changes |
| `Governance/docs/governance/DEPLOYMENT-LOG.md` | Deployments |
| `Governance/docs/governance/LEARNING-FROM-MISTAKES.md` | Issue deep-dives |
| `Governance/scripts/Cckr-api-config-check.sh` | API config validation (6 checks) |
| `Governance/scripts/Cckr-governance-check.sh` | Context-aware governance (18 checks, task routing) |
| `Governance/docs/static-data/TBO-STATIC-DATA-REFERENCE.md` | TBO API endpoint reference |
| `scripts/seed-airports.ts` | Airport data download + DB upsert (OurAirports → City table) |
| `src/app/api/cities/airports/route.ts` | Airport search API endpoint (DB-backed) |

---

## Quick Reference

### Deploy
> **Note:** `git push origin main` does NOT auto-deploy. There are no GitHub Actions workflows set up. All deployments require explicit `vercel deploy` CLI commands.

```bash
# DEV (cckr — default link via .vercel/project.json)
vercel deploy --prod --yes

# PROD (cckr2 — must link to cckr2 first, then deploy, then re-link to cckr)
vercel link --yes --project cckr2 && vercel deploy --prod --yes && vercel link --yes --project cckr
```

### Schema Change
```bash
# Apply to DEV
source .env.local
node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('ALTER TABLE ...')).then(() => { console.log('Done'); c.end(); });"

# Apply to PROD
source .env.production
node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('ALTER TABLE ...')).then(() => { console.log('Done'); c.end(); });"
```
