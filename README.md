# GoRASA — Next.js App

This is the active GoRASA codebase — a Next.js 15 luxury travel platform with Supabase auth, TBO API flight/hotel search, and multi-environment CI/CD.

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # Fill in env vars
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environments

| Env | Branch | URL |
|---|---|---|
| Dev | `dev` | https://project-uul0v.vercel.app |
| QA | `qa` | https://project-sm6gc.vercel.app |
| Prod | `main` | https://gorasa-next.vercel.app |

## Key Stack

- **Next.js 15** (App Router)
- **Supabase** (auth + database)
- **TBO API** (flights + hotels)
- **Tailwind CSS** + **shadcn/ui**
- **Vercel** hosting

## Deploy

Push to `dev` or merge PR to `qa` triggers auto-deploy. Production deploys manually via GitHub Actions `deploy-prod.yml` with reviewer approval.
