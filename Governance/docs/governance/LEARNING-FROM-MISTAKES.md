# GoRASA CockroachDB Standalone — Learning From Mistakes

> **Purpose:** Issue deep-dives for problems that took >30 minutes to debug.
> **Format:** `Issue # | Date | Duration | Severity | Symptoms | Root Cause | Resolution | Prevention`
> **Updated:** After every significant debugging session.

---

## Issues

### Issue 001 — Stale Supabase Code Left After "Cleanup"

- **Date:** 2026-06-19
- **Duration:** ~2 hours
- **Severity:** High
- **Symptoms:** 17 TypeScript errors after session 2026-06-18 claimed Supabase was fully removed. Files `supabase.ts`, `supabase-server.ts`, `supabase-admin.ts` still existed. 10+ API routes still had `if (isPrisma())` dual-mode branches importing `supabaseAdmin`.
- **Root Cause:** Session 2026-06-18 deleted some files but did not verify completeness. Dual-mode pattern was left in all `src/lib/db/*.ts` files and 10 API routes.
- **Resolution:** Complete rewrite of all 13 db files, 10 API routes, api-logger.ts. Deleted all stale files and scripts. Full `grep` verification after.
- **Prevention:** Always run `grep -rn "@supabase\|supabaseAdmin\|isPrisma" src/` after any cleanup. Never mark work complete without verification.

### Issue 002 — Hardcoded Governance Script Paths

- **Date:** 2026-06-19
- **Duration:** ~30 min
- **Severity:** Medium
- **Symptoms:** `scripts/preflight-check.sh` failed with `governance-lib.sh: No such file or directory`. `Governance/scripts/detect-governance-root.sh` had hardcoded path to `/home/nikhil/Downloads/Gorasa/App-1/rasa-zero-app-main`.
- **Root Cause:** Scripts were copied from the main pipeline repo without updating paths for the standalone repo structure.
- **Resolution:** Rewrote all governance scripts to use relative path resolution from `$SCRIPT_DIR`.
- **Prevention:** Never hardcode absolute paths. Always use `$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)` for script directory resolution.
