# GoRASA Pricing Module — Integration Instructions

## Module Structure

```
src/lib/pricing/
├── index.ts                          # Public exports
├── types.ts                          # TypeScript interfaces
├── pricing-service.ts                # Core engine
├── migration.sql                     # SQL for Supabase
├── INTEGRATION.md                    # This file
├── api/                              # Copy to src/app/api/
│   ├── pricing-rules/route.ts        # GET/POST
│   ├── pricing-rules/[id]/route.ts   # PATCH/DELETE
│   ├── promos/validate/route.ts      # POST
│   └── corporate-rates/route.ts      # GET/POST
└── admin/                            # Copy to src/app/admin/
    ├── pricing-rules-page.tsx        # → admin/pricing/page.tsx
    ├── enhanced-promos-page.tsx      # → admin/promos/page.tsx (replace existing)
    └── corporate-rates-page.tsx      # → admin/corporate/page.tsx
```

---

## Phase 1: Database Migration

Run `src/lib/pricing/migration.sql` in Supabase SQL Editor.

What it does:
- Adds `name`, `category`, `airlineCode`, `roomType`, `markupType`, `markupValue`, `minPrice`, `maxPrice`, `priority`, `validFrom`, `validTo` to `PricingRule`
- Migrates existing `markupPercent` → `markupValue`
- Adds `maxDiscount`, `maxUses`, `usedCount`, `applicableTo`, `isFirstBooking`, `validFrom`, `validTo` to `PromoCode`
- Creates `CorporateRate` table
- Seeds 3 default rules: Hotel 15%, Flight ₹500 flat, Package 20%

---

## Phase 2: Prisma Schema Update

### 2a. Replace PricingRule model in `prisma/schema.prisma`:

```prisma
model PricingRule {
  id            String    @id @default(cuid())
  name          String
  type          String
  category      String    @default("ALL")
  destination   String?
  hotelName     String?
  airlineCode   String?
  roomType      String?
  markupType    String    @default("PERCENT")
  markupValue   Float
  minPrice      Float?
  maxPrice      Float?
  priority      Int       @default(0)
  isActive      Boolean   @default(true)
  validFrom     DateTime?
  validTo       DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 2b. Add CorporateRate model and update Company:

```prisma
model Company {
  id              String          @id @default(cuid())
  name            String
  domain          String?
  walletBalance   Float           @default(0)
  discountRate    Float           @default(0)
  isActive        Boolean         @default(true)
  approvedBy      String?
  employees       User[]
  corporateRates  CorporateRate[]  # ADD
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model CorporateRate {
  id            String   @id @default(cuid())
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id])
  category      String   @default("ALL")
  destination   String?
  discountType  String
  discountValue Float
  maxDiscount   Float?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 2c. Run:

```bash
npx prisma generate
```

---

## Phase 3: Copy API Routes

```bash
# Pricing rules CRUD
mkdir -p src/app/api/pricing-rules/\[id\]
cp src/lib/pricing/api/pricing-rules/route.ts    src/app/api/pricing-rules/route.ts
cp "src/lib/pricing/api/pricing-rules/[id]/route.ts" "src/app/api/pricing-rules/[id]/route.ts"

# Promo validation
mkdir -p src/app/api/promos/validate
cp src/lib/pricing/api/promos/validate/route.ts  src/app/api/promos/validate/route.ts

# Corporate rates CRUD
mkdir -p src/app/api/corporate-rates
cp src/lib/pricing/api/corporate-rates/route.ts  src/app/api/corporate-rates/route.ts
```

Then fix imports in copied files — change relative imports to `@/lib/pricing`:

```typescript
// In src/app/api/promos/validate/route.ts, change:
import { validatePromoCode } from "../../../pricing-service";
// To:
import { validatePromoCode } from "@/lib/pricing";
```

---

## Phase 4: Integrate Pricing into Hotel Client

**File:** `src/lib/tbo-hotel-client.ts`

### 4a. Add import (after line 14):

```typescript
import { calculatePrice } from "./pricing";
```

### 4b. Make `toDisplay` async with pricing context (replace lines 19-82):

```typescript
async function toDisplay(
  h: { HotelCode: string; Currency: string; Rooms: any[] },
  context?: { destination?: string; hotelName?: string },
): Promise<TBOHotelDisplay> {
  const rooms: TBOHotelRoomDisplay[] = h.Rooms.map((r: any, ri: number) => {
    // ... existing room mapping (unchanged) ...
  });

  const minFare = Math.min(...rooms.map(r => r.totalFare));
  const details = _hotelDetailsCache[h.HotelCode] || {};
  const ratingMap: Record<string, number> = {
    "OneStar": 1, "TwoStar": 2, "ThreeStar": 3, "FourStar": 4, "FiveStar": 5,
  };

  const pricing = await calculatePrice(minFare, {
    category: "HOTEL",
    destination: context?.destination,
    hotelName: details.name || context?.hotelName,
  });

  return {
    hotelCode: Number(h.HotelCode) || 0,
    name: details.name || `Hotel ${h.HotelCode}`,
    hotelRating: ratingMap[details.rating] || 3,
    location: details.city || details.address || "",
    currency: h.Currency,
    minTotalFare: pricing.displayedPrice,
    rooms,
    resultIndex: 1,
    picture: details.imageUrl || "",
    rating: "ThreeStar",
    address: details.address || "",
    tripAdvisorRating: 0,
    description: "",
    price: pricing.displayedPrice,
    starRating: ratingMap[details.rating] || 3,
    originalPrice: pricing.originalPrice,
  };
}
```

### 4c. Update all `toDisplay` call sites to use `await`:

There are 3 call sites in `searchHotels`:

**TBO API path (~line 235):**
```typescript
// BEFORE:
const hotels = res.HotelResult.map(h => ({ ...toDisplay(h), source: "tbo" as const }));

// AFTER:
const hotels = await Promise.all(
  res.HotelResult.map(h => toDisplay(h, { destination: params.city }))
);
return { hotels: hotels.map(h => ({ ...h, source: "tbo" as const })), traceId: _lastTraceId };
```

**Fallback path (~line 283):**
```typescript
// BEFORE:
const hotels = fallbackResults.map(h => { ... return { ...originalPrice: min * 1.2 }; });

// AFTER:
const hotels = await Promise.all(fallbackResults.map(async (h) => {
  // ... existing room mapping ...
  const minFare = Math.min(...rooms.map(r => r.totalFare));
  const pricing = await calculatePrice(minFare, {
    category: "HOTEL",
    destination: fallbackCity,
    hotelName: info?.HotelName,
  });
  return {
    // ... use pricing.displayedPrice and pricing.originalPrice ...
  };
}));
```

**Mock path (~line 332):**
```typescript
// BEFORE:
const hotels = mockRes.HotelResult.map(h => { ... return { ...originalPrice: min * 1.2 }; });

// AFTER:
const hotels = await Promise.all(mockRes.HotelResult.map(async (h) => {
  // ... existing room mapping ...
  const minFare = Math.min(...rooms.map(r => r.totalFare));
  const pricing = await calculatePrice(minFare, {
    category: "HOTEL",
    destination: location,
    hotelName: info?.HotelName,
  });
  return {
    // ... use pricing.displayedPrice and pricing.originalPrice ...
  };
}));
```

---

## Phase 5: Integrate Pricing into Flight Client

**File:** `src/lib/tbo-flight-client.ts`

### 5a. Add import (after line 18):

```typescript
import { calculatePrice } from "./pricing";
```

### 5b. Make `toDisplay` async (replace lines 50-81):

```typescript
async function toDisplay(
  r: TBOFlightResult,
  leg: "outbound" | "inbound" | "oneway",
): Promise<TBOFlightDisplay> {
  const pricing = await calculatePrice(r.Fare.PublishedFare, {
    category: "FLIGHT",
    airlineCode: r.Segments[0]?.AirlineCode,
  });

  return {
    resultIndex: r.ResultIndex,
    leg,
    isLCC: r.IsLCC,
    isRefundable: r.IsRefundable,
    source: r.Source,
    airline: r.Segments[0]?.Airline ?? "",
    airlineCode: r.Segments[0]?.AirlineCode ?? "",
    flightNumber: r.Segments[0]?.FlightNumber ?? "",
    operatingCarrier: r.Segments[0]?.OperatingCarrier ?? "",
    origin: r.Segments[0]?.Origin ?? "",
    destination: r.Segments[0]?.Destination ?? "",
    departureTime: r.Segments[0]?.DepTime ?? "",
    arrivalTime: r.Segments[0]?.ArrTime ?? "",
    duration: r.Segments[0]?.Duration ?? "",
    cabinClass: r.Segments[0]?.CabinClass ?? "",
    baggage: r.Segments[0]?.Baggage ?? "",
    cabinBaggage: r.Segments[0]?.CabinBaggage ?? "",
    currency: r.Fare.Currency,
    publishedFare: pricing.displayedPrice,
    offeredFare: pricing.displayedPrice,
    baseFare: pricing.baseRate,
    tax: r.Fare.Tax,
    commissionEarned: r.Fare.CommissionEarned,
    segments: r.Segments,
    fareBreakdown: r.FareBreakdown,
  };
}
```

### 5c. Update both `toDisplay` call sites in `searchFlights`:

```typescript
// TBO path (~line 121) and mock path (~line 146):
// BEFORE:
const flights = res.Response.Results.map(r => { ... return toDisplay(r, leg); });

// AFTER:
const flights = await Promise.all(
  res.Response.Results.map(r => {
    const isReturn = params.JourneyType === 2 || params.JourneyType === 5;
    const tripInd = r.Segments[0]?.TripIndicator ?? 1;
    let leg: "outbound" | "inbound" | "oneway";
    if (!isReturn) leg = "oneway";
    else if (tripInd === 1) leg = "outbound";
    else leg = "inbound";
    return toDisplay(r, leg);
  })
);
```

---

## Phase 6: Server-Side Booking Pricing

**File:** `src/app/api/bookings/route.ts`

### 6a. Add imports:

```typescript
import { validatePromoCode, getCorporateDiscount, calculateTax } from "@/lib/pricing";
```

### 6b. In POST handler, after destructuring body (~line 62), add:

```typescript
// --- SERVER-SIDE PRICING ---
let finalPrice = Number(price);
let promoDiscount = 0;
let taxAmount = 0;

if (couponCodeUsed) {
  const promoResult = await validatePromoCode(couponCodeUsed, finalPrice, type, user.id);
  if (promoResult.valid) {
    promoDiscount = promoResult.discountAmount;
    finalPrice = promoResult.finalPrice;
  }
}

if (user.companyId) {
  const corpResult = await getCorporateDiscount(user.companyId, type, undefined, finalPrice);
  if (corpResult.discountAmount > 0) {
    promoDiscount += corpResult.discountAmount;
    finalPrice = corpResult.finalPrice;
  }
}

taxAmount = calculateTax(finalPrice, type);
const totalPrice = finalPrice + taxAmount;
// --- END SERVER-SIDE PRICING ---
```

### 6c. In the Booking insert, use computed values:

```typescript
.insert({
  // ...
  price: totalPrice,
  originalPrice: Number(price),
  discountApplied: promoDiscount,
  couponCodeUsed: couponCodeUsed || null,
  // ...
})
```

---

## Phase 7: Fix InvoiceModal GST

**File:** `src/components/InvoiceModal.tsx`

### Replace line 37:

```typescript
// BEFORE:
const gst = Math.round(subtotal * 0.05);

// AFTER:
const gstRate = booking.type === "FLIGHT" ? 0.18 : 0.05;
const gstLabel = booking.type === "FLIGHT" ? "GST (18%)" : "GST (5%)";
const gst = Math.round(subtotal * gstRate);
```

### Update the label (~line 116):

```typescript
// BEFORE:
<span className="text-slate-600">GST (5%)</span>

// AFTER:
<span className="text-slate-600">{gstLabel}</span>
```

---

## Phase 8: Copy Admin Pages

```bash
# Pricing rules admin
mkdir -p src/app/admin/pricing
cp src/lib/pricing/admin/pricing-rules-page.tsx src/app/admin/pricing/page.tsx

# Enhanced promos (replaces existing admin/promos/page.tsx)
cp src/lib/pricing/admin/enhanced-promos-page.tsx src/app/admin/promos/page.tsx

# Corporate rates admin
mkdir -p src/app/admin/corporate
cp src/lib/pricing/admin/corporate-rates-page.tsx src/app/admin/corporate/page.tsx
```

### Add admin navigation (in `src/app/api/navigation/route.ts` or Supabase NavigationItem table):

Add these entries to the admin section:

```json
{ "href": "/admin/pricing", "label": "Pricing Rules", "icon": "DollarSign", "section": "admin" }
{ "href": "/admin/corporate", "label": "Corporate Rates", "icon": "Building2", "section": "admin" }
```

### Update admin layout icons (`src/app/admin/layout.tsx`):

```typescript
import { ..., DollarSign } from "lucide-react";

const ADMIN_ICONS: Record<string, React.ReactNode> = {
  // ... existing ...
  DollarSign: <DollarSign size={18} />,
};
```

---

## Verification Checklist

| # | Check | How |
|---|-------|-----|
| 1 | TypeScript clean | `npx tsc --noEmit` |
| 2 | Migration ran | Supabase: PricingRule has new columns, CorporateRate exists |
| 3 | Seed data | 3 default rules in PricingRule table |
| 4 | Hotel pricing | Search hotels → prices include markup (higher than TBO raw) |
| 5 | Flight pricing | Search flights → publishedFare includes markup |
| 6 | Promo validation | POST `/api/promos/validate` with code + amount |
| 7 | Invoice GST | Hotel invoice shows 5%, flight shows 18% |
| 8 | Admin pricing | `/admin/pricing` — create/edit/delete rules |
| 9 | Admin promos | `/admin/promos` — create with new fields (maxDiscount, applicableTo, etc.) |
| 10 | Admin corporate | `/admin/corporate` — create rates per company |
| 11 | Fallback | If pricing-service fails, search still works (returns base rate) |

---

## Architecture Summary

```
Search Time:                          Checkout Time:
┌──────────────┐                     ┌──────────────────┐
│ TBO/API      │                     │ POST /api/bookings│
│ Base Rate    │                     │                  │
│     ↓        │                     │ 1. Validate promo │
│ calculatePrice()                   │ 2. Corp discount  │
│ (rule lookup)│                     │ 3. Calculate tax  │
│     ↓        │                     │ 4. Store final    │
│ Displayed +  │                     └──────────────────┘
│ Original     │
└──────────────┘
```

- **Display time**: markup applied when results shown
- **Booking time**: server re-validates, applies promos/corp rates, calculates tax
- **Rule hierarchy**: most specific wins (hotel > destination > category > global)
- **Fallback**: if pricing fails, base rate shown (never blocks booking)
- **GST**: 5% hotels/packages, 18% flights
- **Cache**: 60s TTL on pricing rules; call `invalidateRulesCache()` after admin changes
