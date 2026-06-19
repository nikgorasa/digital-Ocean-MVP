# GoRASA CockroachDB Standalone — Mistake Log

> **Purpose:** Append-only list of execution failures and boundary conditions.
> **Format:** `run-id | scenario | do-not-do | impact | next-run-guardrail`
> **Updated:** After every significant mistake or failure.

---

## Mistakes

| Run ID | Scenario | Do Not Do | Impact | Next Run Guardrail |
|--------|----------|-----------|--------|-------------------|
| CRDB-001 | Initial setup | Deploy without testing CockroachDB connectivity | Site down | Always verify DB connection before deploy |
| CRDB-002 | Session 2026-06-18 | Session log claimed Supabase files deleted but they still existed | 17 TypeScript errors, broken build | Verify claims with `grep` before marking complete |
| CRDB-003 | Session 2026-06-18 | Dual-mode `if (isPrisma())` pattern left in 10+ API routes after "cleanup" | Dead Supabase code paths, import errors | Rewrite files entirely, don't just delete branches |
