# GoRASA CockroachDB Standalone — Required Files

> **Purpose:** Single source of truth for which governance files must exist and when to update them.
> **Referenced by:** `scripts/Cckr-preflight-check.sh`, `scripts/Cckr-post-task-check.sh`
> **Updated:** When adding or removing governance files.

---

## Always Required (must exist)

| File | Location | Purpose |
|------|----------|---------|
| Cckr-SESSION-LOG.md | cockroach-standalone/docs/governance/ | Sprint status, session history, progress |
| Cckr-CONFIG-REFERENCE.md | cockroach-standalone/docs/governance/ | Configuration reference |
| Cckr-CHANGE-LOG.md | cockroach-standalone/docs/governance/ | Governance change log (append-only) |
| Cckr-MISTAKE-LOG.md | cockroach-standalone/docs/governance/ | Structured mistake entries |
| Cckr-REQUIRED-FILES.md | cockroach-standalone/docs/governance/ | This file |
| Cckr-VERSION.md | cockroach-standalone/docs/governance/ | Governance version marker |

---

## Update After Work (depends on change type)

| Change Type | File to Update | When |
|-------------|---------------|------|
| Any significant work | Cckr-SESSION-LOG.md | Always |
| Schema or data change | Cckr-DB-CHANGES.md | When DB changes |
| Deployment | Cckr-DEPLOYMENT-LOG.md | When deploying |
| >30min debugging | Cckr-LEARNING-FROM-MISTAKES.md | When debugging >30min |
| Config/keys/remotes | Cckr-CONFIG-REFERENCE.md | When config changes |
| Governance rule change | Cckr-CHANGE-LOG.md + Cckr-VERSION.md | When rules change |
