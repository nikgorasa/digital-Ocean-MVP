# GoRASA CockroachDB Standalone — Config Reference

> **Purpose:** Single source of truth for all configuration.
> **Read this BEFORE any deployment.
> **Last updated:** 2026-06-23

---

## 1. Two Isolated Database Environments

This project runs **two completely separate CockroachDB clusters**. They share zero data.

| Environment | Env File | Vercel Project | URL | Deploy Trigger |
|---|---|---|---|---|
| **DEV** | `.env.local` | `cckr` | [cckr.vercel.app](https://cckr.vercel.app) | Push to `main` |
| **PROD** | `.env.production` | `cckr2` | [project-yidb6.vercel.app](https://project-yidb6.vercel.app) | Vercel CLI |

**Each environment has its own:**
- `DATABASE_URL` — connection to its CockroachDB cluster
- `DIRECT_URL` — direct connection to its CockroachDB cluster
- `BETTER_AUTH_SECRET` — encryption key
- `BETTER_AUTH_URL` — callback URL

---

## 2. Git Repository

| Property | Value |
|---|---|
| Remote | `https://github.com/Gorasa-In-2026/Gorasa-Cockroach.git` |
| Default branch | `main` |

---

## 3. Database

| Property | Value |
|---|---|
| Provider | CockroachDB Basic (Serverless) |
| Database | `defaultdb` |
| Tables | 32 |
| Free tier | 50M RUs/month, 10 GiB storage per cluster |
| Connection String | `DATABASE_URL` in env file |

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

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection to CockroachDB |
| `DIRECT_URL` | Direct connection to CockroachDB |
| `BETTER_AUTH_SECRET` | Better Auth encryption key |
| `BETTER_AUTH_URL` | Auth callback URL |

### Optional

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `TBO_USERNAME` | TBO hotel API — search/book (production: `RasaT`) |
| `TBO_PASSWORD` | TBO hotel API — search/book (production: `RasaT@123`) |
| `TBO_ENDPOINT` | TBO hotel API — search/book endpoint (`https://affiliate.tektravels.com/HotelAPI`) |
| `TBO_BOOKING_ENDPOINT` | TBO hotel API — booking endpoint (`https://affiliate.tektravels.com/HotelAPI`) |
| `TBO_HOTEL_USERNAME` | TBO hotel API — static data (staging: `TBOStaticAPITest`) |
| `TBO_HOTEL_PASSWORD` | TBO hotel API — static data (staging: `Tbo@11530818`) |
| `TBO_STATIC_ENDPOINT` | TBO hotel API — static data endpoint (`http://api.tbotechnology.in/TBOHolidays_HotelAPI`) |
| `TBO_HOTEL_FORCE_MOCK` | Force mock mode for hotel API (`true` to bypass real calls) |
| `PAYMENT_GATEWAY` | Payment gateway selection (`mock`) |
| `PAYMENT_MOCK` | Enable mock payment (`true`) |

**Note:** The TBO Hotel API uses **two separate credential pairs**: one for search/PreBook/Book (production, `RasaT`) and one for static data endpoints like CountryList, CityList, TBOHotelCodeList (staging, `TBOStaticAPITest`). City codes from the staging static API may differ from production search codes.

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

`prisma db push` and `prisma migrate deploy` do NOT work reliably with CockroachDB.

### How to Apply Schema Changes

1. Check current schema via direct SQL
2. Write `ALTER TABLE` SQL for missing columns
3. Execute via direct SQL on BOTH clusters (DEV + PROD)
4. Verify and redeploy

---

## 7. Auth — Better Auth

| Feature | Provider |
|---|---|
| Authentication | Better Auth |
| DB driver | `pg` (direct connection to CockroachDB) |
| OAuth | Google (optional) |
| Session | JWT-based |
| API routes | `/api/auth/*` |

---

## 8. GitHub Secrets

| Secret | Purpose |
|---|---|
| `VERCEL_TOKEN` | Vercel CLI auth |
| `VERCEL_ORG_ID` | Team ID |
| `VERCEL_DEV_PROJECT_ID` | DEV project ID |
| `VERCEL_PROD_PROJECT_ID` | PROD project ID |
| `BETTER_AUTH_SECRET` | Build-time env var injection |

---

## 9. Repository Structure

```
gorasa-crdb-standalone/
├── src/                # Application code
│   ├── app/            # Next.js App Router
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilities, auth, DB
├── prisma/             # Prisma schema
├── public/             # Static assets
├── scripts/            # Utility scripts
├── Governance/         # Governance docs
├── .github/workflows/  # CI/CD
├── vercel.json         # Vercel config
└── .env.example        # Env template
```

---

## Change Table

| Version | Date | Change |
|---|---|---|
| 3.0 | 2026-06-19 | Complete rewrite: dual isolated DBs, no legacy references |
| 2.0 | 2026-06-18 | Two-project setup |
| 1.0 | 2026-06-16 | Initial creation |
