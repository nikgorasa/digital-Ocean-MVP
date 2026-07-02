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
| CRDB-004 | Session 2026-06-25 (Session 5) | Re-ran already-completed TBO booking tests when user only asked "what did we do so far" | Wasted time + API calls confirming already-documented work | When user asks recap question, answer from session log. Do not take action unless asked. |
| CRDB-005 | Session 2026-06-26 (Session 6) | Called `general` and `gorasa-governance` subagents to fetch DATABASE_URL via Neon/Supabase MCPs — those platforms are fully purged from this project and their MCPs cannot access CockroachDB clusters | Wasted 2 subagent calls, confusion | Never call agents expecting Neon/Supabase MCPs to help with CockroachDB. This project has ZERO Neon/Supabase. CockroachDB credentials must come from `secrets.file`, Vercel env vars, or CockroachDB Cloud console. |
