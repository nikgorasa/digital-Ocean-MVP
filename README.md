# GoRASA — CockroachDB Standalone

Standalone deployment of GoRASA travel platform using CockroachDB and Better Auth.

## Stack

- **Database:** CockroachDB (losing-cyclops-27787)
- **Auth:** Better Auth (email/password + Google OAuth)
- **Framework:** Next.js 16.2.7
- **ORM:** Prisma
- **Deployment:** Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

## Environment Variables

See `.env.example` for required variables.

## Database

CockroachDB cluster: `losing-cyclops-27787.j77.aws-ap-south-1.cockroachlabs.cloud`

Tables: 32 (User, Booking, Lead, tickets, etc.)

## Auth

Better Auth handles:
- Email/password authentication
- Google OAuth
- Session management
- User profiles

API routes: `/api/auth/*`

## Deployment

```bash
# Deploy to Vercel
vercel deploy --prod
```

## Architecture

```
Vercel (Next.js)
    ↓
CockroachDB (losing-cyclops-27787)
    ↓
Better Auth (session management)
```

## Migration from Supabase

Data migrated from Supabase (isubgeemvhvhnhikxbjb) to CockroachDB:
- 7 users
- 17 bookings
- 15 leads
- 6 tickets
- 238 total rows

## Security

- All secrets in `.env.local` (gitignored)
- Never commit credentials
- Use Vercel env vars for production
