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

### Issue 002 — Agent Hallucinated Neon/Supabase MCP Access for CockroachDB

- **Date:** 2026-06-26
- **Duration:** ~15 min
- **Severity:** Medium
- **Symptoms:** Agent called `general` and `gorasa-governance` subagents expecting them to use Neon/Supabase MCP tools to retrieve CockroachDB DATABASE_URL. Neon and Supabase were fully purged from the project in Session 4.
- **Root Cause:** The agent's available tools listed Neon and Supabase MCPs (configured at user-level). The agent bypassed reading governance docs first and assumed these MCPs could access CockroachDB clusters. The `gorasa-governance` agent description also failed to mention it cannot access external MCPs.
- **Resolution:** User clarified that credentials are in `secrets.file` and Vercel env vars. Stopped calling subagents and read docs directly.
- **Prevention:** (1) Never call any MCP-based subagent expecting it to retrieve credentials — credentials come from `secrets.file`, Vercel env vars, or CockroachDB Cloud console. (2) Always read AGENTS.md and session log before taking action. (3) The gorasa-governance agent must mention in its description that it cannot fetch credentials — it only validates governance rules.

### Issue 003 — Hardcoded Governance Script Paths

- **Date:** 2026-06-19
- **Duration:** ~30 min
- **Severity:** Medium
- **Symptoms:** `scripts/preflight-check.sh` failed with `governance-lib.sh: No such file or directory`. `Governance/scripts/detect-governance-root.sh` had hardcoded path to `/home/nikhil/Downloads/Gorasa/App-1/rasa-zero-app-main`.
- **Root Cause:** Scripts were copied from the main pipeline repo without updating paths for the standalone repo structure.
- **Resolution:** Rewrote all governance scripts to use relative path resolution from `$SCRIPT_DIR`.
- **Prevention:** Never hardcode absolute paths. Always use `$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)` for script directory resolution.
