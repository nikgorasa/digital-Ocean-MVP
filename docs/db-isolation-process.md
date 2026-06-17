# Database Isolation Process

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ENVIRONMENT ROUTER                    │
│                  (DATABASE_PROVIDER env)                  │
├─────────────────────┬───────────────────────────────────┤
│   DATABASE_PROVIDER │         DATABASE                  │
│       = "prisma"    │     NEON (Dev/QA)                 │
│       = "supabase"  │     Supabase (Prod)               │
├─────────────────────┼───────────────────────────────────┤
│         ↓           │              ↓                    │
│    Prisma Client    │    Supabase Admin Client          │
│   (via @/lib/db)    │   (via @/lib/supabase-admin)      │
└─────────────────────┴───────────────────────────────────┘
```

**Key rule:** Auth (`auth/login`, `auth/me`) always uses Supabase Auth regardless of `DATABASE_PROVIDER`. Only data queries switch providers.

## Environment Variables

| Variable | Dev | QA | Prod |
|----------|-----|-----|------|
| `DATABASE_PROVIDER` | `prisma` | `prisma` | `supabase` |
| `DATABASE_URL` | NEON connection string | NEON connection string | Supabase pooler |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project | Same Supabase project | Same Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Same key | Same key | Same key |

## DB Service Layer

All data access goes through service files in `src/lib/db/`:

```
src/lib/db/
├── index.ts          # Provider switch (isPrisma(), isSupabase())
├── users.ts          # User CRUD
├── leads.ts          # Lead CRUD
├── packages.ts       # Package CRUD
├── bookings.ts       # Booking CRUD
├── tickets.ts        # Ticket CRUD
├── cities.ts         # City search
├── rewards.ts        # Loyalty rewards
├── promo-codes.ts    # Promo codes
├── pricing.ts        # Pricing rules
├── companies.ts      # Companies + corporate rates
├── flights.ts        # Flight search
└── content.ts        # FAQ, navigation, site-config, testimonials, etc.
```

Each service function checks `isPrisma()` internally:

```typescript
export async function findAll() {
  if (isPrisma()) {
    return prisma.user.findMany({ ... })
  }
  const { data } = await supabaseAdmin.from('User').select('*')...
  return data || []
}
```

## Schema Sync Workflow

When schema changes are needed:

### 1. Make changes in Supabase (source of truth)
```bash
# Via Supabase Dashboard or SQL Editor
ALTER TABLE "User" ADD COLUMN "newField" TEXT;
```

### 2. Pull schema to Prisma
```bash
cd gorasa-next
npx prisma db pull
```

### 3. Regenerate Prisma client
```bash
npx prisma generate
```

### 4. Push to NEON (dev/qa databases)
```bash
# Set DATABASE_URL to NEON connection string
DATABASE_URL="postgresql://..." npx prisma db push
```

### 5. Verify
```bash
npx tsc --noEmit
```

## Neon Projects

| Environment | Project ID | Region | Connection String |
|-------------|------------|--------|-------------------|
| **Dev** | `small-haze-12127097` | us-east-1 | `postgresql://neondb_owner:<password>@<host>/neondb?sslmode=require` |
| **QA** | `patient-violet-81222905` | us-east-1 | `postgresql://neondb_owner:<password>@<host>/neondb?sslmode=require` |

## Vercel Environment Setup

### Dev Project
```
DATABASE_PROVIDER=prisma
DATABASE_URL=postgresql://neondb_owner:<password>@<dev-host>/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:<password>@<dev-direct-host>/neondb?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://isubgeemvhvhnhikxbjb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### QA Project
```
DATABASE_PROVIDER=prisma
DATABASE_URL=postgresql://neondb_owner:<password>@<qa-host>/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:<password>@<qa-direct-host>/neondb?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://isubgeemvhvhnhikxbjb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Prod Project
```
DATABASE_PROVIDER=supabase
DATABASE_URL=postgresql://postgres.isubgeemvhvhnhikxbjb:REDACTED_SUPABASE_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:REDACTED_SUPABASE_PASSWORD@db.isubgeemvhvhnhikxbjb.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://isubgeemvhvhnhikxbjb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Testing Isolation

### Local testing with NEON
```bash
# 1. Set env vars
export DATABASE_PROVIDER=prisma
export DATABASE_URL="postgresql://neondb_owner:...@ep-...?.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 2. Push schema to NEON
npx prisma db push

# 3. Start dev server
npm run dev

# 4. Verify queries hit NEON (check Neon Dashboard → Monitoring)
```

### Local testing with Supabase
```bash
# 1. Set env vars
export DATABASE_PROVIDER=supabase
export NEXT_PUBLIC_SUPABASE_URL=https://isubgeemvhvhnhikxbjb.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 2. Start dev server
npm run dev
```

## Pre-Flight Check Integration

The pre-flight check (`scripts/preflight-check.sh`) validates:

- **Check 11:** Branch-to-DB mapping (dev→prisma, qa→prisma, main→supabase)
- **Check 12:** Production Supabase shield (warns on every session)
- **Check 13:** Vercel environment cross-reference

## Post-Task Check Integration

The post-task check (`scripts/post-task-check.sh`) validates:

- **Check 21:** DB intent verification (no inline Supabase in migrated routes)
- **Check 22:** Schema sync requirement (Prisma schema matches Supabase)
- **Check 23:** Environment git guard (env vars match branch)

## Migration Status

### Migrated to Service Layer
- ✅ users, leads, packages, bookings, tickets, cities
- ✅ rewards, promo-codes, pricing, companies, flights
- ✅ content (FAQ, navigation, site-config, testimonials, etc.)
- ✅ dashboard, checkout, cancellations

### Kept on Supabase Auth
- `/auth/login` — Supabase Auth
- `/auth/me` — Supabase Auth

### Using Existing Abstractions
- `/tickets/*` — `@/lib/ticket/serverManager`
- `/support` — `@/lib/support`
- `/payment-status/*` — `@/lib/payment`
- `/promos/validate` — `@/lib/pricing`
- `/tbo*`, `/ai/*`, `/webhooks/*` — External APIs

## Troubleshooting

### "Cannot find module '@/lib/db'" error
Run `npx prisma generate` to regenerate the Prisma client.

### Queries hitting wrong database
Check `DATABASE_PROVIDER` env var. Use `console.log(process.env.DATABASE_PROVIDER)` in a route to debug.

### Schema mismatch between Supabase and NEON
Run `npx prisma db pull` from Supabase, then `npx prisma db push` to NEON.

### RLS policies blocking Prisma queries
Prisma doesn't support RLS. Use `supabaseAdmin` (service role) for queries that need to bypass RLS, or ensure RLS policies allow the queries.
