# GoRASA CockroachDB Standalone — SESSION-LOG

> **Purpose:** Living document tracking all sessions, changes, deployments, and learnings.
> **Last updated:** 2026-06-19

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
