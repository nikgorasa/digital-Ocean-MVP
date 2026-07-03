# Corporate Booking Flow — Requirements

**Version:** 1.0
**Date:** 2026-07-03
**Status:** Draft

---

## 1. Business Context

GoRASA has two corporate accounts. Corporate users get:
- **Discounts** via CorporateRate rules (already implemented)
- **Credit-based payment** — no payment gateway, company settles in 45 days
- **Direct TBO voucher generation** — booking confirmed instantly

The current checkout flow sends ALL users to Razorpay/PhonePe. Corporate users must bypass this entirely.

---

## 2. Current State

| Feature | Status |
|---|---|
| Company model with walletBalance | ✅ Exists |
| CorporateRate discount rules | ✅ Exists |
| User.companyId linkage | ✅ Exists |
| Wallet deduction during checkout | ❌ Not implemented |
| Invoice generation | ❌ Not implemented |
| Corporate checkout bypass (no payment gateway) | ❌ Not implemented |
| Admin user-to-company assignment | ✅ Exists (admin/users page) |
| Companies API auth | ❌ No auth (security gap) |

---

## 3. User Stories

### 3.1 Corporate User Books a Hotel

**As a** corporate user mapped to a company,
**I want to** book a hotel without entering payment details,
**So that** my company settles the bill and I get my corporate discount applied automatically.

**Flow:**
1. Corporate user searches hotels (same as regular user)
2. Selects a hotel, enters passenger details
3. At checkout step, system detects user has `companyId`
4. System applies CorporateRate discount automatically
5. Instead of payment gateway, system calls TBO `bookHotel()` → `generateVoucher()` directly
6. Booking status goes directly to `CONFIRMED` (no `PENDING` → payment → `CONFIRMED`)
7. Invoice is generated and queued for company settlement
8. User sees confirmation with booking details

### 3.2 Admin Assigns User to Company

**As an** admin,
**I want to** assign a user to a corporate entity,
**So that** they get corporate rates and credit payment.

**Flow:**
1. Admin goes to `/admin/users`
2. Edits a user, selects a company from dropdown
3. Optionally changes role to `CORPORATE_USER`
4. User now has `companyId` set — all future bookings use corporate flow

### 3.3 Admin Tops Up Company Wallet

**As an** admin,
**I want to** add credit to a company's wallet,
**So that** the company has balance for employee bookings.

**Flow:**
1. Admin goes to `/admin/b2b`
2. Selects a company
3. Enters top-up amount
4. Company `walletBalance` increases
5. (Optional) Send notification to company admin

### 3.4 Company Settles Invoice (45-day terms)

**As an** admin,
**I want to** mark invoices as settled when the company pays,
**So that** accounting is accurate.

**Flow:**
1. Admin goes to `/admin/invoices` (new page)
2. Sees list of pending invoices with company name, amount, booking ref, age
3. Marks invoice as `PAID` or `OVERDUE`
4. System tracks settlement status

---

## 4. Data Model Changes

### 4.1 New Model: `Invoice`

```prisma
model Invoice {
  id              String   @id @default(cuid())
  companyId       String
  bookingId       String   @unique
  amount          Float
  taxAmount       Float    @default(0)
  totalAmount     Float
  status          String   @default("PENDING")  // PENDING, PAID, OVERDUE, CANCELLED
  dueDate         DateTime // booking date + 45 days
  paidAt          DateTime?
  paidAmount      Float?
  paymentRef      String?  // company's payment reference
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  company         Company  @relation(fields: [companyId], references: [id])
  booking         Booking  @relation(fields: [bookingId], references: [id])
}
```

### 4.2 New Model: `WalletLedger`

```prisma
model WalletLedger {
  id              String   @id @default(cuid())
  companyId       String
  type            String   // TOPUP, DEDUCTION, REFUND, ADJUSTMENT
  amount          Float    // positive for credit, negative for debit
  balanceAfter    Float    // snapshot of wallet balance after transaction
  referenceType   String?  // "BOOKING", "INVOICE", "ADMIN"
  referenceId     String?  // booking ID, invoice ID, etc.
  description     String?
  performedBy     String?  // admin user ID or "SYSTEM"
  createdAt       DateTime @default(now())
  company         Company  @relation(fields: [companyId], references: [id])
}
```

### 4.3 Schema Changes to Existing Models

**Booking:**
```prisma
model Booking {
  // ... existing fields ...
  paymentMethod   String?  // "gateway", "corporate_wallet", "mixed"
  companyId       String?  // denormalized from user.companyId for invoice lookup
  corporateDiscount Float  @default(0)  // discount applied from CorporateRate
}
```

**Company:**
```prisma
model Company {
  // ... existing fields ...
  creditLimit     Float    @default(0)  // max credit allowed
  invoices        Invoice[]
  walletLedger    WalletLedger[]
}
```

**Payment:**
```prisma
model Payment {
  // ... existing fields ...
  // method can be "corporate_wallet" for credit bookings
}
```

---

## 5. API Changes

### 5.1 Modified: `POST /api/checkout`

**Current:** Creates Razorpay/PhonePe order, returns checkoutUrl.

**New behavior:**
```
IF user.companyId is set AND company.walletBalance >= booking.price:
  → Deduct from company wallet
  → Create Payment record with method="corporate_wallet", status="COMPLETED"
  → Update Booking: status="CONFIRMED", paymentStatus="COMPLETED"
  → Generate invoice (dueDate = now + 45 days)
  → Return { success: true, bookingId, paymentMethod: "corporate_wallet" }

ELSE IF user.companyId is set AND company.walletBalance < booking.price:
  → Return { error: "Insufficient company credit", shortfall: amount }

ELSE (regular user):
  → Existing Razorpay/PhonePe flow
```

### 5.2 New: `GET /api/invoices`

- Admin: list all invoices with company name, booking ref, status, amount
- Corporate user: list their company's invoices

### 5.3 New: `PATCH /api/invoices/[id]`

- Admin: mark invoice as PAID, update paymentRef, paidAmount

### 5.4 New: `GET /api/wallet/ledger`

- Admin: list wallet transactions for a company
- Corporate user: list their company's wallet transactions

### 5.5 Fixed: `GET/POST/PATCH/DELETE /api/companies`

- Add `requireAdmin()` auth guard (currently missing)

### 5.6 New: `GET /api/users/[id]/company`

- Return user's company details with wallet balance and corporate rates

---

## 6. UI Changes

### 6.1 Checkout Flow (HotelBookingModal, FlightBookingModal)

**Current:** Always shows payment gateway selection at checkout step.

**New:**
```
IF user has companyId:
  → Show "Corporate Booking" summary instead of payment gateway
  → Display: Company name, Corporate discount applied, Amount charged to company
  → Button: "Confirm Booking" (no payment entry)
  → On confirm: call /api/checkout → corporate wallet deduction → TBO book → done

ELSE:
  → Existing payment gateway flow
```

### 6.2 New Page: `/admin/invoices`

- Table: Invoice ID, Company, Booking Ref, Amount, Due Date, Status, Age
- **Date range picker** — custom start/end date filter (not just preset ranges)
- Filters: status (PENDING/PAID/OVERDUE), company, booking type (HOTEL/FLIGHT)
- Quick filters: This Week, This Month, Last 30 Days, Last 90 Days, Custom Range
- Actions: Mark as Paid, Add notes, Export CSV, Print invoice
- Stats cards (filtered by date range): Total invoiced, Total collected, Outstanding, Overdue, Avg days to pay
- Group by: Company, Status, Month
- Column sorting and pagination

### 6.3 Modified: `/admin/b2b`

- Add wallet transaction history tab
- Show credit limit setting
- Show pending invoices count and overdue amount per company

### 6.4 Modified: `/admin/users`

- Company dropdown to assign/unassign users
- Show corporate discount preview when company is selected

### 6.5 Modified: `/trips` (My Trips)

- Corporate bookings show "Charged to [Company Name]" instead of "Payment pending"
- Invoice download link for corporate bookings

---

## 7. Business Rules

| Rule | Detail |
|---|---|
| Corporate detection | `user.companyId !== null` |
| Discount priority | CorporateRate > PromoCode (corporate discount applied first, then promo) |
| Wallet deduction | Atomic — deduct and create ledger entry in same transaction |
| Insufficient credit | Block booking if `company.walletBalance < booking.price` |
| Invoice due date | `booking.bookedAt + 45 days` |
| Invoice currency | INR (same as booking) |
| Cancellation refund | Goes back to company wallet (not to user) |
| Credit limit | Optional per-company cap (default 0 = unlimited) |
| Audit trail | Every wallet change creates a WalletLedger entry |
| Admin override | SUPER_ADMIN can manually adjust wallet balance with reason |

---

## 8. Implementation Phases

### Phase 1: Data Model + Wallet System (DB changes)
- Add Invoice, WalletLedger models
- Add fields to Booking, Company, Payment
- Migrate DEV + PROD databases
- Fix companies API auth

### Phase 2: Corporate Checkout Flow
- Modify `/api/checkout` for corporate wallet deduction
- Wire TBO bookHotel/generateVoucher for corporate bookings
- Create invoice on corporate booking
- Update HotelBookingModal and FlightBookingModal for corporate UI

### Phase 3: Admin UI
- Build `/admin/invoices` page
- Update `/admin/b2b` with wallet history and credit limit
- Update `/admin/users` with company assignment flow

### Phase 4: User UI + Invoicing
- Update `/trips` for corporate booking display
- Invoice PDF generation
- Email invoice to company admin

---

## 9. Open Questions

1. **Tax handling:** Should invoices include GST? If so, what's the company's GST number?
2. **Partial payments:** Can a company pay part of an invoice? Or is it all-or-nothing?
3. **Credit limit enforcement:** Should we block bookings when credit limit is reached, or just warn?
4. **Invoice number format:** Sequential (INV-001, INV-002) or booking-based?
5. **Multi-entity:** Can a user belong to multiple companies? (Current model: one companyId)
6. **TBO voucher flow:** Does `generateVoucher()` need to be called separately after `bookHotel()`, or is it automatic?

---

## 10. Security Considerations

| Gap | Fix |
|---|---|
| Companies API has no auth | Add `requireAdmin()` to all companies routes |
| Wallet balance modifiable by anyone | Only SUPER_ADMIN can adjust wallet directly |
| Invoice status modifiable by anyone | Only ADMIN+ can mark invoices as paid |
| Corporate rate bypass | Verify user.companyId matches CorporateRate.companyId at checkout |
| Wallet race condition | Use database transaction for deduction + ledger |
