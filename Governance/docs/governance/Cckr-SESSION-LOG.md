# GoRASA CockroachDB Standalone — SESSION-LOG

> **Purpose:** Living document tracking all sessions, changes, deployments, and learnings for the CockroachDB standalone deployment.
> **Maintained alongside:** `Cckr-CONFIG-REFERENCE.md` (configuration reference).
> **Last updated:** 2026-06-18

---

## Sessions

> **Last updated:** 2026-06-18 (session 1)

### Session 2026-06-18-01 — Complete Supabase Removal + Prisma-Only Cleanup

**Objective:** Remove all Supabase dependencies from the standalone CockroachDB codebase, fixing the dual-mode (Supabase/Prisma) pattern.

**Work done:**
- Deleted: `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`, `supabase/` dir
- Rewrote `src/lib/db/index.ts`: no more dual-mode — always Prisma
- Simplified `api-logger.ts` to console-only (was importing deleted supabase-admin)
- Rewrote all 13 `src/lib/db/*.ts` files: removed Supabase branches, kept only Prisma
- Fixed `api-logs/route.ts`: removed Supabase dual-mode, uses Prisma `apiLog` model
- Rewrote `users/route.ts` POST: removed Supabase Auth, uses Prisma `users.create` directly
- Rewrote `reports/route.ts`: removed Supabase fallback code (197→95 lines)
- Deleted `auth/login/route.ts` and `auth/me/route.ts`: legacy Supabase auth routes (Better Auth handles via `[...all]/route.ts`)
- Removed `@supabase/ssr` and `@supabase/supabase-js` from package.json
- Cleaned `.env.example`: removed all Supabase env vars
- Full TypeScript compilation: no errors
- Full `npm run build`: passes cleanly

**Files changed:** ~20 files
**Remaining:** Performance optimization pass pending (next session)

---

> **Last updated:** 2026-06-15 (afternoon)

---

## ⚠️ IMPORTANT — READ FIRST

**Before ANY work, read `../DEPLOY.md` and run the command guard:**
```bash
cat ../DEPLOY.md
bash ../scripts/command-guard.sh "your command here"
```

---

## Current Status

**Deployment:** CockroachDB cluster `aqua-pony-27730` fully migrated from Supabase.
**Live URL:** https://project-10o7w.vercel.app
**GitHub:** https://github.com/Gorasa-In-2026/Gorasa-Cockroach
**DB:** CockroachDB Basic — 50M RUs/mo, 10 GiB, 31 tables, 249 rows

---

## Active Goals
1. Governance docs for standalone deployment — **DONE** (11 files with Cckr prefix)
2. Link Vercel project to Gorasa-Cockroach repo — **PENDING**
3. Verify all API endpoints on CockroachDB deployment — **DONE**
4. Future merges from dev/qa pipeline as manual cherry-picks — **PENDING**
5. PR-based deployment for standalone build — **DONE** (GitHub Actions workflow created)

---

## Deployment Rules (MANDATORY)

### ⚠️ PR Required for ALL Deployments

**Every deployment to Standalone build MUST go through a Pull Request:**

1. Create PR from `dev` → `main` on `Gorasa-Cockroach` repo
2. PR must have description of changes
3. PR must be approved before merge
4. Merge triggers GitHub Actions deployment

**Why:** Ensures all changes are reviewed, documented, and auditable.

**Branch Protection (Manual):**
- GitHub free plan doesn't support API branch protection
- Protection rules must be set manually in GitHub UI:
  - Go to: https://github.com/Gorasa-In-2026/Gorasa-Cockroach/settings/branches
  - Add rule for `main` branch
  - Enable "Require pull request before merging"
  - Enable "Require approvals" (1 approval minimum)

### Deploy Command (After PR Merge)
```bash
cd gorasa-next
vercel deploy --prod --yes --token $VERCEL_TOKEN
```

---

## Architectural Decisions

| Decision | Chosen Approach | Date |
|----------|----------------|------|
| Database | CockroachDB Basic (aqua-pony-27730) | 2026-06-15 |
| DB client | Prisma (no dual-mode, no DATABASE_PROVIDER) | 2026-06-15 |
| Auth | Supabase — kept as-is, not migrated | 2026-06-15 |
| Migration | Exported 31 tables (249 rows) from Supabase, imported to CockroachDB | 2026-06-15 |
| FK constraints | Dropped before import, re-added after | 2026-06-15 |
| Deploy | Manual push to main (no auto-deploy) | 2026-06-15 |
| Pipeline | Standalone — separate from DEV/QA/PROD pipeline | 2026-06-15 |
| Git merge | Future dev/qa changes manually cherry-picked | 2026-06-15 |

---

## Known Constraints

| Constraint | Detail |
|------------|--------|
| CockroachDB Basic free tier | 50M RUs/mo, 10 GiB storage — monitor usage |
| Supabase Auth not migrated | Auth still points to `isubgeemvhvhnhikxbjb` — independent from DB |
| Single branch | Only `main` — no dev/qa/staging |
| No auto-deploy | Push manually to Vercel |
| Old Vercel project untouched | `gorasa-next` still at https://gorasa-next.vercel.app |
| Old git remote preserved | Renamed to `old-pipeline` |

---

## Session History

### Session 2026-06-15 (morning) — CockroachDB Migration + Standalone Setup

**Duration:** ~4 hours
**Changes:**
1. Exported all 31 tables (249 rows) from Supabase
2. Imported to CockroachDB cluster `aqua-pony-27730` via Node.js migration script
3. Dropped all 14 FK constraints before import, re-added after
4. Rewrote 9 files to use Prisma instead of `@supabase/supabase-js`
5. Created new Vercel project `project-10o7w`
6. Set 10+ env vars on new Vercel project
7. Deployed — homepage 200, all API endpoints return CockroachDB data
8. Created `Gorasa-In-2026/Gorasa-Cockroach` repo
9. Set up git remote: `cockroach` → new repo, `origin` → old repo (later corrected: origin must stay on gorasav1)
10. Created `cockroach-standalone/` governance directory
11. Wrote parallel governance docs (GOVERNANCE, MEMORY, CHANGE-LOG, CONFIG-REFERENCE, etc.)

**Status:** Standalone deployment functional. Governance being established.

### Session 2026-06-15 (afternoon) — Governance Finalization + File Rename

**Duration:** ~1 hour
**Changes:**
1. Updated all 7 root governance docs with CockroachDB standalone context (MEMORY, CONFIG-REFERENCE, CHANGE-LOG, LEARNING-FROM-MISTAKES, DEPLOYMENT_LOG, DB-CHANGES, Sprint-1)
2. Confirmed local `.env.local` stays on Neon — only Vercel deploy overrides to CockroachDB
3. Renamed all 11 governance files with `Cckr` prefix
4. Updated all internal cross-references in Cckr-GOVERNANCE.md, Cckr-preflight-check.sh, Cckr-post-task-check.sh
5. Ran Cckr-post-task-check.sh — all 10 checks passed

**Status:** Governance complete. Dual-instance architecture implemented.

### Session 2026-06-15 (evening) — Dual-Instance Governance Architecture

**Duration:** ~30 min
**Changes:**
1. Documented dual-instance architecture in Cckr-GOVERNANCE.md — two governance instances (Main + Cckr) with conditional activation based on PWD
2. Created `scripts/detect-governance-root.sh` — shared detection script that resolves governance type, root, doc paths, and script paths from `$PWD`
3. Updated root `scripts/preflight-check.sh` and `scripts/post-task-check.sh` to source detection and auto-delegate to correct instance
4. Updated `cockroach-standalone/scripts/Cckr-preflight-check.sh` and `Cckr-post-task-check.sh` to source detection and print active instance
5. All scripts can be invoked from either root — detection handles routing

**Design:**
- Detection checks `$PWD` for `/cockroach-standalone/` substring
- If matched → Cckr protocol with `Cckr-*` docs, Cckr scripts
- If not matched → Main GoRASA protocol with plain-name docs, gorasa-next scripts
- Script is dual-mode: works as `source` (exports vars) or standalone (`--export` flag)

**Status:** Both governance instances coexist correctly. Conditional switching operational.

### Session 2026-06-16 — Schema Sync + LOST Stage + Governance Docs

**Duration:** ~1 hour
**Changes:**
1. Added `Lead.source` column to CockroachDB via direct SQL
2. Added `Reports` NavigationItem to CockroachDB via direct SQL
3. Added `LOST` stage to LeadStage table — verified 8 stages on production API
4. Updated Cckr-CONFIG-REFERENCE.md — complete rewrite with deploy via CLI only, schema via manual SQL
5. Added 4 new issues to Cckr-LEARNING-FROM-MISTAKES.md (prisma db push fails, Vercel free plan, provider mismatch, email mismatch)
6. Updated Cckr-GOVERNANCE.md with CLI deploy command and manual SQL schema change command
7. Added 10s timeout to git fetch in Cckr-preflight-check.sh (prevents hang on slow network)
8. Updated Cckr-DEPLOYMENT_LOG.md with deployment history
9. Updated Cckr-DB-CHANGES.md with verified columns

**Verified:**
- `project-10o7w.vercel.app/api/leads/stages` returns 8 stages (including LOST)
- `project-10o7w.vercel.app/api/navigation` returns 19 items (including Reports)
- `project-10o7w.vercel.app/api/tickets` returns 6 tickets
- All 12 preflight checks pass

**Status:** Schema synced with dev/QA. All admin features working.

---

## Next Steps
1. Push governance files to Gorasa-Cockroach repo
2. Keep schema in sync when new columns/tables are added to dev/QA
3. Monitor CockroachDB free tier usage (50M RUs/month)

---

## Appendix A: Commit History

# GoRASA CockroachDB Standalone — Change Log

> **Purpose:** Record of all significant changes with commit SHAs.

---

| Date | Commit | Description |
|------|--------|-------------|
| 2026-06-16 | (manual SQL) | Added LOST stage to LeadStage table — verified 8 stages on production |
| 2026-06-16 | (manual SQL) | Added Lead.source column to CockroachDB |
| 2026-06-16 | (manual SQL) | Added Reports NavigationItem to CockroachDB |
| 2026-06-16 | (CLI deploy) | Full code sync from dev — all admin features, reports, tickets, leads |
| 2026-06-16 | ba146a5 | docs: update Cckr-CONFIG-REFERENCE.md — deploy via CLI, schema via manual SQL, 12 preflight checks |
| 2026-06-16 | ba146a5 | docs: add 4 new issues to Cckr-LEARNING-FROM-MISTAKES.md |
| 2026-06-16 | ba146a5 | docs: update Cckr-GOVERNANCE.md with CLI deploy command |
| 2026-06-16 | ba146a5 | fix: add 10s timeout to git fetch in Cckr-preflight-check.sh |
| 2026-06-15 | (pending) | feat: cockroach-standalone governance — 11 docs + scripts |
| 2026-06-15 | (pending) | feat: migrate 31 tables, 249 rows from Supabase to CockroachDB |
| 2026-06-15 | (pending) | feat: rewrite 9 files to use Prisma directly |
| 2026-06-15 | (pending) | feat: create Vercel project project-10o7w |
| 2026-06-15 | (pending) | feat: set up Gorasa-Cockroach GitHub repo |
| 2026-06-15 | (pending) | feat: rename 11 governance files with Cckr prefix + update cross-refs in GOVERNANCE.md, preflight, post-task |
| 2026-06-15 | (pending) | feat: dual-instance governance architecture — detection script + conditional protocol switching |
| 2026-06-15 | (pending) | feat: create scripts/detect-governance-root.sh for PWD-based protocol selection |
| 2026-06-15 | (pending) | feat: update Cckr-preflight-check.sh and Cckr-post-task-check.sh to use detection |
| 2026-06-15 | (pending) | feat: update root scripts/preflight-check.sh and post-task-check.sh to use detection |
| 2026-06-15 | (pending) | feat: document dual-instance architecture in Cckr-GOVERNANCE.md |

---

## Appendix B: Deployment History

# GoRASA CockroachDB Standalone — Deployment Log

> **Purpose:** Track all deployments with commit SHA and status.

---

| Date | Commit | Project | Status | URL | Notes |
|------|--------|---------|--------|-----|-------|
| 2026-06-15 | (baseline) | project-10o7w | ✅ Ready | https://project-10o7w.vercel.app | Initial CockroachDB deploy — 31 tables, 249 rows |
| 2026-06-15 | b1dc1ed | cckr | ✅ Ready | https://project-10o7w.vercel.app | Full code sync from dev — all admin features, reports, tickets, leads |
| 2026-06-15 | (manual SQL) | cckr | ✅ Ready | https://project-10o7w.vercel.app | Added Lead.source + NavigationItem Reports — schema now matches dev/QA |

---

## Appendix C: Issues & Learnings

# GoRASA CockroachDB Standalone — Learning from Mistakes

> **Purpose:** Track all issues taking >30 minutes to debug.

---

### Issue 001 — FK Constraint Blocked Imports

- **Date:** 2026-06-15
- **Duration:** ~15 min
- **Severity:** Medium
- **Symptoms:** CockroachDB import failed on tables with FK references to other tables
- **Root Cause:** FK constraints were active when trying to import data — tables needed to be loaded in dependency order
- **Resolution:** Dropped all 14 FK constraints before import, re-added after all data loaded
- **Lesson:** Always disable FK constraints before bulk data import; re-enable after
- **Prevention:** Make FK-disable step part of any migration script

### Issue 002 — prisma db push Fails on CockroachDB (ALTER COLUMN TYPE)

- **Date:** 2026-06-15
- **Duration:** ~45 min
- **Severity:** High
- **Symptoms:** `npx prisma db push --accept-data-loss` failed with: "ALTER COLUMN TYPE is only implemented in the declarative schema changer"
- **Root Cause:** Prisma detected schema drift (NavigationItem.id `@default(uuid())` vs existing `@default(dbgenerated(...))`) and tried to ALTER COLUMN TYPE, which CockroachDB doesn't support via `prisma db push`
- **Resolution:** Removed `prisma db push` from vercel.json build command. Schema changes applied manually via direct SQL.
- **Lesson:** NEVER add `prisma db push` to CockroachDB build commands. Use manual SQL for schema changes.
- **Prevention:** vercel.json must be `npx prisma generate && npx next build` only

### Issue 003 — Vercel Free Plan Blocks GitHub Actions Deploys

- **Date:** 2026-06-15
- **Duration:** ~30 min
- **Severity:** High
- **Symptoms:** Deployment status "BLOCKED" — "commit email could not be matched to a GitHub account"
- **Root Cause:** Vercel free plan cannot connect to GitHub org repos. GitHub Actions workflow runs but Vercel rejects the deploy.
- **Resolution:** Deploy via Vercel CLI directly: `vercel deploy --prod --yes --token=<TOKEN> --scope="nikhil-gorasa-s-projects"`
- **Lesson:** cckr project has NO GitHub integration. All deploys must use Vercel CLI from `gorasa-next/` directory.
- **Prevention:** Never trigger GitHub Actions for cckr deploys. Always use CLI.

### Issue 004 — Prisma Provider Must Be postgresql, Not cockroachdb

- **Date:** 2026-06-15
- **Duration:** ~15 min
- **Severity:** Medium
- **Symptoms:** `prisma db push` error: "You are trying to connect to a CockroachDB database, but the provider in your Prisma schema is postgresql"
- **Root Cause:** Prisma validates provider against the actual database type. CockroachDB requires `provider = "cockroachdb"` for `prisma db push`, but this causes ALTER COLUMN TYPE failures.
- **Resolution:** Keep `provider = "postgresql"` in schema. Skip `prisma db push` entirely. Apply schema changes via direct SQL.
- **Lesson:** CockroachDB supports PostgreSQL wire protocol — `postgresql` provider works for Prisma client. Only `prisma db push` has issues.
- **Prevention:** Never change provider to `cockroachdb`. Use `postgresql` + manual SQL for schema changes.

### Issue 005 — Commit Email Must Match GitHub Account

- **Date:** 2026-06-15
- **Duration:** ~10 min
- **Severity:** Medium
- **Symptoms:** Vercel deploy blocked — "commit email nikhil@cryptomite.win could not be matched to a GitHub account"
- **Root Cause:** Git config email doesn't match any GitHub account. Vercel requires commit email to match for security.
- **Resolution:** Set git email to match GitHub account before pushing.
- **Lesson:** Always verify `git config user.email` matches a GitHub account before pushing to cockroach remote.
- **Prevention:** Add email check to Cckr-preflight-check.sh

---

## Appendix D: Sprint Tracking

# Sprint 1 — CockroachDB Standalone Setup

> **Goal:** Migrate gorasa-next from Supabase to CockroachDB on a standalone repo + Vercel project.
> **Timeline:** June 15, 2026

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done |
| 🔄 | In Progress |
| 📋 | Planned |
| ⏳ | Blocked |

---

## Tasks

### Phase 1: Database Migration ✅

| Task | Status | Notes |
|------|--------|-------|
| Export all tables from Supabase | ✅ | 31 tables, 249 rows |
| Import to CockroachDB cluster | ✅ | aqua-pony-27730 |
| Drop FK constraints before import | ✅ | All 14 dropped |
| Re-add FK constraints after import | ✅ | All 14 restored |
| Verify row counts match | ✅ | Exact match |

### Phase 2: Code Migration ✅

| Task | Status | Notes |
|------|--------|-------|
| Rewrite 9 files to use Prisma directly | ✅ | No more `createClient` from `@supabase/supabase-js` |
| TypeScript compiles cleanly | ✅ | `npx tsc --noEmit` passes |
| Remove dual-mode code | ✅ | No `DATABASE_PROVIDER` switch |

### Phase 3: Vercel Setup ✅

| Task | Status | Notes |
|------|--------|-------|
| Create new Vercel project | ✅ | project-10o7w |
| Set environment variables | ✅ | 10+ env vars configured |
| Deploy to Vercel | ✅ | Homepage 200, API endpoints working |

### Phase 4: GitHub Setup ✅

| Task | Status | Notes |
|------|--------|-------|
| Create new repo | ✅ | Gorasa-In-2026/Gorasa-Cockroach |
| Add git remote | ✅ | origin → new repo, old-pipeline → old repo |
| Push code to main | ✅ | Current codebase on main |

### Phase 5: Governance 🔄

| Task | Status | Notes |
|------|--------|-------|
| Create GOVERNANCE.md | ✅ | Parallel protocol for CRDB standalone |
| Create MEMORY.md | ✅ | Session memory |
| Create CHANGE-LOG.md | ✅ | Change tracking |
| Create CONFIG-REFERENCE.md | ✅ | Configuration source of truth |
| Create LEARNING-FROM-MISTAKES.md | ✅ | Issue tracking |
| Create DEPLOYMENT_LOG.md | ✅ | Deployment history |
| Create Sprint-1.md | 🔄 | This document |
| Create DB-CHANGES.md | ✅ | DB change tracking |
| Create preflight/post-task scripts | ✅ | Parallel check scripts |
| Create docs/adr/ directory | ✅ | ADR location |

### Phase 6: Verification 📋

| Task | Status | Notes |
|------|--------|-------|
| Link Vercel to Gorasa-Cockroach repo | 📋 | Auto-deploy off |
| Push governance files to repo | 📋 | All committed and pushed |
| Verify all API endpoints | 📋 | Smoke test |

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Pipeline | Standalone, separate from DEV/QA/PROD | Keep existing pipeline untouched |
| Deploy | Manual push to main (no auto-deploy) | User controls when to deploy |
| DB | CockroachDB Basic (free tier) | 50M RUs/mo, 10 GiB — sufficient |
| Auth | Supabase (unchanged) | Independent from DB, no migration needed |
| Git merge | Manual cherry-picks from dev/qa | No automated sync between repos |
| Governance | Parallel `cockroach-standalone/` directory | Beside the code, not inside it |

---

## Appendix E: Governance Protocol

# GoRASA CockroachDB Standalone — Governance

> **This governance framework is MANDATORY for all work on the CockroachDB standalone deployment.**
> **It mirrors the GoRASA governance protocol but adapted for a single-branch, single-DB, no-staging pipeline.**
> **Non-compliance will result in incomplete work being rejected.**

---

## ⚠️ READ DEPLOY.md FIRST

**Before ANY deployment, read `../DEPLOY.md`** — it covers ALL projects (main pipeline + cockroach standalone).

```bash
cat ../DEPLOY.md
```

**Run command guard before ANY shell command:**
```bash
bash ../scripts/command-guard.sh "your command here"
```

---

## ⛔ BLOCKED ACTIONS

**NEVER DELETE:**
- `.env.local` — contains ALL credentials
- `.vercel/` — links to Vercel
- `vercel.json` — build config
- `prisma/schema.prisma` — database schema
- `.github/workflows/*.yml` — deploy automation

**NEVER RUN:**
- `vercel deploy --prod` — use PR instead
- `vercel env add` — ask user first
- `vercel link` — breaks config
- `rm .env.local` — deletes credentials
- `git push --force` — breaks history

**NEVER CHANGE WITHOUT USER APPROVAL:**
- Git remotes
- GitHub Actions workflows
- Vercel environment variables
- Supabase credentials
- Prisma schema

---

## Dual-Instance Architecture

This repository contains **two separate governance protocol instances** that coexist and activate conditionally based on the working directory:

| Instance | Root Directory | Prefix | Scripts | Source of Truth |
|----------|---------------|--------|---------|-----------------|
| **GoRASA Main** | `rasa-zero-app-main/` | (none) | `scripts/preflight-check.sh`, `scripts/post-task-check.sh` | `gorasa-next/AGENTS.md` |
| **Cockroach (Cckr)** | `cockroach-standalone/` | `Cckr-` | `scripts/Cckr-preflight-check.sh`, `scripts/Cckr-post-task-check.sh` | `Cckr-GOVERNANCE.md` |

### Activation Rule

| If invoked/PWD is... | Use this protocol | Read these docs | Run this script |
|---|---|---|---|
| `rasa-zero-app-main/` or any subdir (except `cockroach-standalone/`) | **GoRASA Main** | `MEMORY.md`, `CHANGE-LOG.md`, `CONFIG-REFERENCE.md`, `LEARNING-FROM-MISTAKES.md`, `DEPLOYMENT_LOG.md`, `Sprint-1.md` | `scripts/preflight-check.sh` |
| `rasa-zero-app-main/cockroach-standalone/` | **Cockroach (Cckr)** | `Cckr-MEMORY.md`, `Cckr-CHANGE-LOG.md`, `Cckr-CONFIG-REFERENCE.md`, `Cckr-LEARNING-FROM-MISTAKES.md`, `Cckr-DEPLOYMENT_LOG.md`, `Cckr-Sprint-1.md` | `scripts/Cckr-preflight-check.sh` |

### Detection Mechanism

A shared detection script at `scripts/detect-governance-root.sh` (in both roots) resolves the active instance by inspecting `$PWD`. All governance scripts use it to self-select the correct protocol, docs, and prefixes.

```
detect-governance-root.sh
  ├── $PWD matches */cockroach-standalone* → GOVERNANCE_TYPE=cckr
  └── $PWD matches everything else         → GOVERNANCE_TYPE=main
```

### File Resolution

All governance doc paths, script paths, and prefixes are derived from `GOVERNANCE_ROOT` and `GOVERNANCE_TYPE` — enabling all 8 post-task targets and 6 pre-flight docs to resolve correctly for either instance.

---

## Architecture Overview

```
GitHub: Gorasa-In-2026/Gorasa-Cockroach (main branch)
         ↓ Vercel CLI deploy (no GitHub integration — free plan)
Vercel: project-10o7w / cckr (gorasa-next deployed)
         ↓
DB:     CockroachDB cluster aqua-pony-27730 (Prisma client)
Auth:   Supabase (isubgeemvhvhnhikxbjb) — kept as-is, NOT migrated
```

**Key differences from the DEV/QA/PROD pipeline:**
- Single `main` branch — no dev/qa/staging branches
- **No GitHub integration** — Vercel free plan, deploy via CLI only
- CockroachDB is the only database (no dual-mode, no `DATABASE_PROVIDER` switch)
- Prisma is the only DB client (provider = `postgresql`, NOT `cockroachdb`)
- Supabase Auth remains unchanged (independent from DB)
- All 31 tables, 249+ rows migrated, 14 FK constraints restored
- Schema changes must be applied via **manual SQL** (not `prisma db push`)

### Deploy Command
```bash
cd gorasa-next
vercel deploy --prod --yes --token=<VERCEL_TOKEN> --scope="nikhil-gorasa-s-projects"
```

### Schema Change Command
```bash
node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: '<COCKROACH_URL>' });
c.connect().then(() => c.query('ALTER TABLE ...')).then(() => { console.log('Done'); c.end(); });
"
```

---

## Operational Modes

### Plan Mode (Read-Only)
- **Only read and analyze** — no file changes, no shell commands, no commits
- Use for: research, analysis, planning, investigation
- Can read files, search code, create plans

### Build Mode (Read-Write)
- **Full access** — edit files, run commands, commit, deploy
- Use for: implementation, fixes, deployments
- Must still follow governance protocol before making changes

---

## Pre-Flight Checklist (MANDATORY)

**Before starting ANY significant work:**

### 1. Read Project Documentation
```bash
cat Cckr-MEMORY.md
cat Cckr-LEARNING-FROM-MISTAKES.md
cat Cckr-CONFIG-REFERENCE.md
cat Cckr-DEPLOYMENT_LOG.md
cat ../gorasa-next/AGENTS.md
```

### 2. Check Current State
```bash
git status
git log --oneline -5
cd ../gorasa-next && npx tsc --noEmit
```

---

## Post-Task Checklist (MANDATORY)

**After completing ANY significant task:**

### 1. Update Learning Log
If debugging took >30 minutes, update `Cckr-LEARNING-FROM-MISTAKES.md` with sequential issue entry.

### 2. Update Deployment Log
If deployment changed, update `Cckr-DEPLOYMENT_LOG.md` with date, commit SHA, status, URL.

### 3. Create ADR (if architectural decision)
Create `docs/adr/ADR-YYYYMMDD-NNN-title.md` with status, context, decision, consequences.

---

## Enforcement Rules

### Rule 1: No Changes Without Context
Read project docs and understand current state before making changes.

### Rule 2: Document All Issues
Every >30min debug session → `Cckr-LEARNING-FROM-MISTAKES.md` with root cause + prevention.

### Rule 3: Track All Deployments
Every deployment → `Cckr-DEPLOYMENT_LOG.md` with commit SHA, status, URL.

### Rule 4: Architectural Decisions Need ADRs
Significant decisions → ADR in `docs/adr/` with status tracking.

### Rule 5: Verification Before Completion
- TypeScript must compile (`npx tsc --noEmit`)
- Vercel deploy must return HTTP 200
- DB must be reachable via Prisma
- Docs updated (Cckr-MEMORY, Cckr-CHANGE-LOG, Cckr-CONFIG-REFERENCE)

### Rule 6: NEVER Force-Push to main
**NEVER force-push to `main` on Gorasa-Cockroach.** Always use normal push or PR.

---

## Files to Read Before Starting
1. `Cckr-MEMORY.md` — Session memory
2. `Cckr-LEARNING-FROM-MISTAKES.md` — Known issues
3. `Cckr-CONFIG-REFERENCE.md` — Configuration
4. `Cckr-DEPLOYMENT_LOG.md` — Deployment history
5. `Cckr-CHANGE-LOG.md` — Change log
6. `../gorasa-next/AGENTS.md` — Original governance protocol

## Files to Update After Work
1. `Cckr-CHANGE-LOG.md` — Always
2. `Cckr-MEMORY.md` — Always
3. `Cckr-LEARNING-FROM-MISTAKES.md` — If debugging >30 min
4. `Cckr-DEPLOYMENT_LOG.md` — If deployment changed
5. `docs/adr/` — If architectural decision
6. `Cckr-CONFIG-REFERENCE.md` — If config/keys/remotes changed
7. `Cckr-DB-CHANGES.md` — If any DB schema or data changes

---

## Non-Compliance Protocol
1. **Immediate:** Document what was missed
2. **Corrective:** Update missing documentation
3. **Preventive:** Add to Cckr-LEARNING-FROM-MISTAKES.md
4. **Process:** Update governance framework if needed

---

*This framework ensures consistent, auditable practices for the CockroachDB standalone deployment.*

---

## Appendix F: Database Changes

# GoRASA CockroachDB Standalone — DB Changes

> **Purpose:** Track all database schema and data changes on CockroachDB.

---

## Baseline (2026-06-15)

**Cluster:** CockroachDB Basic (see `.secrets.local` for connection string)

### Tables (31)

| Table | Rows | Notes |
|-------|------|-------|
| Activity | 3 | Tour activities |
| Booking | 17 | Flight/hotel/package bookings |
| CancellationRequest | — | Cancellation tracking |
| Category | — | Package categories |
| City | 35 | Flight/hotel city dropdowns |
| Company | 2 | Corporate accounts |
| FaqCategory | 6 | Support FAQ categories |
| FaqItem | — | FAQ items |
| FooterLink | 8 | Footer navigation |
| Lead | 10 | Sales leads |
| LeadStage | 7 | Pipeline stages |
| LoyaltyPointsHistory | — | Points tracking |
| NavigationItem | 14 | Navbar items |
| Package | 12 | Travel packages |
| PackageCategory | 6 | Carousel categories |
| Payment | — | Payment records |
| PreferenceOption | 15 | Profile preferences |
| PricingRule | 5 | Pricing rules |
| Profile | — | User profiles |
| PromoCode | 3 | Promo codes |
| QuickTopUpAmount | 4 | B2B wallet amounts |
| Reward | 6 | Loyalty rewards |
| Role | 5 | User roles |
| SiteConfig | 5 | Site configuration |
| Ticket | 3 | Support tickets |
| TicketActivity | — | Ticket activity log |
| TicketNote | — | Ticket notes |
| TopUpHistory | — | Wallet top-ups |
| User | 6 | Application users |
| ValueProposition | 4 | Homepage value props |
| Wishlist | — | Saved destinations |

### Foreign Key Constraints (14)

All 14 FK constraints re-added after migration:
- User → Role
- Lead → User (assignedTo), Lead → Company, Lead → LeadStage
- Booking → User, Booking → Package
- Payment → Booking
- Ticket → User (createdBy), Ticket → User (assignedTo)
- TicketNote → Ticket, TicketNote → User
- TicketActivity → Ticket, TicketActivity → User (createdBy)
- LoyaltyPointsHistory → User, LoyaltyPointsHistory → Reward
- TopUpHistory → Company

---

### Changes Since Baseline

| Date | Type | Table(s) | Description |
|------|------|----------|-------------|
| 2026-06-15 | SCHEMA | Lead | Added `source TEXT DEFAULT 'manual'` |
| 2026-06-15 | DATA | NavigationItem | Added "Reports" (id=ccc3cf13, sort=13, admin) |

### Verified Columns (CockroachDB)

**Booking:** id, userId, type, itemName, providerOrAirline, price, originalPrice, discountApplied, couponCodeUsed, status, pnr, seatOrRoom, leadGuestPan, paxCount, travelDates, bookedAt, updatedAt, paymentStatus, confirmedAt, promoCost

**Payment:** id, bookingId, amount, method, status, phonepeId, createdAt, updatedAt, gateway, orderId, paymentId, signature, failureReason, refundedAt, refundAmount, metadata

**Lead:** id, destination, travelerName, travelerEmail, travelerPhone, numberOfDays, inclusions, specificDemands, notes, stage, assignedTo, source, createdAt, updatedAt

**tickets:** id, subject, description, category, priority, status, user_id, user_name, user_email, user_phone, booking_ref, assigned_to, assigned_to_name, created_at, updated_at, resolved_at, closed_at

**ticket_activities:** id, ticket_id, action, performed_by, details, created_at

**ticket_notes:** id, ticket_id, author, author_role, content, is_internal, created_at

### Connection

Stored in `.secrets.local` (repo root, gitignored). Never print, log, or commit connection strings.

---

## Change Table

| Version | Date | Author | Change | Section |
|---------|------|--------|--------|---------|
| 1.0 | 2026-06-16 | AI | Initial merge from Cckr-MEMORY.md, Cckr-CHANGE-LOG.md, Cckr-DEPLOYMENT_LOG.md, Cckr-LEARNING-FROM-MISTAKES.md, Cckr-Sprint-1.md, Cckr-GOVERNANCE.md, Cckr-DB-CHANGES.md | All |
| 1.1 | 2026-06-18 | AI | Complete Supabase removal: deleted supabase files/libs/dir, rewrote all db/*.ts to Prisma-only, fixed 12 API routes, removed @supabase/ssr & @supabase/supabase-js deps, cleaned .env.example | Supabase → Prisma cleanup |
