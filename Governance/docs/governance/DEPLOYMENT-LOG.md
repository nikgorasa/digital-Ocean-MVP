# GoRASA CockroachDB Standalone — Deployment Log

> **Purpose:** Record of all deployments.
> **Format:** `Date | Environment | Status | URL | Notes`
> **Updated:** After every deployment.

---

## Deployments

| Date | Environment | Status | URL | Notes |
|------|---|---|---|---|
| 2026-07-03 | DEV | ✅ Live | https://cckr.vercel.app | Corporate booking flow complete — wallet, invoices, admin page, trips display (5332258) |
| 2026-07-03 | PROD | ✅ Live | https://project-yidb6.vercel.app | Corporate booking flow complete (5332258) |
| 2026-07-03 | DEV | ✅ Live | https://cckr.vercel.app | Admin invoices page with date range filtering (fcd6e66) |
| 2026-07-03 | DEV | ✅ Live | https://cckr.vercel.app | Corporate booking UI — checkout bypass + confirmation (f030681) |
| 2026-07-03 | DEV | ✅ Live | https://cckr.vercel.app | Corporate checkout — wallet deduction + invoice generation (98aa6d9) |
| 2026-07-03 | DEV | ✅ Live | https://cckr.vercel.app | Companies API auth + wallet ledger routes (dfec007) |
| 2026-07-03 | DEV | ✅ Live | https://cckr.vercel.app | Corporate data model — Invoice, WalletLedger, schema changes (c41fa62) |
| 2026-07-03 | DEV | ✅ Live | https://cckr.vercel.app | Email notifications wired + email verification + password reset (66ff917) |
| 2026-07-09 | DEV | ✅ Live | https://cckr.vercel.app | Middleware whitelist fix — TBO API routes no longer return 401 (1039585) |
| 2026-07-09 | DEV | ✅ Live | https://cckr.vercel.app | Flight search frontend fix — duration type mismatch, cabin class map, stops derivation (cbc4d74) |
| 2026-07-09 | DEV | ✅ Live | https://cckr.vercel.app | Return flight search fix — send 2 segments for JourneyType=2 (closes #55, 4061780) |
| 2026-07-10 | DEV | ✅ Pushed | https://cckr.vercel.app | Multi-city flight UI + JourneyType=3 segment building — remove/add leg buttons, date validation, Circle tripType, N-leg alternating segments |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | EPIC sweep — HOTEL (14 issues), CORP (5), PAY (2 fixed), FLIGHT (6), UX (4) — 17 files, +851/-298 (b72599d) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | UX-EPIC — removed markup disclosure, added hotel name search (342222a) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | INTL-EPIC — international travel support, country selector, currency, visa warnings (15461f6) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | TBO-DRIVEN — Airport.CountryCode detection, ValidationInfo, passport mapping (26dcf40) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | TBO-CACHE — DB-based static data caching, L1 memory + L2 CockroachDB (b36530c) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | INVOICE-EPIC — PDF generation, CSV export, email templates, auto-overdue cron (3f99c96) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | Premium UI elevation — design tokens, fluid typography, scroll animations, skeleton loaders, hero parallax (69f5672) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | UX improvements — error states, accessibility, ConfirmDialog, fallback quick replies (829fe0d) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | FLIGHT-UX — flight grouping, cabin class filter, mock bug fix, expandable fares (d5df778) |
| 2026-07-17 | DEV | ✅ Live | https://cckr.vercel.app | FLIGHT-CITY — airport data separation, IATA codes, search by code (7969ff7) |
| 2026-06-26 | DEV | ✅ Pushed | https://cckr.vercel.app | API config guardrails — dual-endpoint validation, seed defaults fix, governance scripts (d091a52) |
| 2026-06-19 | DEV | ✅ Live | https://cckr.vercel.app | First deployment — Supabase removed, aqua-pony CockroachDB cluster |
| 2026-06-17 | DEV | ✅ Live | https://cckr.vercel.app | Initial CockroachDB standalone deployment |
