<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# GoRASA Project Governance

**Version:** 1.0.0 (see `docs/governance/VERSION.md`)

> This governance framework is MANDATORY for all work on this project.
> It ensures consistent practices across all AI models and sessions.
> Non-compliance will result in incomplete work being rejected.

---

## Before Starting

**Read `docs/governance/REQUIRED-FILES.md`** for the canonical list of required docs.

**Read `docs/governance/DEPLOY.md`** before pushing to any branch.

```bash
cat docs/governance/DEPLOY.md
cat docs/governance/REQUIRED-FILES.md
```

---

## Blocked Actions — NEVER Do These

**Check before running any command:**
```bash
bash scripts/command-guard.sh "your command here"
```

**NEVER DELETE (blanket ban):**
- `rm`, `unlink`, `rmdir` — blocked by command-guard.sh
- `.env.local`, `.secrets.local`, `.vercel/`, `prisma/schema.prisma`, `.github/workflows/*.yml`

**NEVER EXPOSE:**
- `.secrets.local`, `.env.local` — NEVER cat, echo, grep, or log contents
- Vercel/GitHub secret values — use `vercel env ls` / `gh secret list` (names only)

**NEVER RUN:**
- `vercel deploy --prod` — use PR instead
- `git push --force` — breaks history
- `gh api .../branches/main/protection --method DELETE` — removes branch protection

**⛔ NEVER PUSH DIRECTLY TO PROTECTED BRANCHES:**
- `git push origin main` — BLOCKED (use PR)
- `git push origin qa` — BLOCKED (use PR)
- `git push main` — BLOCKED (use PR)
- `git push qa` — BLOCKED (use PR)
- Only `git push origin dev` is allowed (auto-deploys)

**NEVER CHANGE WITHOUT USER APPROVAL:**
- Git remotes, GitHub Actions workflows, Vercel env vars, Supabase credentials, Prisma schema

**Full list:** See `scripts/command-guard.sh` BLOCKED_PATTERNS array.

---

## Operational Modes

### Plan Mode (Read-Only)
- Only read and analyze — no file changes, no shell commands, no commits
- Use for: research, analysis, planning, investigation

### Build Mode (Read-Write)
- Full access — edit files, run commands, commit, deploy
- Must follow governance protocol before making changes

---

## Pre-Flight Check (16 checks — MANDATORY)

**Before starting ANY significant work:**

```bash
bash scripts/preflight-check.sh
```

Checks: docs exist, session context, known issues, config reference, env vars, TypeScript, git status, recent commits, critical files, governance hooks, DB intent, Supabase shield, Vercel cross-ref, credential scan, commit traceability, DB schema sync.

---

## Post-Task Check (26 checks — MANDATORY)

**After completing ANY significant task:**

```bash
bash scripts/post-task-check.sh
```

Checks: docs exist, today's entry, mistake log, learning log, deployment log, config reference, env vars, TypeScript, build, git status, DB tables, RLS policies, API endpoints, critical components, governance hooks, session summary, stale patterns (x2), remote URL, deploy instructions, DB intent, schema sync, env git guard, credential scan, commit traceability, DB schema sync.

---

## Enforcement Rules

### Rule 1: No Changes Without Context
Never make significant changes without reading project documentation and generating a context brief.

### Rule 2: Document All Issues
Every issue >30 min must be documented in `docs/governance/LEARNING-FROM-MISTAKES.md`.

### Rule 3: Track All Deployments
Every deployment must be logged in `docs/governance/DEPLOYMENT-LOG.md`.

### Rule 4: Architectural Decisions Need ADRs
Any significant decision requires an ADR in `docs/adr/`.

### Rule 5: Verification Before Completion
TypeScript compilation must pass. Documentation must be updated. Deployment must be verified.

### Rule 6: NEVER Remove Branch Protection
**Hard ban with zero exceptions.** Never remove protection from `main` or `qa`.

- Never run `gh api .../branches/main/protection --method DELETE`
- Never use `--force` push to protected branches
- If protection is accidentally removed: `bash scripts/restore-protection.sh`

**Enforced by:** `scripts/branch-protection-guard.sh` + `hooks.yaml` + this rule.

### Rule 7: Governance Changes Require Version Bump
When changing governance rules, update `docs/governance/VERSION.md` and add entry to `docs/governance/CHANGE-LOG.md`.

---

## Quick Reference

### Files to Read Before Starting
1. `docs/governance/REQUIRED-FILES.md` — Canonical list of required docs
2. `docs/governance/SESSION-LOG.md` — Sprint status, session history
3. `docs/governance/CONFIG-REFERENCE.md` — Configuration reference

### Files to Update After Work
See `docs/governance/REQUIRED-FILES.md` "Update After Work" section — depends on change type.

### Commands to Run
```bash
# Before starting:
bash scripts/preflight-check.sh    # 16 checks

# After completing:
bash scripts/post-task-check.sh    # 26 checks

# Check command safety:
bash scripts/command-guard.sh "your command"
```

---

## Hooks

The `.opencode/hook/hooks.yaml` file automates governance checks:

| Event | Action |
|-------|--------|
| `pre_tool_use` (bash) | `command-guard.sh` — blocks dangerous commands |
| `session.start` | `branch-protection-guard.sh` + `preflight-check.sh` |
| `file.changed` (code) | `npx tsc --noEmit` |
| `file.changed` (any) | `governance-lib.sh check_docs` |
| `session.idle` | `branch-protection-guard.sh` + `post-task-check.sh` |
| `session.end` | `post-task-check.sh` |

---

## Governance Structure

```
docs/governance/
  README.md              — Index
  VERSION.md             — Current version
  REQUIRED-FILES.md      — Canonical required docs list
  SESSION-LOG.md         — Sprint tracking, session history
  CONFIG-REFERENCE.md    — Configuration reference
  DEPLOY.md              — Deployment instructions
  CHANGE-LOG.md          — Governance change log (append-only)
  MISTAKE-LOG.md         — Structured mistake entries
  DEPLOYMENT-LOG.md      — Deployment records
  DB-CHANGES.md          — Database changes
  LEARNING-FROM-MISTAKES.md — Issue deep-dives
  RUN-SNAPSHOTS/         — Run snapshot manifests

scripts/
  governance-lib.sh      — Shared check functions
  preflight-check.sh     — Pre-flight (16 checks)
  post-task-check.sh     — Post-task (26 checks)
  command-guard.sh       — Blocks dangerous commands
  branch-protection-guard.sh — Verifies branch protection
  restore-protection.sh  — Re-enables branch protection
  db-check.sh            — DB schema sync check
```

---

## Non-Compliance

If governance protocol is not followed:
1. Document what was missed
2. Update missing documentation
3. Add to `docs/governance/MISTAKE-LOG.md`
4. Update governance framework if needed

---

*This framework ensures consistent, auditable, and model-agnostic development practices for the GoRASA project.*
