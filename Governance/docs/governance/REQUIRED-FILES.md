# GoRASA CockroachDB Standalone — Required Files

> **Purpose:** Single source of truth for which governance files must exist and when to update them.
> **Referenced by:** `Governance/scripts/Cckr-preflight-check.sh`, `Governance/scripts/Cckr-post-task-check.sh`
> **Updated:** 2026-07-24

---

## Always Required (must exist)

| File | Location | Purpose |
|------|----------|---------|
| Cckr-SESSION-LOG.md | Governance/docs/governance/ | Session history, current state, decisions |
| Cckr-CONFIG-REFERENCE.md | Governance/docs/governance/ | Configuration reference (dual DB, Vercel, auth) |
| CHANGE-LOG.md | Governance/docs/governance/ | Governance change log (append-only) |
| MISTAKE-LOG.md | Governance/docs/governance/ | Structured mistake entries |
| REQUIRED-FILES.md | Governance/docs/governance/ | This file |
| VERSION.md | Governance/docs/governance/ | Governance version marker |
| DB-CHANGES.md | Governance/docs/governance/ | DB schema and data changes |
| DEPLOYMENT-LOG.md | Governance/docs/governance/ | Deployment history |
| LEARNING-FROM-MISTAKES.md | Governance/docs/governance/ | Issue deep-dives (>30min debugging) |
| DB-PLATFORM.md | Governance/docs/governance/ | Active DB platform identification (CockroachDB) |
| CONTEXT-AWARE-GOVERNANCE.md | Governance/docs/governance/ | Task-type routing, check mapping |
| SPRINT-PLAN.md | Governance/docs/governance/ | Sprint priorities, open issues |
| PRODUCT-PRICING.md | Governance/docs/governance/ | Pricing model, cost structures |
| CORPORATE-FLOW.md | Governance/docs/governance/ | Corporate booking flow state |
| EPIC-AIRPORT-DATA.md | Governance/docs/governance/ | Airport data epic status |
| BREVO-MCP-INTEGRATION.md | Governance/docs/governance/ | Brevo email integration status |
| README.md | Governance/docs/governance/ | Directory overview |

---

## Update After Work (depends on change type)

| Change Type | File to Update | When |
|-------------|---------------|------|
| Any significant work | Cckr-SESSION-LOG.md | Always |
| Schema or data change | DB-CHANGES.md | When DB changes |
| Deployment | DEPLOYMENT-LOG.md | When deploying |
| >30min debugging | LEARNING-FROM-MISTAKES.md | When debugging >30min |
| Config/keys/remotes | Cckr-CONFIG-REFERENCE.md | When config changes |
| Governance rule change | CHANGE-LOG.md + VERSION.md | When rules change |
| Any mistake | MISTAKE-LOG.md | After every mistake |
| Task type changes | CONTEXT-AWARE-GOVERNANCE.md | When task routing changes |
| Sprint priorities | SPRINT-PLAN.md | When sprint scope changes |
| Pricing changes | PRODUCT-PRICING.md | When costs/pricing change |
| Corporate flow state | CORPORATE-FLOW.md | When corporate booking changes |
| Airport data status | EPIC-AIRPORT-DATA.md | When airport epic progresses |
| Brevo integration | BREVO-MCP-INTEGRATION.md | When email integration changes |
