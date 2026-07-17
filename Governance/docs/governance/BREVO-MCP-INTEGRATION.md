# Brevo MCP Integration Plan — `gorasa-crdb-standalone`

> **Status:** MCP configured + token stored. AWAITING opencode restart to activate.
> **Date:** 2026-07-18
> **Governance:** Token stored in `.env.local` (gitignored) via EnvSitter — NOT committed, NOT deployed. Config in `.opencode/opencode.json`.

---

## 5. Token received & stored (2026-07-18)

- User provided a token. Decoded shape: `{"api_key":"xkeysib-..."}` — this is a **standard Brevo API key** (`xkeysib-` prefix), NOT a dedicated MCP server token.
- Stored via `envsitter_set` into `.env.local` as `BREVO_MCP_TOKEN` (line 43). Confirmed gitignored, not committed.
- ⚠️ **Caveat:** Brevo's official MCP server expects a token generated with the **"Create MCP server API key"** option enabled. A standard API key *may* not authenticate against `https://mcp.brevo.com`. If the `brevo` MCP fails to connect after restart, regenerate the key with the MCP option and re-store it.
- Next: restart opencode so it resolves `${BREVO_MCP_TOKEN}` from `.env.local` and activates the `brevo` MCP server. Verify with a tool listing or natural-language test: *"List my Brevo sender domains and their verification status."*

---

## 1. Does an official Brevo MCP exist?

**YES — official, vendor-hosted (Brevo).** No need to build or self-host.

- Brevo shipped an official MCP server (announced Oct 14, 2025; now GA with **193 tools auto-generated from their OpenAPI spec** as of the 2026-07-02 changelog).
- It is **remote-hosted** at `https://mcp.brevo.com` — no npm install, no Docker, no local build.
- Works with Claude Desktop, Cursor, VS Code, Windsurf, Cline, and opencode (remote `type`).
- It exposes **27 focused sub-servers** (e.g. `senders`, `domains`, `contacts`, `lists`, `templates`, `transac_templates`, `campaign_analytics`) plus one combined main server.

### Why not a community server?
Community servers exist (`samihalawa/brevo-mcp`, `BusyBee3333/brevo-mcp-2026-complete`, `apicolet/brevo-mcp`) but are unofficial, lower-quality (0–3 stars, unmaintained) and would require local install of dependencies. The official remote server is the correct, low-risk choice for this governed project.

---

## 2. MCP config snippet (ready to paste) — DONE

Added to **`.opencode/opencode.json`** (project-local override; already written):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "neon_*": "deny",
    "supabase_*": "deny"
  },
  "mcp": {
    "brevo": {
      "type": "remote",
      "url": "https://mcp.brevo.com/v1/brevo/mcp",
      "headers": {
        "Authorization": "Bearer ${BREVO_MCP_TOKEN}"
      },
      "enabled": true
    }
  }
}
```

- `${BREVO_MCP_TOKEN}` is resolved from the environment. **Do NOT hardcode it.**
- To use a focused subset instead of all 27 modules, swap the `url` for one of the individual endpoints, e.g. senders+domains only:
  - `https://mcp.brevo.com/v1/brevo_senders/mcp`
  - `https://mcp.brevo.com/v1/brevo_domains/mcp`

---

## 3. Brevo capabilities needed for "check and ready email settings"

The goal is to let the agent **verify and ready** the app's email configuration. Mapped to Brevo MCP tools:

| Need | Brevo module / server | MCP capability (examples) |
|---|---|---|
| Verify sender domains are authenticated (SPF/DKIM) | **`domains`** (`/v1/brevo_domains/mcp`) | List domains, check verification/authentication status |
| Verify sender identities (from-addresses) are validated | **`senders`** (`/v1/brevo_senders/mcp`) | List sender identities, check validation status |
| Inspect transactional / SMTP config | **Account + transactional** (main server) | Read account info, SMTP settings, transactional template list |
| Confirm transactional email templates exist | **`transac_templates`** (`/v1/brevo_transac_templates/mcp`) | List templates used for app emails (booking confirmations, OTPs, etc.) |
| Validate contact lists for marketing/newsletter | **`lists`** / **`contacts`** | List contact lists, count contacts |
| Check campaign status (if used) | **`campaign_analytics`** / **`email_campaign_management`** | List campaigns, read send/stats status |
| Webhook / event config for email events | **`webhooks_management`** | List/verify webhooks (delivery, open, bounce) |

The **main server** (`/v1/brevo/mcp`) covers all of the above in one connection (27 modules, 193 tools). For a leaner, higher-quality tool set focused only on "email settings", connect these three individual servers instead: `brevo_senders`, `brevo_domains`, `brevo_transac_templates`.

---

## 4. Exact next step for the user (provide the token safely)

Brevo's MCP uses a **dedicated MCP token**, NOT the regular API key. It is generated from the same API-key screen with the "Create MCP server API key" option enabled.

### Step A — Generate the token (user, in Brevo dashboard)
1. Log in to Brevo → **Account > SMTP & API > API Keys & MCP** (`https://app.brevo.com/settings/keys/smtp`).
2. Generate a new API key (name it e.g. `gorasa-cckr-mcp`).
3. **Enable the "Create MCP server API key" option** when generating.
4. Copy the MCP token (shown once only).

### Step B — Drop the token safely (NO commit, NO hardcode)
The token must go into the **DEV env file** `.env.local` (already gitignored) via EnvSitter — never committed.

Run (I will execute once you paste the token):
```bash
envsitter_set --filePath .env.local --key BREVO_MCP_TOKEN --value "<PASTE TOKEN>" --write true
```

> Note: opencode resolves `${BREVO_MCP_TOKEN}` from the environment. Because `.env.local` is loaded by the Next.js/Vercel runtime, ensure the dev shell/Vercel env also exposes `BREVO_MCP_TOKEN` to the opencode process (or export it in the shell that launches opencode). The token is **not** used by the app itself — it is only for the MCP server connection.

### Step C — Activate
Restart opencode (or run a session reload) so it picks up the new `brevo` MCP server. Verify with `opencode tools` / a quick natural-language test: *"List my Brevo sender domains and their verification status."*

---

## Constraints respected
- ✅ No credentials added or requested.
- ✅ `.env.local` / `.env.production` not deleted or modified.
- ✅ No `git push --force`, no schema change, no API-config change.
- ✅ Nothing committed, nothing deployed.
- ✅ Config placed in project-local `.opencode/opencode.json` (not the global config).
