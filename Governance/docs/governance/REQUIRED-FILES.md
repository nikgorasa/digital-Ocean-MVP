# GoRASA CockroachDB Standalone — Required Files

> **Purpose:** Single source of truth for which governance files must exist and when to update them.
> **Referenced by:** `Governance/scripts/Cckr-preflight-check.sh`, `Governance/scripts/Cckr-post-task-check.sh`
> **Updated:** 2026-06-19

---

## Always Required (must exist)

| File | Location | Purpose |
|------|----------|---------|
| Cckr-SESSION-LOG.md | Governance/docs/governance/ | Session history, current state, decisions |
| Cckr-CONFIG-REFERENCE.md | Governance/docs/governance/ | Configuration reference (dual DB, Vercel, auth) |
| CHANGE-LOG.md | Governance/docs/governance/ | Governance change log (append-only) |
| MISTAKE-LOG.md | Governance/docs/governance/ | Structured mistake entries |
| REQUIRED-FILES.md | Governance/docs/governance/ | This file |
| VERSION.md | Governance/docs/governance/ | Governance version marker |
| DB-CHANGES.md | Governance/docs/governance/ | DB schema and data changes |
| DEPLOYMENT-LOG.md | Governance/docs/governance/ | Deployment history |
| LEARNING-FROM-MISTAKES.md | Governance/docs/governance/ | Issue deep-dives (>30min debugging) |

---

## Update After Work (depends on change type)

| Change Type | File to Update | When |
|-------------|---------------|------|
| Any significant work | Cckr-SESSION-LOG.md | Always |
| Schema or data change | DB-CHANGES.md | When DB changes |
| Deployment | DEPLOYMENT-LOG.md | When deploying |
| >30min debugging | LEARNING-FROM-MISTAKES.md | When debugging >30min |
| Config/keys/remotes | Cckr-CONFIG-REFERENCE.md | When config changes |
| Governance rule change | CHANGE-LOG.md + VERSION.md | When rules change |
| Any mistake | MISTAKE-LOG.md | After every mistake |
