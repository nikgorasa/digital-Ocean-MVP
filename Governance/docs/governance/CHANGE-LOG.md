# GoRASA CockroachDB Standalone — Change Log

> **Purpose:** Governance change log. Append-only. Tracks rule changes, version bumps, and governance decisions.
> **Format:** `change-id | timestamp | author | reason | scope | rollback-note`
> **Updated:** After every governance rule change.

---

## Changes

| Change ID | Timestamp | Author | Reason | Scope | Rollback Note |
|-----------|-----------|--------|--------|-------|---------------|
| CRDB-GOV-001 | 2026-06-14 10:00 | System | Initial governance restructure | All | Restore from git history |
| CRDB-GOV-002 | 2026-06-19 10:00 | System | Full Supabase purge, dual DB isolation, governance script fixes | All code + scripts + env | Revert git commit |
| CRDB-GOV-003 | 2026-06-19 10:00 | System | Fixed detect-governance-root.sh hardcoded path | Governance/scripts | Revert git commit |
