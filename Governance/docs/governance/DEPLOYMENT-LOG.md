# GoRASA CockroachDB Standalone — Deployment Log

> **Purpose:** Record of all deployments.
> **Format:** `Date | Environment | Status | URL | Notes`
> **Updated:** After every deployment.

---

## Deployments

| Date | Environment | Status | URL | Notes |
|------|---|---|---|---|
| 2026-07-03 | PROD | ✅ Live | https://project-yidb6.vercel.app | Security hardening — auth, RBAC, session auth, Zod, sanitized responses. Added missing env vars (TBO_BOOKING_ENDPOINT, TBO_STATIC_ENDPOINT, PAYMENT_MOCK, CRON_SECRET) |
| 2026-07-03 | DEV | ✅ Live | https://cckr.vercel.app | Security hardening — auth middleware, RBAC, session auth, Zod validation, sanitized responses (e781ba4) |
| 2026-06-26 | DEV | ✅ Pushed | https://cckr.vercel.app | API config guardrails — dual-endpoint validation, seed defaults fix, governance scripts (d091a52) |
| 2026-06-19 | DEV | ✅ Live | https://cckr.vercel.app | First deployment — Supabase removed, aqua-pony CockroachDB cluster |
| 2026-06-17 | DEV | ✅ Live | https://cckr.vercel.app | Initial CockroachDB standalone deployment |
