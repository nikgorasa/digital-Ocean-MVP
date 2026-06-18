# GoRASA CockroachDB Standalone — Config Reference

> **Purpose:** Single source of truth for all configuration.
> **Read this BEFORE any deployment.**

---

## 1. Git Repository

| Property | Value |
|----------|-------|
| Remote | `https://github.com/Gorasa-In-2026/Gorasa-Cockroach.git` |
| Default branch | `main` |
| DEV branch | `main` (auto-deploy) |
| PROD branch | `production` (PR required) |

---

## 2. Vercel Projects

| Environment | Project Name | URL | Deploy Trigger |
|-------------|-------------|-----|----------------|
| **DEV** | cckr | `https://cckr.vercel.app` | GitHub Actions on push to `main` |
| **PROD** | cckr2 | `https://project-yidb6.vercel.app` | GitHub Actions on PR merge → `production` |

### Deploy via GitHub Actions (Vercel + GitHub Integration)

Both projects have GitHub integration enabled. Deploys are triggered by workflows:

- **DEV:** `.github/workflows/deploy-dev.yml` — auto-deploy on push to `main`
- **PROD:** `.github/workflows/deploy-prod.yml` — deploy on PR merge to `production`

### Manual Deploy (Fallback)

```bash
# DEV
vercel deploy --prod --yes --token=$VERCEL_TOKEN --scope="nikjp2021s-projects"

# PROD
vercel deploy --prod --yes --token=$VERCEL_TOKEN --scope="nikjp2021s-projects"
```

---

## 3. Database

| Property | Value |
|----------|-------|
| Provider | CockroachDB Basic (Serverless) |
| Cluster | `losing-cyclops-27787` |
| Database | `defaultdb` |
| Tables | 32 |
| Rows | 238+ |
| Free tier | 50M RUs/month, 10 GiB storage |
| Connection String | `DATABASE_URL` in `.env.local` |

### Direct SQL Access

```bash
source .env.local
node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT 1')).then(r => { console.log('OK'); c.end(); });
"
```

---

## 4. Environment Variables

### Required (All Environments)

| Variable | Purpose | Source |
|----------|---------|--------|
| `DATABASE_URL` | Prisma connection to CockroachDB | `.env.local` |
| `DIRECT_URL` | Direct connection to CockroachDB | `.env.local` |
| `BETTER_AUTH_SECRET` | Better Auth encryption key | `.env.local` |
| `BETTER_AUTH_URL` | Auth callback URL | `.env.local` (dev) / Vercel (prod) |

### Optional

| Variable | Purpose | Notes |
|----------|---------|-------|
| `GOOGLE_CLIENT_ID` | Google OAuth | For social login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | For social login |
| `TBO_USERNAME` | TBO flight API | Same as main pipeline |
| `TBO_PASSWORD` | TBO flight API | Same as main pipeline |
| `TBO_HOTEL_USERNAME` | TBO hotel API | Same as main pipeline |
| `TBO_HOTEL_PASSWORD` | TBO hotel API | Same as main pipeline |
| `TBO_ENDPOINT` | TBO API endpoint | Same as main pipeline |

### NOT Used (Removed)

The following are **NOT** used in the standalone build:
- `NEXT_PUBLIC_SUPABASE_URL` — No Supabase dependency
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — No Supabase dependency
- `SUPABASE_SERVICE_ROLE_KEY` — No Supabase dependency
- `DATABASE_PROVIDER` — Always Prisma, no dual-mode

---

## 5. Prisma Schema

### Provider MUST be `postgresql`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Why:** CockroachDB supports PostgreSQL wire protocol. Using `provider = "postgresql"` avoids CockroachDB-specific quirks.

### Build Command

```json
{
  "buildCommand": "npx prisma generate && npx next build"
}
```

**NEVER add `prisma db push` to vercel.json** — it fails on CockroachDB.

---

## 6. Schema Changes — Manual SQL Only

`prisma db push` and `prisma migrate deploy` do NOT work reliably with CockroachDB for ALTER COLUMN TYPE operations.

### How to Apply Schema Changes

1. **Check current schema**:
   ```bash
   node -e "
   const { Client } = require('pg');
   const c = new Client({ connectionString: process.env.DATABASE_URL });
   c.connect().then(() => c.query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'YourTable' ORDER BY ordinal_position\"))
     .then(r => { console.log(r.rows.map(x => x.column_name)); c.end(); });
   "
   ```

2. **Write ALTER TABLE SQL** for missing columns

3. **Execute via direct SQL**

4. **Verify** and redeploy

---

## 7. Auth — Better Auth

| Feature | Provider |
|---------|----------|
| Authentication | Better Auth (custom server) |
| DB driver | `pg` (direct connection to CockroachDB) |
| OAuth | Google (optional) |
| Session | JWT-based, managed by Better Auth |
| API routes | `/api/auth/*` (Next.js handlers) |

### Auth Architecture

```
Client → Better Auth Client → Next.js API Routes → Better Auth Server → CockroachDB
```

Better Auth manages:
- User registration (email/password)
- Session creation and validation
- OAuth flows
- CSRF protection

---

## 8. GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel CLI auth |
| `VERCEL_ORG_ID` | Team ID: `team_FejhRbDBXlq5hzGejWmzn1Oz` |
| `VERCEL_DEV_PROJECT_ID` | DEV project: `prj_cVdoHIbvGvHXioJule8tDXdewNEN` |
| `VERCEL_PROD_PROJECT_ID` | PROD project: (from Vercel project settings) |
| `BETTER_AUTH_SECRET` | For build-time env var injection |

---

## 9. Repository Structure

```
gorasa-crdb-standalone/
├── src/                # Application code
│   ├── app/            # Next.js App Router (pages + API)
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities, auth, db clients
├── prisma/             # Prisma schema and migrations
├── public/             # Static assets
├── scripts/            # Utility scripts
├── Governance/         # Project governance docs
├── docs/               # Technical documentation
├── .github/workflows/  # CI/CD pipelines
├── vercel.json         # Vercel config
└── vercel-dev.json     # DEV-specific Vercel config
```

---

## 10. Migration Summary

| Step | Status |
|------|--------|
| Data exported from Supabase (32 tables, 238 rows) | ✅ |
| Data imported to CockroachDB cluster | ✅ |
| Better Auth configured | ✅ |
| Supabase files removed from codebase | 🔄 |
| GitHub Actions workflows | 🔄 |
| Two Vercel projects configured | 🔄 |

---

## Change Table

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 2.0 | 2026-06-18 | AI | Rewrite for two-project setup (DEV/PROD), Better Auth, no Supabase |
| 1.0 | 2026-06-16 | AI | Initial creation |
