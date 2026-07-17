# Code Review Report

**Date:** 2026-07-18
**Files analyzed:** 284
**Issues found:** {S1: 18, S2: 42, S3: 38, S4: 35}
**Verdict:** BLOCKED

---

## CRITICAL (S1) — Must Fix Before ANY Deploy

### Auth Bypass — Admin Endpoints Exposed

| Endpoint | Issue |
|----------|-------|
| `src/app/api/pricing-rules/route.ts:15` | POST missing requireAdmin() — anyone can create pricing rules |
| `src/app/api/pricing-rules/[id]/route.ts:4` | PATCH/DELETE missing requireAdmin() — anyone can modify/delete pricing rules |
| `src/app/api/promos/route.ts:16` | POST missing requireAdmin() — anyone can create promo codes |
| `src/app/api/promos/[id]/route.ts:4` | PATCH/DELETE missing requireAdmin() — anyone can modify/delete promos |
| `src/app/api/blog/route.ts:17` | POST with no auth at all — anyone can create blog posts |
| `src/app/api/blog/[slug]/route.ts:23` | PUT with no auth at all — anyone can modify any blog post |
| `src/app/api/packages/route.ts:14` | POST missing requireAdmin() — anyone can create travel packages |
| `src/app/api/packages/[id]/route.ts:23` | PUT/DELETE missing requireAdmin() — anyone can modify/delete packages |
| `src/app/api/tickets/[id]/route.ts:4` | GET/PATCH with no auth — anyone can read/modify any support ticket |
| `src/app/api/tickets/[id]/notes/route.ts:18` | POST with no auth, author from client body — anyone can add notes with arbitrary author |
| `src/app/api/tbo-hotels/route.ts:33` | TBO Hotel proxy API fully exposed — no auth on search, prebook, book, cancel |
| `src/app/api/tbo/route.ts:13` | TBO flight proxy API exposed without auth |
| `src/app/api/tbo-flights/route.ts:13` | TBO flight proxy API (duplicate) exposed without auth |

**Fix:** Add requireAdmin() to all mutating endpoints. Add requireAuth() to TBO proxy endpoints for mutations.

### Privilege Escalation

| Location | Issue |
|----------|-------|
| `src/app/api/rewards/[id]/redeem/route.ts:5` | userId from client body — user A can redeem user B's loyalty points |
| `src/app/api/tickets/[id]/notes/route.ts:18` | Author from client body — arbitrary author on ticket notes |

**Fix:** Use userId from server session, never from client request body.

### Race Conditions on Financial Operations

| Location | Issue |
|----------|-------|
| `src/app/api/wallet/topup/route.ts:34-50` | Wallet balance read-modify-write outside transaction — concurrent topups can corrupt balance |
| `src/app/api/cancellations/route.ts:98` | Wallet refund same pattern — read-modify-write outside transaction |
| `src/app/api/cancellations/route.ts:56-59` | Cancellation duplicate detection not atomic (findFirst + create) |

**Fix:** Use `walletBalance: { increment: amount }` atomically. Use transactions for cancellation creation.

### Crypto/Transport Vulnerabilities

| Location | Issue |
|----------|-------|
| `src/lib/payment/zaakpay-client.ts:88` | HMAC comparison via `===` — timing attack vulnerable |
| `src/lib/tbo-flight-api.ts:22-23` | TBO API credentials sent over plain HTTP (http:// not https://) |

**Fix:** Use `crypto.timingSafeEqual()` for HMAC. Change all TBO URLs to HTTPS.

### Credentials in Client Bundle

| Location | Issue |
|----------|-------|
| `hooks/useAuth.tsx:236-245` | Demo passwords ("Admin@123", "Sales@123", "User@123", "Support@123") in client JS |

**Fix:** Move credentials server-side only or remove entirely.

---

## ERRORS (S2) — Required Fixes

### Security

| Location | Issue |
|----------|-------|
| `src/app/auth/callback/route.ts:6` | Open redirect via `next` parameter — `next=//evil.com` redirects to malicious site |
| `components/HeroSection.tsx:104` | `dangerouslySetInnerHTML` without XSS sanitization on `titleAccent` prop |
| `next.config.ts:3-12` | No Content-Security-Policy header — XSS vulnerability |
| `src/lib/ai/providers/gemini.ts:38` | API key in URL query string — logged by proxies, CDNs, servers |
| `src/lib/payment/payment-service.ts:65-145` | Webhook handler lacks idempotency guard — duplicate delivery processes twice |

### Hardcoded Credentials

| Location | Issue |
|----------|-------|
| `src/lib/tbo-hotel-api.ts:37-38` | "TBOStaticAPITest" / "Tbo@11530818" hardcoded in source |

### Race Conditions

| Location | Issue |
|----------|-------|
| `src/app/api/rewards/[id]/redeem/route.ts:15-29` | TOCTOU on loyalty points — read, check, write not atomic |
| `src/lib/pricing/pricing-service.ts:222-225` | Promo usedCount increment not atomic — concurrent validations can exceed maxUses |
| `src/lib/auth-helpers.ts:55-94` | TOCTOU on user creation (findUnique + create) — concurrent duplicates |

### Missing Error Handling

| Location | Issue |
|----------|-------|
| `src/lib/ai/providers/gemini.ts:40` | fetch() without try-catch |
| `src/lib/ai/providers/mimo.ts:18` | fetch() without try-catch |
| `src/lib/ai/providers/openai.ts:18` | fetch() without try-catch |
| `src/lib/ai/client.ts:55` | No timeout on provider.complete() — hung fetch blocks indefinitely |
| `src/lib/ai/intent/router.ts:120-133` | routeUserMessage without try-catch |
| `src/lib/ai/client.ts:35` | Error message says "MOMO_API_KEY" instead of "MIMO_API_KEY" |

### Missing Database Indexes

| Model | Missing Index |
|-------|---------------|
| Booking | `@@index([userId])` — most-queried FK |
| Lead | `@@index([assignedTo])` |
| Activity | `@@index([activityId])`, `@@index([userId])` |
| Booking | `@@index([companyId])` |
| WalletLedger | `@@index([companyId])` |
| CancellationRequest | `@@index([userId])` |
| Redemption | `@@index([userId])`, `@@index([rewardId])` |

### Schema Issues

| Location | Issue |
|----------|-------|
| `prisma/schema.prisma:14` | 14 models use raw strings instead of enums (User.role, Booking.status, Payment.status, etc.) — zero DB-level validation |
| `prisma/schema.prisma:423` | PromoCode.code not unique — duplicate promo codes possible |
| `prisma/schema.prisma:115` | CorporateRate onDelete: NoAction — orphan records on company deletion |

### Monolith Components

| Location | Lines | Issue |
|----------|-------|-------|
| `components/FlightBookingModal.tsx` | 1447 | Monolith — booking logic, SSR, promo, payment all in one component |
| `components/HotelBookingModal.tsx` | 1166 | Same problem |
| `components/FlightBookingModal.tsx:326-581` | 255 | handleBook() function — full TBO booking logic in component |
| `components/HotelBookingModal.tsx:217-422` | 205 | handleBook() function — same problem |
| `src/app/api/checkout/route.ts:75-293` | 219 | POST function — too complex for testing/maintenance |

### Other

| Location | Issue |
|----------|-------|
| `src/lib/visa-requirements.ts:14-30` | Static Schengen data contradicts runtime logic |
| `src/lib/ai/i18n/translations.ts:48` | Hindi typo: "लोग अच्छा!" should be "बहुत अच्छा!" |

---

## WARNINGS (S3) — Should Fix

### Type Safety

- `src/lib/ticket/serverManager.ts:124,188` — 3x `as any` bypassing Prisma types
- `src/lib/pricing/pricing-service.ts` — 5x `any` types (rulesCache, matchesRule, applicableRule)
- `src/app/api/tbo-hotels/route.ts:52` — `roomsRaw.map((r: any) => ...)`
- `src/app/api/invoices/[id]/pdf/route.ts:47-52` — 6x `(invoice as any).company?.name`
- `src/app/api/cities/tbo/route.ts:52` — `(res as any).CityList`
- `src/app/api/rewards/[id]/redeem/route.ts:25` — `(user as any).loyaltyPoints`

### Code Duplication

- **3 duplicated intent classifiers** across `src/lib/ai/unified/intentClassifier.ts`, `src/lib/ai/intent/classifier.ts`, `src/lib/support/intentRouter.ts`
- **3 copies of shouldEscalate()** in intentClassifier.ts, intent/router.ts, support/intentRouter.ts
- **Duplicated types** between holidayPlanner.ts and holidayPlannerAI.ts (Message, Activity, ItineraryDay, Itinerary)

### Hardcoded URLs

- `src/lib/email.ts:81,104,124,154` — URLs hardcoded to `https://cckr.vercel.app` (DEV) — PROD uses `project-yidb6.vercel.app`
- `components/JsonLd.tsx:6-8` — Same URL in JSON-LD
- `components/Breadcrumb.tsx:18` — Same URL in breadcrumb JSON-LD

### Large Functions

- `src/lib/config-service.ts:150-239` — upsertConfig() 89 lines
- `src/lib/payment/payment-service.ts:65-145` — handleZaakpayWebhook 80 lines
- Multiple functions in src/lib/ >50 lines: searchFlights (123), ticketFlight (98), calculatePrice (64), validatePromoCode (80), generateItinerary (96), generateHolidayResponse (129)

### Logging

- 60+ console.error in API routes — no structured logger
- 4 console.log in production code (cron/sync-tbo-static, cancellations)

### Other

- `src/lib/ai/session/sessionManager.ts` — localStorage without size limit
- `src/lib/static-cache.ts:99-112` — Map deletion during iteration
- `components/HandoffModal.tsx:69-72` — setTimeout not cleaned up on unmount
- `next.config.ts:14` — poweredByHeader not disabled (information disclosure)
- `components/Footer.tsx:20-28` — Promise.all with silent `catch(() => {})`
- `components/Navbar.tsx:123-131` — fetch().then().catch(() => {}) silently swallows errors

---

## INFO (S4) — Recommended

### Hardcoded IPs

- `src/app/api/admin/config/[provider]/test/route.ts:40,104` — "192.168.1.1"
- `src/app/api/tbo-hotels/route.ts:40` — "192.168.1.1"
- `src/app/api/tbo/route.ts:20` — "192.168.1.1"
- `src/app/api/tbo-flights/route.ts:19` — "192.168.1.1"
- `src/lib/tbo-hotel-client.ts:33,45` — IP and clientId hardcoded
- `src/lib/tbo-flight-client.ts:48,60` — IP and clientId hardcoded

### Dead Code

- `components/FlightBookingModal.tsx:120-121` — showGstFields state never used
- `components/HotelBookingModal.tsx:58` — showGstFields state never used
- `src/lib/payment/mock-handler.ts:20-42` — createMockWebhookPayload never imported
- `src/lib/analytics/events.ts:49-54` — fetch code commented out — analytics go to console.log only

### Schema Cleanup

- `prisma/schema.prisma:13` — User.supabaseId marked "Legacy — unused" — should remove
- `prisma/schema.prisma:179` — @default(now()) redundant with @updatedAt
- `prisma/schema.prisma:645-646` — @@index([slug]) redundant with @unique

### Other

- `src/lib/payment/components/CheckoutButton.tsx:10` — Gateway type "razorpay" | "phonepe" but system uses zaakpay
- `src/app/api/tbo-flights/route.ts:52-61` — "ssr" and "get-ssr" cases duplicated
- `src/app/api/checkout/route.ts:53-66` — revalidatePrice() is a no-op in production
- `src/lib/db/*.ts` — 13 files with `as never` casts bypassing Prisma types
- `components/DayCard.tsx:43` — React key based on array index
- `components/SupportDemo.tsx:105` — React key based on array index
- `src/lib/support/smartRouter.ts:17-18` — Contact info hardcoded (3rd occurrence)
- `src/lib/support/quickActions.ts:52-53` — Contact info hardcoded (4th occurrence)
- `src/lib/support/faqEngine.ts:339-340` — Contact info hardcoded (5th occurrence)

---

## Systemic Issues

### Zero Test Infrastructure

No unit, integration, or E2E tests in a payment/booking platform. Critical risk.

### 14 Models Without Enums

All status/role/type fields use raw strings — no DB-level validation. Any app bug can insert invalid values.

### 10+ Missing Indexes

Most-queried foreign keys (Booking.userId, Booking.companyId, WalletLedger.companyId, etc.) lack indexes. Performance degrades at scale.

### 3 Duplicated Intent Classifiers

Three near-identical implementations of intent classification. Maintenance nightmare.

### No Structured Logging

60+ console.error/console.log calls with no log levels, no aggregation, no filtering in production.

### Contact Info Hardcoded 5 Times

Phone number and email duplicated across smartRouter, quickActions, faqEngine, and more.

---

## Priority Order

1. **Immediate (S1 auth bypasses)** — Add requireAdmin() to all admin mutating endpoints
2. **Immediate (S1 privilege escalation)** — Use server-side userId everywhere
3. **Immediate (S1 race conditions)** — Use atomic Prisma operations for wallet/promo/cancellation
4. **Immediate (S1 crypto)** — Fix HMAC timing attack, switch TBO to HTTPS
5. **Short-term (S2 security)** — Add CSP, fix open redirect, sanitize dangerouslySetInnerHTML
6. **Short-term (S2 indexes)** — Add missing Prisma indexes
7. **Short-term (S2 schema)** — Create enums for all status/role fields, add unique constraints
8. **Medium-term (S2 architecture)** — Break up monolith components, add error handling
9. **Medium-term (S3 cleanup)** — Remove duplicated code, fix hardcoded URLs, add structured logging
10. **Long-term (S4 + tests)** — Add test infrastructure, clean dead code, centralize constants
