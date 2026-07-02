# Active Database Platform

**Platform:** CockroachDB Basic (Serverless) — two isolated clusters
**Status:** Active (DEV + PROD)
**Purged platforms:** Neon, Supabase (removed 2026-06-19)
**Driver:** Prisma (`postgresql` provider — PG wire protocol)

## Cluster Details

| Environment | Cluster Name | Host | User |
|---|---|---|---|
| **DEV** | `aqua-pony-27730` | `aqua-pony-27730.j77.aws-ap-south-1.cockroachlabs.cloud:26257` | `nikhil` |
| **PROD** | `losing-cyclops-27787` | `losing-cyclops-27787.j77.aws-ap-south-1.cockroachlabs.cloud:26257` | `nikhil` |

## Credentials Source

DO NOT attempt to fetch credentials via Neon or Supabase MCP tools — they cannot connect to CockroachDB.
Credentials come from these sources only:
1. `secrets.file` (gitignored, project root) — single source of truth
2. Vercel env vars (set in Vercel dashboard for each project)
3. CockroachDB Cloud console (https://cockroachlabs.cloud)

## URL Format

```
postgresql://<user>:<password>@<cluster>.<region>.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
```

## Critical Rule

**NEVER use Neon or Supabase MCP tools in this project.** Both platforms were fully purged.
The available Neon and Supabase MCPs are user-level configurations for OTHER projects.
Any agent calling `neon_*` or `supabase_*` tools in this project is making a mistake.
