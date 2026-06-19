<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# GoRASA CockroachDB Standalone — Governance

**Version:** 2.0.0

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

**Run the pre-flight check:**
```bash
bash scripts/preflight-check.sh
```

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

## Pre-Flight Check (12 checks — MANDATORY)

**Before starting ANY significant work:**

```bash
bash scripts/preflight-check.sh
```

Checks: docs exist, session context, config reference, env vars, TypeScript, git status, recent commits, no stale imports, vercel.json safety, Prisma provider, git email, dual DB isolation.

---

## Post-Task Check (8 checks — MANDATORY)

**After completing ANY significant task:**

```bash
bash scripts/post-task-check.sh
```

Checks: TypeScript, build, no stale imports, git status, session log, DB changes log, no stale env vars, dual DB isolation.

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

---

## Key Files

| File | Purpose |
|---|---|
| `Governance/docs/governance/Cckr-SESSION-LOG.md` | Session history |
| `Governance/docs/governance/Cckr-CONFIG-REFERENCE.md` | Configuration |
| `Governance/docs/governance/CHANGE-LOG.md` | Governance changes |
| `Governance/docs/governance/MISTAKE-LOG.md` | Mistakes |
| `Governance/docs/governance/DB-CHANGES.md` | DB changes |
| `Governance/docs/governance/DEPLOYMENT-LOG.md` | Deployments |
| `Governance/docs/governance/LEARNING-FROM-MISTAKES.md` | Issue deep-dives |

---

## Quick Reference

### Deploy
```bash
# DEV: push to main
git push origin main

# PROD: Vercel CLI
vercel deploy --prod --yes --token=$VERCEL_TOKEN
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
