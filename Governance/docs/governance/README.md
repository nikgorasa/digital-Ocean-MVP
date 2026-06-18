# GoRASA CockroachDB Standalone — Governance

> Single source of truth for all governance documentation.

---

## Structure

| File | Purpose | Updated |
|------|---------|---------|
| Cckr-SESSION-LOG.md | Sprint status, session history, progress | After every session |
| Cckr-CONFIG-REFERENCE.md | Configuration reference | When config changes |
| Cckr-CHANGE-LOG.md | Governance change log (append-only) | When rules change |
| Cckr-MISTAKE-LOG.md | Structured mistake entries | After every mistake |
| Cckr-REQUIRED-FILES.md | Canonical list of required docs | When adding/removing files |
| Cckr-VERSION.md | Governance version marker | When rules change |

---

## How to Use

### Before Starting Work
```bash
bash scripts/Cckr-preflight-check.sh
```

### After Completing Work
```bash
bash scripts/Cckr-post-task-check.sh
```
