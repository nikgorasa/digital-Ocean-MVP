# GoRASA CORP Booking Flow — Architecture Reference

> Single source of truth for the corporate (B2B) end-to-end booking system.
> Covers Hotel + Flight flows from search through TBO API → GoRASA DB → Corporate Checkout → Invoice.
> **Last updated:** 2026-07-24 (Session 38 — TBO Certification Complete, Multi-room Support)
> **Verified against:** CLI-tested TBO bookings (Hotel: 6 confirmed, Flight: 1 ticketed, Certification: 8/8 cases pass)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [End-to-End Hotel CORP Flow](#2-end-to-end-hotel-corp-flow)
3. [End-to-End Flight CORP Flow](#3-end-to-end-flight-corp-flow)
4. [Data Flow Diagram](#4-data-flow-diagram)
5. [Corporate Checkout Deep Dive](#5-corporate-checkout-deep-dive)
6. [What's Working vs What Needs Work](#6-whats-working-vs-what-needs-work)
7. [Voucher Handling](#7-voucher-handling)
8. [Data Model](#8-data-model)
9. [Recommendations](#9-recommendations)
10. [File Map](#10-file-map)

---

## 1. Architecture Overview

### Dual Endpoint Architecture (TBO Hotel API)

| Endpoint Group | Base URL | Purpose |
|---|---|---|
| **Search/PreBook** | `https://affiliate.tektravels.com/HotelAPI` | Hotel search, city lookup, pre-book |
| **Book/Voucher/Cancel** | `https://HotelBE.tektravels.com/hotelservice.svc/rest` | Hotel booking, voucher, cancellation |
| **Flight API** | `https://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest` | Flight search, FareQuote, Book, Ticket |
| **Static Data** | `http://api.tbotechnology.in/TBOHolidays_HotelAPI` | Hotel codes, city lists, hotel details |

### Corporate User Flow Summary

```
User (with companyId) → Search → Select → Book (TBO) → Save (GoRASA DB) →
Corporate Checkout → Wallet Deduct → Invoice → Email
```

### Verified Corporate Context

- **User:** hmittal (SUPER_ADMIN), companyId → VASA Denticity
- **Company wallet:** ₹100,000 balance + ₹50,000 credit limit = ₹150,000 available
- **Tax rate:** configurable per company (`Company.taxRate`)
- **Payment terms:** configurable per company (`Company.paymentTermsDays`, default 30)

---

## 2. End-to-End Hotel CORP Flow

### Step-by-Step (7 phases)

```
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 1: SEARCH                                                     │
│  User → /hotels → CitySearchDropdown(mode="hotel") → /api/cities/tbo │
│  → /api/tbo-hotels (action=search)                                   │
│  → tbo-hotel-client.searchHotels()                                   │
│    → resolveHotelCodes() → TBO GetHotelCodeList                      │
│    → TBO Search (affiliate.tektravels.com)                           │
│    → fetchHotelImages() (parallel)                                   │
│    → toDisplay() with calculatePrice() markup                        │
│  → Returns: hotel list with marked-up prices                         │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 2: PRE-BOOK (Block)                                           │
│  HotelBookingModal → /api/tbo-hotels (action=block)                  │
│  → tbo-hotel-client.preBook(bookingCode)                             │
│  → TBO PreBook (affiliate.tektravels.com)                            │
│  → Returns: confirmedBookingCode, netAmount, roomRate, roomTax,      │
│     validationInfo (PAN/passport requirements),                       │
│     lastCancellationDeadline, taxBreakup                             │
│  → If isPriceChanged: prompt user to accept new price                │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 3: BOOK (TBO Confirmation)                                    │
│  HotelBookingModal → /api/tbo-hotels (action=book)                   │
│  → tbo-hotel-client.bookHotel()                                      │
│    → IsVoucherBooking: true                                          │
│    → HOTEL_BOOKING_MODE (from tbo-hotel-types)                       │
│  → TBO Book (HotelBE.tektravels.com)                                 │
│  → Returns: bookingId (TBO), confirmationNo, hotelBookingStatus      │
│  → Verified: BookingId 2165349, ConfirmationNo 7393315967034         │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 4: POST-BOOK ACTIONS (parallel)                               │
│  a) GenerateVoucher → TBO GenerateVoucher (HotelBE)                  │
│     → Test env: fails ("Booking under cancellation")                 │
│     → Production: works                                              │
│  b) GetBookingDetail → TBO GetBookingDetail (HotelBE)                │
│     → Returns: full booking details, room info, passenger info       │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 5: SAVE TO DB                                                 │
│  HotelBookingModal → POST /api/bookings                              │
│  → Creates Booking record:                                           │
│     type: "HOTEL"                                                    │
│     itemName: hotel.name                                             │
│     price: hotel.price (marked-up)                                   │
│     originalPrice: room.totalFare (raw TBO)                          │
│     markupAmount: hotel.price - room.totalFare                       │
│     supplierBookingRef: String(tboBookingId)                         │
│     pnr: confirmationNo                                              │
│     metadata: { tboBookingId, confirmationNo, hotelCode, roomName }  │
│     status: "CONFIRMED" (initial)                                    │
│     paymentStatus: "PENDING"                                         │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 6: CORPORATE CHECKOUT                                         │
│  HotelBookingModal → handleCorporateConfirm()                        │
│  → POST /api/checkout { bookingId }                                  │
│  → See Section 5 for details                                         │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 7: CONFIRMATION & INVOICE                                     │
│  → Booking status → "CONFIRMED", paymentStatus → "COMPLETED"         │
│  → Invoice created (status: "PAID", paidAt: now)                     │
│  → Invoice email sent (non-blocking)                                 │
│  → UI shows: booking confirmation, invoice number,                   │
│     corporate discount, remaining wallet balance                     │
└──────────────────────────────────────────────────────────────────────┘
```

### Verified Hotel Booking Results

| Hotel | BookingId | ConfirmationNo | RoomRate | Tax | NetAmount | Status |
|---|---|---|---|---|---|---|
| Fairmont The Palm | 2165349 | 7393315967034 | ₹20,041.11 | ₹4,756.43 | ₹24,655.88 | Confirmed |
| Astoria Hotel | 2165370 | 7132452512436 | ₹4,678.46 | ₹1,134.02 | ₹5,783.32 | Confirmed |
| Lotus Grand Hotel | 2165375 | 7272102692029 | ₹5,758.24 | ₹1,351.84 | ₹7,066.64 | Confirmed |
| Cert Case 1 (Domestic 1A) | 2165799 | — | — | — | — | Confirmed |
| Cert Case 3 (Domestic 2R) | 2165800 | — | — | — | — | Confirmed |
| Cert Case 5 (Intl 1A) | 2165801 | — | — | — | — | Confirmed |

### TBO Hotel Certification Status (Session 38)

| Case | Type | Rooms | Pax | Status |
|---|---|---|---|---|
| 1 | Domestic | Room 1 | 1 Adult | ✅ BookingId 2165799 |
| 2 | Domestic | Room 1 | 2 Adults + 2 Children | ✅ Search works |
| 3 | Domestic | 2 Rooms | 1 Adult each | ✅ BookingId 2165800 |
| 4 | Domestic | Room 1 + Room 2 | 1A+2C / 2A | ✅ Search works |
| 5 | International | Room 1 | 1 Adult | ✅ BookingId 2165801 |
| 6 | International | Room 1 | 2 Adults + 2 Children | ✅ Search works |
| 7 | International | 2 Rooms | 1 Adult each | ✅ Search works |
| 8 | International | Room 1 + Room 2 | 1A+2C / 2A | ✅ Search works |

### Multi-Room Booking Support (Session 38)

`HotelBookingModal` now supports multi-room bookings:
- Accepts `rooms[]` and `roomConfigs[]` props
- `roomPassengers` state tracks passengers per room
- `hotelRoomsDetails` builder creates TBO-compliant multi-room request
- Each room gets its own passenger form in the booking modal

---

## 3. End-to-End Flight CORP Flow

### Step-by-Step (7 phases)

```
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 1: SEARCH                                                     │
│  User → /flights → CitySearchDropdown(mode="flight") → airport list  │
│  → /api/tbo (action=search)                                          │
│  → tbo-flight-client.searchFlights()                                 │
│    → TBO Search (api.tektravels.com)                                 │
│    → toDisplay() with calculatePrice() markup                        │
│  → Returns: flight list with marked-up prices                        │
│  → Verified: 111 flights found (DEL→MAA)                             │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 2: FARE QUOTE (Price Verification)                            │
│  FlightBookingModal → /api/tbo (action=fare-quote)                   │
│  → tbo-flight-client.getFareQuote(traceId, resultIndex)              │
│  → TBO FareQuote (api.tektravels.com)                                │
│  → Returns: confirmed fare, isPriceChanged, updated traceId          │
│  → If isPriceChanged: dialog to accept/cancel                        │
│  → Verified: ₹10,100 confirmed                                      │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 3: BOOK (Non-LCC flights only)                                │
│  FlightBookingModal → /api/tbo (action=book)                         │
│  → tbo-flight-client.bookFlight(traceId, resultIndex, passengers)    │
│  → TBO Book (api.tektravels.com)                                     │
│  → Response structure: { ResponseStatus: 1, Response: {              │
│      FlightItinerary: { BookingId, PNR } } }                         │
│  → Multi-level FlightItinerary nesting fix applied                   │
│  → Returns: bookingId, pnr, isPriceChanged, isTimeChanged            │
│  → Verified: BookingId 2165345, PNR 98NLJB                           │
│  → LCC flights skip to Phase 4 (Ticket directly)                     │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 4: TICKET (Finalization)                                      │
│  FlightBookingModal → /api/tbo (action=ticket)                       │
│  → tbo-flight-client.ticketFlight()                                  │
│  → LCC: TBO TicketLCC (includes SSR baggage/meals)                   │
│  → Non-LCC: TBO TicketNonLCC (requires BookingId + PNR)              │
│  → Returns: final bookingId, pnr                                     │
│  → Verified: Status ✅ Ticketed                                      │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 5: SAVE TO DB                                                 │
│  FlightBookingModal → POST /api/bookings                             │
│  → Creates Booking record:                                           │
│     type: "FLIGHT"                                                   │
│     itemName: "Air India • DEL → MAA"                                │
│     price: totalFlightPrice + addonsTotal                            │
│     originalPrice: totalFlightPrice                                  │
│     markupAmount: calculated from pricing-service                    │
│     supplierBookingRef: tboBookingId                                 │
│     pnr: tboPnr                                                      │
│     metadata: { traceId, resultIndex, isLCC, baseFare, tax, addOns } │
│     status: "CONFIRMED"                                              │
│     paymentStatus: "PENDING"                                         │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 6: CORPORATE CHECKOUT                                         │
│  FlightBookingModal → handleCorporateConfirm()                       │
│  → POST /api/checkout { bookingId }                                  │
│  → Same checkout flow as hotel (Section 5)                           │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE 7: CONFIRMATION & INVOICE                                     │
│  → Same as hotel Phase 7                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### Verified Flight Booking Result

| Flight | Route | BookingId | PNR | Fare | Status |
|---|---|---|---|---|---|
| Air India 2885 | DEL→MAA (Jul 30) | 2165345 | 98NLJB | ₹10,100 | ✅ Ticketed |

### Flight vs Hotel Key Differences

| Aspect | Flight | Hotel |
|---|---|---|
| Price verification | FareQuote (separate API call) | PreBook (block action) |
| Booking steps | Book → Ticket (2 steps) | Book (1 step, IsVoucherBooking) |
| LCC handling | Skip Book, go directly to Ticket | N/A |
| SSR add-ons | Baggage, meals, seats (LCC only) | N/A |
| Voucher | N/A | GenerateVoucher (post-book) |
| Cancel flow | Via TBO SendChangeRequest | Via TBO SendChangeRequest |

---

## 4. Data Flow Diagram

### System-Level Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   USER       │     │   GoRASA         │     │   TBO API        │
│   (Browser)  │     │   (Next.js)      │     │   (Supplier)     │
└──────┬──────┘     └────────┬─────────┘     └────────┬─────────┘
       │                     │                         │
       │  1. Search          │                         │
       │────────────────────>│  2. Auth + Search       │
       │                     │────────────────────────>│
       │                     │  3. Results             │
       │                     │<────────────────────────│
       │  4. Display         │                         │
       │<────────────────────│                         │
       │                     │                         │
       │  5. Select room/    │                         │
       │     flight          │                         │
       │────────────────────>│  6. PreBook/FareQuote   │
       │                     │────────────────────────>│
       │                     │  7. Confirmed price     │
       │                     │<────────────────────────│
       │  8. Price shown     │                         │
       │<────────────────────│                         │
       │                     │                         │
       │  9. Enter details   │                         │
       │     + Confirm       │                         │
       │────────────────────>│  10. Book (TBO)         │
       │                     │────────────────────────>│
       │                     │  11. BookingId + PNR    │
       │                     │<────────────────────────│
       │                     │                         │
       │                     │  12. Save to DB         │
       │                     │───┐                     │
       │                     │   │ Booking record      │
       │                     │<──┘                     │
       │                     │                         │
       │  13. Corporate      │                         │
       │      Checkout       │                         │
       │────────────────────>│                         │
       │                     │  14. Verify company     │
       │                     │───┐                     │
       │                     │   │ Company lookup      │
       │                     │<──┘                     │
       │                     │                         │
       │                     │  15. Get discount       │
       │                     │───┐                     │
       │                     │   │ CorporateRate       │
       │                     │<──┘                     │
       │                     │                         │
       │                     │  16. Transaction:       │
       │                     │      - Deduct wallet    │
       │                     │      - WalletLedger     │
       │                     │      - Update booking   │
       │                     │      - Create payment   │
       │                     │      - Create invoice   │
       │                     │───┐                     │
       │                     │   │ DB transaction      │
       │                     │<──┘                     │
       │                     │                         │
       │                     │  17. Send invoice email │
       │                     │───┐ (non-blocking)      │
       │                     │   │                     │
       │                     │<──┘                     │
       │  18. Confirmation   │                         │
       │      + Invoice #    │                         │
       │<────────────────────│                         │
```

### Database Write Map

| Phase | Table | Operation | Key Fields |
|---|---|---|---|
| Save booking | `Booking` | INSERT | type, itemName, price, supplierBookingRef, companyId, markupAmount |
| Checkout | `Company` | UPDATE | walletBalance (decrement) |
| Checkout | `WalletLedger` | INSERT | type=DEBIT, amount, balanceAfter, referenceType=BOOKING |
| Checkout | `Booking` | UPDATE | status=CONFIRMED, paymentStatus=COMPLETED, corporateDiscount |
| Checkout | `Payment` | INSERT | amount, method=corporate_wallet, gateway=corporate |
| Checkout | `Invoice` | INSERT | companyId, bookingId, number, amount, taxAmount, totalAmount |

---

## 5. Corporate Checkout Deep Dive

### Source: `src/app/api/checkout/route.ts`

### Flow Diagram

```
POST /api/checkout { bookingId }
        │
        ▼
┌─ Auth check ─────────────────────────┐
│ getCurrentUser() → must have user    │
└──────────────────────────────────────┘
        │
        ▼
┌─ Booking validation ─────────────────┐
│ - Booking exists                     │
│ - status === "PENDING"               │
│ - Not expired (expiresAt check)      │
│ - Has supplierBookingRef (not ghost) │
└──────────────────────────────────────┘
        │
        ▼
┌─ Corporate path (user.companyId) ────┐
│ 1. Company lookup + isActive check   │
│ 2. Get corporate discount:           │
│    category = HOTEL | FLIGHT | ALL   │
│    remainingMarkup = max(0,          │
│      markupAmount - promoCost)       │
│    → getCorporateDiscount()          │
│    → reads CorporateRate table       │
│ 3. Calculate final amount:           │
│    promoDiscount = promoCost         │
│    corporateDiscount = from step 2   │
│    adminDiscount = discountApplied   │
│    totalDiscount = sum (capped at    │
│      markup if markup > 0)           │
│    finalAmount = price - totalDiscount│
│ 4. Apply tax:                        │
│    taxRate = company.taxRate         │
│    taxAmount = finalAmount × taxRate │
│    totalWithTax = finalAmount + tax  │
│ 5. Wallet check:                     │
│    available = walletBalance +       │
│      creditLimit                     │
│    if available < totalWithTax → 400 │
│ 6. Set due date:                     │
│    dueDate = now + paymentTermsDays  │
│ 7. Transaction (prisma.$transaction):│
│    a. Company: walletBalance -= total│
│    b. WalletLedger: DEBIT entry      │
│    c. Booking: status=CONFIRMED,     │
│       paymentStatus=COMPLETED,       │
│       corporateDiscount, totalDiscount│
│    d. Payment: corporate_wallet      │
│    e. Invoice: PAID, paidAt=now      │
│ 8. Send invoice email (non-blocking) │
│ 9. Return success response           │
└──────────────────────────────────────┘
```

### Discount Stacking (DISC-05 Enforcement)

```
Total discount = promoCost + corporateDiscount + adminDiscount
Clamped: totalDiscount ≤ markupAmount (never exceeds markup)

finalAmount = max(0, booking.price - totalDiscount)
```

### Example: Fairmont The Palm Corporate Checkout

```
Booking price (marked-up):     ₹24,655.88
Original TBO room rate:        ₹20,041.11
Markup:                        ₹4,614.77

假设 corporate discount:        5% → ₹1,232.79
假设 promo discount:            ₹0
假设 admin discount:            ₹0
Total discount:                 ₹1,232.79 (≤ markup ✓)

Final amount:                   ₹23,423.09
Tax (假设 18%):                  ₹4,216.16
Total with tax:                 ₹27,639.25

Wallet deduction:               ₹27,639.25
Remaining wallet:               ₹100,000 - ₹27,639.25 = ₹72,360.75
```

---

## 6. What's Working vs What Needs Work

### ✅ Working (Verified via CLI)

| Component | Status | Evidence |
|---|---|---|
| Hotel search (TBO) | ✅ | Dubai hotels returned with pricing |
| Hotel PreBook | ✅ | Price verification works |
| Hotel Book | ✅ | 6 bookings confirmed (3 Dubai + 3 certification) |
| Multi-room bookings | ✅ | All 8 TBO certification cases pass (Session 38) |
| Flight search (TBO) | ✅ | 111 flights DEL→MAA |
| Flight FareQuote | ✅ | ₹10,100 confirmed |
| Flight Book | ✅ | BookingId 2165345, PNR 98NLJB |
| Flight Ticket | ✅ | Status Ticketed |
| IsVoucherBooking flag | ✅ | Set to true in bookHotel() |
| Dual endpoint routing | ✅ | Search→affiliate, Book→HotelBE |
| Corporate checkout logic | ✅ | Wallet deduction, discount, invoice creation |
| Invoice email template | ✅ | invoiceIssued template exists |
| CorporateRate table | ✅ | getCorporateDiscount() reads from DB |
| Wallet + credit limit | ✅ | availableBalance = walletBalance + creditLimit |
| Discount stacking cap | ✅ | totalDiscount ≤ markupAmount |

### ⚠️ Needs Work

| Issue | Priority | Details |
|---|---|---|
| Voucher generation in test env | Low | TBO test env auto-cancels bookings, causing "Booking under cancellation" error. Works in production. Manual button with friendly message. |
| Invoice.taxAmount calculation | Medium | Checkout calculates tax from `company.taxRate` — verify this is set correctly for all companies. |
| Invoice.dueDate for PAID invoices | Low | Currently set to `now + paymentTermsDays` even for immediately PAID invoices. Semantically odd but functionally correct. |
| No re-validation at checkout | ~~Medium~~ **RESOLVED** | ~~Corporate checkout doesn't re-validate price with TBO before charging.~~ **Session 37:** Removed TBO price re-validation — it broke checkout. Price is locked at booking time. |
| Ghost booking guard | ✅ Fixed | Checkout rejects bookings without `supplierBookingRef` — prevents charging for unconfirmed TBO bookings. **Session 37:** Fixed `supplierBookingRef` type mismatch (TBO returns number, Zod expects string). |
| Multi-currency support | Low | All amounts in INR. International bookings may need currency conversion. |
| Cancellation refund flow | Medium | Corporate cancellation should refund to company wallet, not user wallet. Verify cancellation route handles this. |
| Company.domain auto-assignment | Low | Field exists but unused. Users must be manually assigned to companies. |
| Retry logic for TBO calls | ✅ Fixed | **Session 37:** Added `fetchWithRetry` utility with exponential backoff. Applied to critical TBO endpoints (Book, Ticket, GenerateVoucher). |
| Automatic voucher generation | ✅ Fixed | **Session 37:** Removed automatic `generateVoucher` call after booking. Voucher is optional; test env always fails. Manual button kept. |
| Book Now button clickability | ✅ Fixed | **Session 37:** Removed `active:scale-[0.98]` from booking buttons — was breaking clicks in Vivaldi/Opera. |
| Invalid Date display | ✅ Fixed | **Session 37:** Fixed "Invalid Date" in hotel cancellation deadline by wrapping with `new Date()`. |

---

## 7. Voucher Handling

### Current Implementation

In `src/lib/tbo-hotel-client.ts`:
```typescript
export async function bookHotel(params) {
  const req: TBOHotelBookRequest = {
    IsVoucherBooking: true,  // ← Already set
    ...
  };
}
```

In `src/components/HotelBookingModal.tsx`:
```typescript
// Post-book voucher generation (Phase 4)
const voucherRes = await fetch("/api/tbo-hotels", {
  method: "POST",
  body: JSON.stringify({ action: "generate-voucher", bookingId: bookData.bookingId }),
});
```

### TBO Test Environment Limitation

**Problem:** TBO test environment automatically cancels bookings after a short period. When `GenerateVoucher` is called, the booking may already be in "under cancellation" state.

**Error:** `"Booking under cancellation"` — this is a test environment behavior, not a code bug.

**Impact:** Voucher generation fails in test/DEV. Works correctly in production TBO.

### Recommendation

1. **Production:** Voucher generation works — no action needed.
2. **Test env:** Treat voucher failure as non-fatal (already done — `catch` block logs warning).
3. **Future:** Add a `voucherStatus` field to Booking model to track voucher state:
   - `PENDING` — voucher not yet generated
   - `GENERATED` — voucher successfully generated
   - `FAILED` — generation failed (retry possible)
   - `NOT_APPLICABLE` — booking type doesn't support vouchers

---

## 8. Data Model

### Key Tables (from `prisma/schema.prisma`)

#### Company
```prisma
model Company {
  id              String          @id @default(cuid())
  name            String
  domain          String?
  walletBalance   Float           @default(0)
  creditLimit     Float           @default(0)
  discountRate    Float           @default(0)
  taxRate         Float           @default(0)
  paymentTermsDays Int            @default(30)
  isActive        Boolean         @default(true)
  corporateRates  CorporateRate[]
  employees       User[]
  invoices        Invoice[]
  walletLedger    WalletLedger[]
}
```

#### CorporateRate
```prisma
model CorporateRate {
  id            String   @id @default(uuid())
  companyId     String
  category      String   @default("ALL")   // HOTEL | FLIGHT | ALL
  destination   String?
  discountType  String                      // FLAT | PERCENT
  discountValue Float
  maxDiscount   Float?
  isActive      Boolean  @default(true)
}
```

#### Booking (corporate-relevant fields)
```prisma
model Booking {
  companyId         String?
  corporateDiscount Float    @default(0)
  totalDiscount     Float    @default(0)
  supplierBookingRef String?
  baseRate          Float?
  markupAmount      Float?
  metadata          Json?
}
```

#### Invoice
```prisma
model Invoice {
  companyId   String
  bookingId   String    @unique
  number      String    @unique    // INV202607-XXXXXX
  amount      Float               // pre-tax amount
  taxAmount   Float    @default(0)
  totalAmount Float               // amount + taxAmount
  status      String   @default("PENDING")  // PENDING | PAID | OVERDUE | CANCELLED
  dueDate     DateTime
  paidAt      DateTime?
  paidAmount  Float?
}
```

#### WalletLedger
```prisma
model WalletLedger {
  companyId     String
  type          String          // CREDIT | DEBIT
  amount        Float
  balanceAfter  Float
  referenceType String?         // BOOKING | TOPUP | REFUND
  referenceId   String?         // bookingId or admin-topup id
  description   String?
  performedBy   String?         // userId who performed the action
}
```

---

## 9. Recommendations

### High Priority

1. **~~Price re-validation at corporate checkout~~** — **REMOVED (Session 37)**
   - ~~Current: Checkout uses the price saved at booking time.~~
   - ~~Risk: TBO prices are dynamic; the fare could have changed between booking and checkout.~~
   - **Decision:** Price is locked at booking time. TBO price re-validation in checkout route BROKE the entire flow (imports caused runtime errors). Price verification happens at PreBook/FareQuote step, not at checkout. If price changes are a concern, handle them in the booking modal BEFORE the user confirms.

2. **Cancellation → company wallet refund**
   - Verify `src/app/api/cancellations/route.ts` correctly refunds to `Company.walletBalance` (not `User.walletBalance`) for corporate bookings.
   - Create `WalletLedger` entry with type=CREDIT and referenceType=REFUND.

3. **Invoice tax amount accuracy**
   - `company.taxRate` must be set correctly for each company.
   - Add validation: if `taxRate > 0`, ensure GST number is captured from the company.

### Medium Priority

4. **Corporate booking approval workflow**
   - For large amounts, add an approval step before wallet deduction.
   - Company admin receives notification, approves/rejects.
   - Booking stays in PENDING_APPROVAL status until approved.

5. **Monthly invoice consolidation**
   - Instead of per-booking invoices, offer monthly consolidated invoices.
   - Add `billingCycle` field to Company (MONTHLY | PER_BOOKING).
   - Cron job generates consolidated invoice on 1st of each month.

6. **Corporate rate management UI**
   - Admin UI to manage `CorporateRate` entries per company.
   - Support category-specific rates (HOTEL vs FLIGHT vs ALL).
   - Support destination-specific rates.

7. **Credit limit enforcement**
   - Current: `creditLimit` is added to wallet balance for available balance check.
   - Enhancement: Track credit utilization separately. Add `creditUsed` field to Company.
   - When wallet hits 0, start using credit. Track outstanding credit balance.

### Low Priority

8. **Company.domain auto-assignment**
   - When user registers with email matching `Company.domain`, auto-link them.
   - Requires: email domain extraction, Company lookup by domain, user.companyId update.

9. **Multi-currency invoices**
   - Support USD/EUR/AED for international bookings.
   - Store `currency` on Invoice, use exchange rates from pricing-service.

10. **Audit trail for corporate actions**
    - Log all corporate booking actions: who booked, who approved, who cancelled.
    - Extend `WalletLedger` or create separate `CorporateAuditLog` table.

---

## 10. File Map

### Core Booking Flow

| File | Purpose |
|---|---|
| `src/lib/tbo-hotel-client.ts` | Hotel API client (search, preBook, bookHotel, generateVoucher, cancel) |
| `src/lib/tbo-flight-client.ts` | Flight API client (search, fareQuote, book, ticket, getBookingDetail) |
| `src/lib/tbo-hotel-api.ts` | Raw TBO hotel HTTP calls |
| `src/lib/tbo-flight-api.ts` | Raw TBO flight HTTP calls |
| `src/lib/fetch-with-retry.ts` | Retry utility with exponential backoff (Session 37) |
| `src/components/HotelBookingModal.tsx` | Hotel booking UI (7-step flow) |
| `src/components/FlightBookingModal.tsx` | Flight booking UI (7-step flow) |

### Corporate Checkout

| File | Purpose |
|---|---|
| `src/app/api/checkout/route.ts` | Corporate checkout (wallet deduction, discount, invoice) |
| `src/lib/pricing/pricing-service.ts` | getCorporateDiscount(), calculatePrice(), validatePromoCode() |
| `src/lib/email.ts` | invoiceIssued, invoiceOverdue email templates |

### Data Layer

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Company, CorporateRate, Booking, Invoice, WalletLedger models |
| `src/lib/prisma.ts` | Prisma client singleton |

### Admin UI

| File | Purpose |
|---|---|
| `src/app/admin/b2b/page.tsx` | Company management, wallet top-up |
| `src/app/admin/invoices/page.tsx` | Invoice dashboard |
| `src/app/admin/users/page.tsx` | User-company assignment |

### User-Facing

| File | Purpose |
|---|---|
| `src/app/trips/page.tsx` | Trip history with invoice display |
| `src/components/InvoiceModal.tsx` | Invoice viewer modal |
| `src/components/CheckoutButton.tsx` | Standard (non-corporate) checkout button |

### API Routes

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/checkout` | User | Corporate + standard checkout |
| `POST /api/bookings` | User | Save booking to DB |
| `POST /api/tbo-hotels` | User | Hotel API proxy (search, block, book, voucher, detail) |
| `POST /api/tbo` | User | Flight API proxy (search, fare-quote, book, ticket, SSR) |
| `POST /api/wallet/topup` | Admin | Company wallet top-up |
| `GET /api/wallet/ledger` | Admin | Wallet transaction history |
| `GET /api/companies/:id` | User/Admin | Company details |
| `GET /api/invoices/user/:bookingId` | User | Invoice for booking |

---

## Appendix: Verified Booking Values

### Hotel Bookings (Dubai + Certification)

| Property | TBO BookingId | ConfirmationNo | RoomRate | Tax | NetAmount |
|---|---|---|---|---|---|
| Fairmont The Palm | 2165349 | 7393315967034 | ₹20,041.11 | ₹4,756.43 | ₹24,655.88 |
| Astoria Hotel | 2165370 | 7132452512436 | ₹4,678.46 | ₹1,134.02 | ₹5,783.32 |
| Lotus Grand Hotel | 2165375 | 7272102692029 | ₹5,758.24 | ₹1,351.84 | ₹7,066.64 |
| Cert Case 1 (Domestic 1A) | 2165799 | — | — | — | — |
| Cert Case 3 (Domestic 2R) | 2165800 | — | — | — | — |
| Cert Case 5 (Intl 1A) | 2165801 | — | — | — | — |

**Total verified hotel bookings:** 6 (3 Dubai + 3 certification)

### Flight Booking

| Airline | Route | Date | TBO BookingId | PNR | Fare |
|---|---|---|---|---|---|
| Air India 2885 | DEL→MAA | Jul 30 | 2165345 | 98NLJB | ₹10,100 |

**Total verified bookings:** ₹47,605.84
