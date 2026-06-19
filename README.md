# GoRASA — CockroachDB Standalone

Production-ready travel platform powered by CockroachDB.

## Live

| Environment | URL | Database |
|---|---|---|
| **DEV** | [cckr.vercel.app](https://cckr.vercel.app) | CockroachDB DEV cluster |
| **PROD** | [project-yidb6.vercel.app](https://project-yidb6.vercel.app) | CockroachDB PROD cluster |

## Tech Stack

```
CockroachDB → Better Auth → Prisma → Next.js → Vercel
```

- **Database:** CockroachDB Basic (serverless, 50M RUs/month, 10 GiB)
- **Auth:** Better Auth (email/password + Google OAuth)
- **ORM:** Prisma with `postgresql` provider
- **Framework:** Next.js 16 (App Router)
- **Deploy:** Vercel (two isolated projects)

## Two Isolated Database Environments

This project runs **two completely separate CockroachDB clusters** — one for DEV, one for PROD. They share zero data.

| Environment | Env File | Vercel Project | Database Cluster |
|---|---|---|---|
| **DEV** | `.env.local` | `cckr` | DEV CockroachDB cluster |
| **PROD** | `.env.production` | `cckr2` | PROD CockroachDB cluster |

**Why:** Changes in DEV never touch PROD data. Each environment has its own connection string, its own schema, and its own data.

## Architecture

```
GitHub: Gorasa-In-2026/Gorasa-Cockroach
         ↓
Vercel:  cckr (DEV) + cckr2 (PROD)
         ↓
DB:      CockroachDB (isolated per environment)
Auth:    Better Auth (self-hosted)
```

- **32 tables** — Users, Bookings, Leads, Tickets, Packages, Payments, etc.
- **14 foreign key constraints** — all restored after migration
- **Schema changes:** Manual SQL only (`prisma db push` does NOT work on CockroachDB)

## Quick Start

```bash
# Install
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your DEV CockroachDB connection string

# Generate Prisma client
npx prisma generate

# Run dev server
npm run dev
```

## Deploy

```bash
# DEV (auto-deploys on push to main)
git push origin main

# PROD (via Vercel CLI)
vercel deploy --prod --yes --token=$VERCEL_TOKEN --scope="nikjp2021s-projects"
```

## Schema Changes

`prisma db push` and `prisma migrate deploy` do NOT work reliably with CockroachDB.

Always use direct SQL:

```bash
node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('ALTER TABLE ...')).then(() => { console.log('Done'); c.end(); });
"
```

## Project Structure

```
src/
├── app/            # Next.js App Router (pages + API)
├── components/     # React components
├── hooks/          # Custom React hooks
├── lib/            # Utilities, auth, DB clients
prisma/             # Prisma schema
Governance/         # Project governance docs
scripts/            # Utility scripts
.github/workflows/  # CI/CD pipelines
```

## Security

- All credentials in `.env.local` (gitignored)
- CockroachDB built-in encryption
- Better Auth session protection
- HTTPS via Vercel CDN
