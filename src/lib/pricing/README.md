# GoRASA Pricing Module

Server-side pricing engine for GoRASA — applies markups, promo codes, corporate discounts, and GST across hotels, flights, and packages.

## What It Does

```
TBO Base Rate → PricingRule Markup → Display Price
                                         ↓
                                    Promo Discount
                                         ↓
                                    Corporate Rate
                                         ↓
                                    GST (5% hotel / 18% flight)
                                         ↓
                                    Final Price
```

**Before this module:** GoRASA sold at TBO cost with zero margin.  
**After:** Configurable markup per category/destination/hotel, promo validation, corporate rates, correct GST.

## Quick Start

```bash
# 1. Run migration in Supabase SQL Editor
cat src/lib/pricing/migration.sql | pbcopy   # paste into Supabase Dashboard → SQL Editor

# 2. Update Prisma schema (see INTEGRATION.md Phase 2)
npx prisma generate

# 3. Copy API routes
cp -r src/lib/pricing/api/pricing-rules    src/app/api/
cp -r src/lib/pricing/api/promos/validate  src/app/api/promos/
cp -r src/lib/pricing/api/corporate-rates  src/app/api/

# 4. Copy admin pages
cp src/lib/pricing/admin/pricing-rules-page.tsx  src/app/admin/pricing/page.tsx
cp src/lib/pricing/admin/enhanced-promos-page.tsx src/app/admin/promos/page.tsx
cp src/lib/pricing/admin/corporate-rates-page.tsx src/app/admin/corporate/page.tsx

# 5. Integrate into TBO clients (see INTEGRATION.md Phases 4-7)
```

## Files

| File | Purpose |
|------|---------|
| `pricing-service.ts` | Core engine — `calculatePrice()`, `validatePromoCode()`, `getCorporateDiscount()`, `calculateTax()` |
| `types.ts` | TypeScript interfaces |
| `migration.sql` | Supabase SQL (schema + seed 3 default rules) |
| `api/pricing-rules/` | CRUD for pricing rules |
| `api/promos/validate/` | Server-side promo validation |
| `api/corporate-rates/` | CRUD for corporate rates |
| `admin/pricing-rules-page.tsx` | Admin UI for pricing rules |
| `admin/enhanced-promos-page.tsx` | Admin UI for promos (replaces existing) |
| `admin/corporate-rates-page.tsx` | Admin UI for corporate rates |

## API Usage

### Calculate price (used internally by TBO clients)

```typescript
import { calculatePrice } from "@/lib/pricing";

const result = await calculatePrice(5000, {
  category: "HOTEL",
  destination: "Goa",
  hotelName: "Taj Fort Aguada",
});

// result.displayedPrice = 5750  (15% markup)
// result.originalPrice  = 7188  (25% above displayed, for strikethrough)
// result.appliedRuleName = "Goa Hotel Markup"
```

### Validate promo code

```typescript
import { validatePromoCode } from "@/lib/pricing";

const result = await validatePromoCode("SUMMER10", 5750, "HOTEL", "user-id-123");

// result.valid = true
// result.discountAmount = 575
// result.finalPrice = 5175
```

### Get corporate discount

```typescript
import { getCorporateDiscount } from "@/lib/pricing";

const result = await getCorporateDiscount("company-id", "HOTEL", "Goa", 5175);

// result.discountAmount = 517.5 (10% corp rate)
// result.finalPrice = 4657.5
```

### Calculate tax

```typescript
import { calculateTax } from "@/lib/pricing";

calculateTax(5000, "HOTEL");   // 250  (5%)
calculateTax(5000, "FLIGHT");  // 900  (18%)
```

## Pricing Rule Hierarchy

Most specific rule wins:

```
Global Rule (category=ALL)
  └── Category Rule (category=HOTEL)
        └── Destination Rule (destination=Goa)
              └── Hotel Rule (hotelName=Taj Fort Aguada)
                    └── Room Rule (roomType=SUIT)
```

Rules are ordered by `priority` (higher wins). Time validity (`validFrom`/`validTo`) is checked automatically.

## Default Seed Data

| Rule | Category | Markup |
|------|----------|--------|
| Global Hotel Markup | HOTEL | 15% |
| Global Flight Markup | FLIGHT | ₹500 flat |
| Global Package Markup | PACKAGE | 20% |

## Admin Pages

| URL | Page |
|-----|------|
| `/admin/pricing` | Create/edit/delete pricing rules |
| `/admin/promos` | Create promos with expiry, usage limits, category filtering |
| `/admin/corporate` | Set per-company negotiated rates |

## Architecture

- **Display time**: markup applied when search results are shown
- **Booking time**: server re-validates price, applies promo/corp, calculates tax
- **Fallback**: if pricing service fails, base TBO rate is shown (never blocks booking)
- **Cache**: 60s TTL on pricing rules — call `invalidateRulesCache()` after admin changes

## Full Integration Guide

See [INTEGRATION.md](./INTEGRATION.md) for step-by-step instructions covering all 9 phases.
