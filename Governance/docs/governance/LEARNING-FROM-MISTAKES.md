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

### Issue 004 — Middleware Whitelist: API Routes Return 401 When Missing from PUBLIC_API_ROUTES

- **Date:** 2026-07-09
- **Duration:** ~15 min
- **Severity:** Medium
- **Symptoms:** Hotels page calling `/api/tbo-hotels` returned 401 Unauthorized. The middleware intercepted the request and rejected it because the route was not in the `PUBLIC_API_ROUTES` whitelist. Users must search hotels before logging in, so these routes must be accessible without a session cookie.
- **Root Cause:** When `/api/tbo-hotels` and related TBO API routes were added, there was no step in the workflow to check whether new API routes need to be added to the middleware `PUBLIC_API_ROUTES` whitelist. The middleware blocks all non-whitelisted API routes that lack a valid session cookie.
- **Resolution:** Added `/api/tbo-hotels`, `/api/tbo`, and `/api/tbo-flights` to the `PUBLIC_API_ROUTES` array in `src/middleware.ts`.
- **Prevention:** Any new API route must be evaluated for middleware whitelist inclusion. Specifically, if a route must be accessible without authentication (i.e., before the user logs in), it must be added to `PUBLIC_API_ROUTES` in `src/middleware.ts`. This is now a mandatory step in the API route creation checklist.

### Issue 005 — Type Mismatch: TBOFlightDisplay.duration (number) vs Flight.duration (string) Causes Silent React Crash

- **Date:** 2026-07-09
- **Duration:** ~20 min
- **Severity:** High
- **Symptoms:** Flight search on `/flights` page returns results from API (200 OK, 111 flights), but results never render. The search spinner transitions to a blank/empty state with no error message visible. The `handleSearch` function completes without exception, but the `useMemo` for `filteredResults` crashes silently when sorting calls `parseDuration()`.
- **Root Cause:** `TBOFlightDisplay.duration` is a `number` (minutes, e.g. 135), but `Flight.duration` is typed as `string`. The mapping in `handleSearch` assigns `duration: f.duration` directly, carrying the number through. When `sortFlights("best")` calls `parseDuration(a.duration || "")`, the runtime value is a number (e.g. 135). The function calls `duration.match(...)` which throws `TypeError: duration.match is not a function` because numbers don't have `.match()`. This propagates from `useMemo` into the React render cycle, causing a component crash. Additional cascading issues: `stops` was always `0` (not derived from segments), `cabinClass` number was used as `tier` label.
- **Resolution:** Added `formatDuration(minutes)` to convert number → string ("2h 15m"). Added `CABIN_CLASS_MAP` to map numeric codes to cabin labels. Derived `stops` from `segments[0].length - 1`. Updated mapping to handle all three correctly.
- **Prevention:** When mapping API response types to frontend display types, verify that field types match EXACTLY at runtime, not just in TypeScript. Numeric fields from the API that represent display-oriented values (duration, cabin class codes) must be converted to their display format in the mapping layer. Non-null assertions and `||` fallbacks mask type mismatches but don't prevent runtime crashes from method calls on wrong types. Always validate that any function expecting a string method (`.match()`, `.split()`, `.slice()`) will actually receive a string at runtime.

### Issue 006 — Return Flight Search: JourneyType=2 Requires 2 Segments, Code Sent 1

- **Date:** 2026-07-09
- **Duration:** ~15 min
- **Severity:** High
- **Symptoms:** One-way flight search works. Return flight search fails with "Flight search failed: Invalid segment length." The TBO API returns `ResponseStatus !== 1` with `ErrorMessage: "Invalid segment length"`.
- **Root Cause:** The TBO flight search API validates that the `Segments` array length must match `JourneyType`. For `JourneyType=2` (Return), exactly 2 segments are required — one for outbound (Origin→Destination) and one for inbound (Destination→Origin). The code always built a single segment regardless of `JourneyType`. The route handler also never forwarded the `returnDate` parameter from the frontend to `searchFlights()`.
- **Resolution:** Added `PreferredArrivalTime` param to `searchFlights`. For `JourneyType === 2` with a `PreferredArrivalTime`, the function now pushes a second segment with reversed origin/destination and the return date as `PreferredDepartureTime`. Also flattened both outbound/inbound result arrays with `.flat()` so inbound flights aren't discarded.
- **Prevention:** Any `JourneyType` value change must ensure `Segments` array length matches. Add a parameter validation check that asserts `Segments.length === JourneyType` (with special handling for JourneyType 5). The TBO API contract for Search requires exactly N segments where N = JourneyType (1 for one-way, 2 for return, 3+ for multi-city).
