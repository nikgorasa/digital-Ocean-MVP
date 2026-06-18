# GoRASA CockroachDB Standalone — Mistake Log

> **Purpose:** Append-only list of execution failures and boundary conditions.
> **Format:** `run-id | scenario | do-not-do | impact | next-run-guardrail`
> **Updated:** After every significant mistake or failure.

---

## Mistakes

| Run ID | Scenario | Do Not Do | Impact | Next Run Guardrail |
|--------|----------|-----------|--------|-------------------|
| CRDB-001 | Initial setup | Deploy without testing CockroachDB connectivity | Site down | Always verify DB connection before deploy |
