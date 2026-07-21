# GoRASA — Product Pricing Architecture

> **Purpose:** Single source of truth for pricing logic, discount capping, loyalty rewards, and admin pricing management.
> **Last updated:** 2026-07-22 (EPIC-DISC)

---

## Pricing Flow

```
TBO Base Price (from supplier)
    ↓
PricingRule markup applied (baseRate → markupAmount)
    ↓
Display Price = baseRate + markupAmount
    ↓
Discounts applied (promo + corporate + admin)
    ↓ (clamped: totalDiscount ≤ markupAmount)
Final Paid Amount = displayPrice - totalDiscount
    ↓
Gorasa Reward credited (1.5% of finalPaidAmount → loyaltyPoints)
```

**Key invariant:** Discounts can NEVER exceed the markup. GoRASA never pays the customer to book.

---

## PricingRule Model

**Table:** `PricingRule`
**Admin UI:** `/admin/pricing-rules`

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| id | String (cuid) | auto | Primary key |
| type | String | — | Rule type: `GLOBAL`, `DESTINATION`, `HOTEL`, `AIRLINE` |
| name | String | "Unnamed Rule" | Display name |
| category | String | "ALL" | `ALL`, `FLIGHT`, `HOTEL` |
| markupType | String | "PERCENT" | `PERCENT` or `FLAT` |
| markupValue | Float | 0 | Markup amount (percentage or flat currency) |
| destination | String? | null | Match by destination city |
| hotelCode | String? | null | Match by TBO hotel code (takes priority over hotelName) |
| hotelName | String? | null | Match by hotel name (substring) |
| airlineCode | String? | null | Match by airline code |
| roomType | String? | null | Match by room type |
| minPrice | Float? | null | Minimum base price to apply rule |
| maxPrice | Float? | null | Maximum base price to apply rule |
| priority | Int | 0 | Higher priority = evaluated first |
| isActive | Boolean | true | Enable/disable rule |
| validFrom | DateTime? | null | Rule start date |
| validTo | DateTime? | null | Rule end date |

### Matching Logic (pricing-service.ts)

1. Filter to active rules where validFrom/validTo bracket current date
2. Sort by priority (descending)
3. First matching rule wins:
   - `hotelCode` match (exact) — highest specificity
   - `hotelName` match (substring)
   - `destination` match
   - `airlineCode` match
   - `GLOBAL` type — fallback
4. Markup applied: `markupAmount = baseRate * (markupValue/100)` for PERCENT, or `markupAmount = markupValue` for FLAT

### Seed Data

| ID | Name | Category | Type | Markup |
|----|------|----------|------|--------|
| default-flight-markup | Flight Default 5% | FLIGHT | PERCENT | 5% |
| (7 Delhi hotels) | Hotel-specific 7% | ALL | PERCENT | 7% |

---

## PromoCode Model

**Table:** `PromoCode`
**Admin UI:** `/admin/promos`

| Field | Type | Purpose |
|-------|------|---------|
| code | String | Unique promo code (e.g., "SUMMER20") |
| discountType | String | `PERCENT` or `FLAT` |
| discountValue | Float | Discount amount |
| maxDiscount | Float? | Cap for percent discounts |
| minBookingAmount | Float? | Minimum booking to qualify |
| usageLimit | Int? | Max total uses |
| usedCount | Int | Current uses |
| validFrom | DateTime | Start date |
| validTo | DateTime | End date |
| isActive | Boolean | Enable/disable |

### Validation Flow

1. Check code exists and isActive
2. Check date range (validFrom ≤ now ≤ validTo)
3. Check usage limit (usedCount < usageLimit)
4. Check min booking amount
5. Calculate discount: `PERCENT → price * (value/100)`, capped at maxDiscount; `FLAT → value`
6. **Markup floor clamp:** If discount > markupAmount, discount = markupAmount
7. Return `{ valid, discount, cappedAmount }` — cappedAmount is set when clamped

---

## CorporateRate Model

**Table:** `CorporateRate`
**Admin UI:** `/admin/corporate-rates`

| Field | Type | Purpose |
|-------|------|---------|
| companyId | String | Associated company |
| discountType | String | `PERCENT` or `FLAT` |
| discountValue | Float | Discount amount |
| category | String | `ALL`, `FLIGHT`, `HOTEL` |

### Application Logic

1. Check if user has companyId
2. Find matching CorporateRate for company + category
3. Calculate corporate discount
4. **Markup floor clamp:** corporate discount ≤ (markupAmount - promoDiscount)
5. Applied AFTER promo code in discount stack

---

## Discount Cap Logic (EPIC-DISC)

**Rule:** `promoDiscount + corporateDiscount + adminDiscount ≤ markupAmount`

**Implementation in pricing-service.ts:**

```
1. Calculate markupAmount from PricingRule
2. Apply promo code → promoDiscount (clamped to markupAmount)
3. Apply corporate rate → corporateDiscount (clamped to markupAmount - promoDiscount)
4. Apply admin override → adminDiscount (clamped to markupAmount - promoDiscount - corporateDiscount)
5. totalDiscount = promoDiscount + corporateDiscount + adminDiscount
6. finalPrice = (baseRate + markupAmount) - totalDiscount
```

**UI feedback:** When a promo is clamped, the booking modal shows "Discount capped at ₹X" where X is the markup amount.

---

## Gorasa Reward System

**Earn rate:** 1.5% of final paid amount
**Credit trigger:** Booking status = CONFIRMED + paymentStatus = PAID
**Storage:** `User.loyaltyPoints` (INT), `Booking.rewardPointsEarned` (INT)

### Flow

1. User completes booking with payment
2. Webhook confirms payment → booking confirmed
3. `rewardPointsEarned = Math.floor(finalPaidAmount * 0.015)`
4. `User.loyaltyPoints += rewardPointsEarned`
5. Points visible on trips page and user profile

### Loyalty Tiers (User.loyaltyTier)

| Tier | Points | Benefits |
|------|--------|----------|
| Silver | 0-999 | Default |
| Gold | 1000-4999 | (Future: priority support) |
| Platinum | 5000+ | (Future: exclusive deals) |

**Note:** Tier benefits are placeholder — no tier-based pricing implemented yet.

---

## Flight vs Hotel Pricing Differences

| Aspect | Flight | Hotel |
|--------|--------|-------|
| Default markup | 5% (PricingRule seed) | 7% (Delhi hotel rules) |
| Category filter | `category = "FLIGHT"` | `category = "HOTEL"` or `ALL` |
| Base rate source | TBO Flight API fare | TBO Hotel API room rate |
| Per-night logic | N/A | Room rate × nights |
| City data mode | `mode="flight"` (IATA codes) | `mode="hotel"` (TBO city codes) |

---

## Admin Pricing Management

### Pricing Rules (`/admin/pricing-rules`)
- Create/edit/delete pricing rules
- Set category (FLIGHT, HOTEL, ALL)
- Set markup type (PERCENT, FLAT) and value
- Set priority for rule ordering
- Set date ranges for seasonal pricing
- Match by destination, hotel code, airline code

### Promo Codes (`/admin/promos`)
- Create/edit/delete promo codes
- Set discount type and value
- Set usage limits and date ranges
- View usage count

### Corporate Rates (`/admin/corporate-rates`)
- Assign discount rates to companies
- Category-specific rates (flight/hotel/all)
- Applied automatically for corporate users

### Reports (`/admin/reports`)
- Revenue breakdown: baseRate, markupAmount, totalDiscount
- Discount utilization metrics
- Reward points issued

---

## Booking Schema (Pricing Fields)

| Field | Type | Purpose |
|-------|------|---------|
| price | Float | Final paid amount |
| originalPrice | Float? | Supplier price before markup |
| baseRate | Float? | TBO base price (EPIC-DISC) |
| markupAmount | Float? | GoRASA markup (EPIC-DISC) |
| totalDiscount | Float | Sum of all discounts (EPIC-DISC) |
| discountApplied | Float | Legacy field (pre-EPIC-DISC) |
| promoCost | Float | Promo code discount amount |
| couponCodeUsed | String? | Promo code used |
| corporateDiscount | Float | Corporate rate discount |
| rewardPointsEarned | Int | Loyalty points earned (EPIC-DISC) |
| companyId | String? | Corporate booking company |
| paymentMethod | String? | Payment method used |
