# GoRASA CockroachDB Standalone — Governance

> Single source of truth for all governance documentation.
> **Last updated:** 2026-07-24

---

## Two Isolated Database Environments

| Environment | Env File | Vercel Project | URL |
|---|---|---|---|
| **DEV** | `.env.local` | `cckr` | https://cckr.vercel.app |
| **PROD** | `.env.production` | `cckr2` | https://project-yidb6.vercel.app |

Each connects to a **different CockroachDB cluster**. Zero shared data.

---

## Structure

| File | Purpose | Updated |
|------|---------|---------|
| Cckr-SESSION-LOG.md | Session history, current state, decisions | After every session |
| Cckr-CONFIG-REFERENCE.md | Configuration reference (dual DB, Vercel, auth) | When config changes |
| CHANGE-LOG.md | Governance change log (append-only) | When rules change |
| MISTAKE-LOG.md | Structured mistake entries | After every mistake |
| REQUIRED-FILES.md | Canonical list of required docs | When adding/removing files |
| VERSION.md | Governance version marker | When rules change |
| DB-CHANGES.md | DB schema and data changes | When DB changes |
| DEPLOYMENT-LOG.md | Deployment history | When deploying |
| LEARNING-FROM-MISTAKES.md | Issue deep-dives (>30min debugging) | After significant issues |
| DB-PLATFORM.md | Active DB platform identification | When platform changes |
| CONTEXT-AWARE-GOVERNANCE.md | Task-type routing, check mapping | When task routing changes |
| SPRINT-PLAN.md | Sprint priorities, open issues | When sprint scope changes |
| PRODUCT-PRICING.md | Pricing model, cost structures | When pricing changes |
| CORPORATE-FLOW.md | Corporate booking flow state | When corporate flow changes |
| EPIC-AIRPORT-DATA.md | Airport data epic status | When airport epic progresses |
| BREVO-MCP-INTEGRATION.md | Brevo email integration status | When email integration changes |
| README.md | This file | When structure changes |

---

## How to Use

### Before Starting Work
```bash
bash scripts/preflight-check.sh
```

### After Completing Work
```bash
bash scripts/post-task-check.sh
```
