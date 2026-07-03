# GoRASA — Go-Live Launch Plan

**Version:** 1.0
**Date:** 2026-07-03
**Status:** Pre-Launch

---

## 1. Current State Summary

| Metric | Value |
|---|---|
| **Total GitHub Issues** | 31 (20 closed, 11 open) |
| **Security Issues** | 10/10 closed ✅ |
| **Corporate Flow Issues** | 7/7 closed ✅ |
| **Commits This Session** | 15 |
| **TypeScript Errors** | 0 |
| **Build Status** | Clean ✅ |
| **Post-Task Checks** | 9/9 ✅ |
| **Preflight Checks** | 13/13 ✅ |
| **DEV Live** | https://cckr.vercel.app ✅ |
| **PROD Live** | https://project-yidb6.vercel.app ✅ |

---

## 2. Problems & Blockers

### 2.1 CRITICAL — Must Fix Before Any Production Traffic

| # | Problem | Impact | Status |
|---|---|---|---|
| P1 | **No real payment gateway** — Razorpay/PhonePe merchant account not configured. All non-corporate payments are mock. | Users can "book" but no money moves. Revenue = ₹0. | Needs credentials |
| P2 | **No error monitoring** — No Sentry, no Vercel error tracking. Production errors are invisible. | Cannot detect or debug production issues. | Needs setup |
| P3 | **No custom domain** — PROD at `project-yidb6.vercel.app` looks unprofessional. | Brand trust, SEO, email deliverability all suffer. | Needs domain purchase |
| P4 | **Google OAuth not configured** — Auth.ts has Google provider but credentials may be stale/missing. | Users expecting Google sign-in will see errors. | Needs verification |
| P5 | **Corporate wallet deduction untested end-to-end** — Code is written but no E2E test has been run against real TBO API with a corporate user. | Corporate flow could silently fail in production. | Needs testing |

### 2.2 HIGH — Must Fix Before Public Launch

| # | Problem | Impact | Status |
|---|---|---|---|
| P6 | **No E2E tests** — Zero automated tests for any booking flow. | Regressions can ship undetected. | Needs Playwright setup |
| P7 | **Email delivery untested** — SMTP configured but no end-to-end email test has been sent. | Booking confirmations, password resets could silently fail. | Needs verification |
| P8 | **No user dashboard** — Users have no central place to see their bookings, spending, loyalty progress. | Poor UX for repeat users. | Not built |
| P9 | **No SEO meta tags** — Zero Open Graph, no page titles, no structured data. | Google can't index properly, social shares look broken. | Not built |
| P10 | **Price revalidation is mock** — `revalidatePrice()` in checkout returns random fluctuations, never actually checks with TBO. | Prices could change between booking and payment. | Needs real TBO integration |
| P11 | **Demo login uses hardcoded passwords** — Passwords are visible in client-side code (`useAuth.tsx`). | Security risk if deployed as-is to production. | Needs removal for prod |

### 2.3 MEDIUM — Should Fix Within First Week

| # | Problem | Impact | Status |
|---|---|---|---|
| P12 | **No Google Analytics / Vercel Analytics** | No visibility into traffic, conversions, user behavior. | Not set up |
| P13 | **No sitemap.xml or robots.txt** | SEO basics missing. | Not built |
| P14 | **Invoice PDF generation missing** — Admin can mark invoices as paid but can't generate printable invoices. | Admin workflow incomplete. | Not built |
| P15 | **Better Auth tables not in Prisma schema** — session/account/verification tables were created via raw SQL, not defined in schema.prisma. | Schema drift — future Prisma migrations could fail. | Needs schema update |
| P16 | **No rate limiting on API routes** | Vulnerable to brute force and DDoS. | Not implemented |
| P17 | **CockroachDB free tier limits** — 50M RUs/month per cluster. High traffic could exhaust quota. | Site goes down if quota exceeded. | Needs monitoring |

---

## 3. Launch Checklist

### Phase 1: Infrastructure (Day 1-2)

- [ ] **Purchase custom domain** (e.g., `gorasa.in` or `bookgorasa.in`)
- [ ] **Configure DNS** — A record / CNAME to Vercel
- [ ] **Update Vercel env vars** — `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL` to new domain
- [ ] **Update Google OAuth redirect URIs** to new domain
- [ ] **Set up Sentry** — `@sentry/nextjs`, configure DSN, source maps
- [ ] **Enable Vercel Analytics** — Web Vitals + Speed Insights
- [ ] **Verify SMTP delivery** — send test email from production
- [ ] **Verify CockroachDB PROD cluster** — check RU usage, storage

### Phase 2: Payments (Day 2-3)

- [ ] **Set up Razorpay merchant account** (if not done)
- [ ] **Set up Razorpay webhooks** — point to `https://<domain>/api/webhooks/razorpay`
- [ ] **Add Razorpay credentials to Vercel env** — `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- [ ] **Test payment flow on Razorpay sandbox** — create order, complete payment, verify webhook
- [ ] **Set `PAYMENT_MOCK=false`** in production (already done)
- [ ] **Test corporate flow end-to-end** — assign user to company, top up wallet, book hotel, verify wallet deduction + invoice
- [ ] **Verify email delivery** — booking confirmation, cancellation, password reset

### Phase 3: Testing (Day 3-4)

- [ ] **Install Playwright** — `npm install -D @playwright/test`
- [ ] **E2E test: Hotel search → book → pay → confirm**
- [ ] **E2E test: Flight search → book → pay → confirm**
- [ ] **E2E test: Corporate booking (wallet deduction)**
- [ ] **E2E test: Cancellation + refund**
- [ ] **E2E test: Admin flows (users, invoices, config)**
- [ ] **Cross-browser testing** — Chrome, Safari, Firefox, mobile
- [ ] **Load test** — verify CockroachDB handles concurrent bookings

### Phase 4: SEO & Content (Day 4-5)

- [ ] **Add meta tags** — title, description, OG image per page
- [ ] **Add sitemap.xml** — auto-generated from routes
- [ ] **Add robots.txt** — allow crawling
- [ ] **Add structured data** — Organization, WebSite, Product schemas
- [ ] **Verify all pages render correctly** — no 404s, no broken images
- [ ] **Remove demo login from production** — or gate behind env var

### Phase 5: Final Review (Day 5)

- [ ] **Run full security audit** — verify all SEC-* fixes still in place
- [ ] **Run preflight + post-task checks** — 13/13 + 9/9
- [ ] **Run TypeScript + build** — 0 errors, clean build
- [ ] **Review all env vars** — no secrets in client bundle, no stale vars
- [ ] **Verify dual DB isolation** — DEV and PROD have separate data
- [ ] **Update governance docs** — session log, deployment log
- [ ] **Tag release** — `git tag v1.0.0`

### Phase 6: Launch (Day 5)

- [ ] **Final PROD deploy** — `vercel deploy --prod`
- [ ] **Verify site loads** — homepage, login, search, booking
- [ ] **Test critical flows** — login, search, book, pay (or corporate book)
- [ ] **Monitor Sentry** — watch for errors in first hour
- [ ] **Monitor Vercel** — check deployment status, function logs
- [ ] **Announce launch** — internal team notification

### Phase 7: Post-Launch (Day 5-6)

- [ ] **Monitor 24h** — check error rates, performance, user feedback
- [ ] **Review CockroachDB metrics** — RU consumption, query performance
- [ ] **Verify email delivery** — all transactional emails working
- [ ] **Check payment webhooks** — Razorpay/PhonePe callbacks arriving
- [ ] **Document any issues** — update MISTAKE-LOG.md
- [ ] **Retrospective** — what worked, what didn't, what to improve

---

## 4. Open Questions for You

| # | Question | Why It Matters |
|---|---|---|
| Q1 | **Do you have a Razorpay/PhonePe merchant account?** | Without it, non-corporate users can't pay. Corporate flow works but regular users are stuck. |
| Q2 | **What domain do you want?** (`gorasa.in`, `bookgorasa.in`, etc.) | Affects all env vars, OAuth config, email templates. |
| Q3 | **Should demo login be removed from production?** | Currently hardcoded passwords are visible in client JS. |
| Q4 | **Do you want to launch with corporate-only first?** | Corporate flow is complete and doesn't need payment gateway. |
| Q5 | **What's your CockroachDB RU budget?** | Free tier is 50M RUs/month. Need to know if you're on free or paid. |
| Q6 | **Should I set up Sentry now or defer?** | Sentry is free for 5K events/month. Quick to set up. |

---

## 5. Execution Timeline

```
Day 1-2:  Infrastructure (domain, DNS, env vars, Sentry, Analytics)
Day 2-3:  Payments (Razorpay setup, credentials, webhook, sandbox test)
Day 3-4:  Testing (Playwright E2E, cross-browser, load test)
Day 4-5:  SEO (meta tags, sitemap, structured data, demo login cleanup)
Day 5:    Final review + Launch
Day 5-6:  Post-launch monitoring
```

**Estimated time to go-live: 5 days** (if payment gateway credentials are available immediately).

**If no payment gateway: Launch corporate-only in 2 days** — corporate flow is complete, no gateway needed.

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Payment gateway setup delayed | High | Blocks 80% of users | Launch corporate-only first |
| CockroachDB free tier exhausted | Medium | Site goes down | Monitor RU usage, set up alerts |
| SMTP delivery fails | Low | No emails sent | Test before launch, have backup SMTP |
| TBO API rate limits | Medium | Search/booking fails | Already have mock fallback |
| Security vulnerability discovered | Low | Data breach | Comprehensive audit already done |
| Custom domain DNS propagation delay | Medium | 24-48h downtime | Configure DNS early |
