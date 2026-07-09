# GoRASA Corporate Booking Flow — Complete Reference

> Single source of truth for the corporate (B2B) booking system.
> Covers wallet, discounts, checkout, invoices, cancellations, and admin UIs.
> **Last updated:** 2026-07-10

---

## Table of Contents

1. [Data Model](#1-data-model)
2. [User-to-Company Assignment](#2-user-to-company-assignment)
3. [Corporate Discounts](#3-corporate-discounts)
4. [Wallet System](#4-wallet-system)
5. [Checkout Flow](#5-checkout-flow)
6. [Invoice Generation](#6-invoice-generation)
7. [Cancellation & Refund](#7-cancellation--refund)
8. [Admin Interfaces](#8-admin-interfaces)
9. [User-Facing UI](#9-user-facing-ui)
10. [File Map](#10-file-map)
11. [Known Issues & Gaps](#11-known-issues--gaps)

---

## 1. Data Model

All models in `prisma/schema.prisma`:

### Company
```
id              String   @id @default(cuid())
name            String
domain          String?  // Used to auto-identify corporate users (currently unused)
walletBalance   Float    @default(0)
discountRate    Float    @default(0)
isActive        Boolean  @default(true)
createdAt       DateTime
updatedAt       DateTime
users           User[]
bookings        Booking[]
invoices        Invoice[]
walletLedger    WalletLedgerEntry[]
```

### User (relevant fields)
```
companyId       String?  // FK → Company
company         Company? @relation
role            String   // "CORPORATE_USER" or "CUSTOMER" or "ADMIN"
```

### Booking (relevant fields)
```
companyId         String?    // FK → Company
company           Company?   @relation
corporateDiscount Float      @default(0)
walletDeduction   Float      @default(0)
invoice           Invoice?
```

### Invoice
```
id          String   @id @default(cuid())
companyId   String
bookingId   String   @unique
number      String   @unique  // e.g. "INV-240701-0001"
amount      Float    // base price
taxAmount   Float    @default(0)
totalAmount Float
status      String   @default("PENDING")  // PENDING | PAID | OVERDUE | CANCELLED
dueDate     DateTime
paidAt      DateTime?
paidAmount  Float?
paymentRef  String?
notes       String?
url         String?
issuedAt    DateTime @default(now())
company     Company  @relation
booking     Booking  @relation
```

### WalletLedgerEntry
```
id          String   @id @default(cuid())
companyId   String
type        String   // CREDIT | DEBIT
amount      Float
balance     Float    // balance AFTER this entry
description String
reference   String?  // bookingId or "admin-topup"
createdAt   DateTime @default(now())
company     Company  @relation
```

---

## 2. User-to-Company Assignment

### How It Works

- Only users with role `CORPORATE_USER` can be linked to a company
- The `User.companyId` field is set via admin UI
- `Company.domain` exists in the schema but is **NOT** used for auto-assignment — only manual admin assignment

### Admin UI

- `src/app/admin/users/page.tsx` — Create/Edit user forms include a company dropdown
- `src/app/api/users/route.ts` — POST/PATCH validate: non-null companyId requires role= CORPORATE_USER
- `src/app/api/users/route.ts` — findAll() includes `company` relation for employee count display

### Role Validation (API)

In `src/app/api/users/route.ts`:
```
if (companyId && role !== "CORPORATE_USER") → 400 "Only corporate users can be linked to a company"
```

---

## 3. Corporate Discounts

### Configuration

Per-company discount rate stored in `Company.discountRate` (percentage).

### How Discounts Are Applied

During checkout (`src/app/api/checkout/route.ts`):
1. If the user has `companyId`, look up their company
2. If the company is `isActive`, apply `corporateDiscount = price × (discountRate / 100)`
3. Store `corporateDiscount` and `companyId` on the Booking record
4. The effective price after corporate discount is `price - corporateDiscount`

### UI Display

- `src/components/HotelBookingModal.tsx` — Shows "Corporate Discount" line item in pricing summary
- `src/app/trips/page.tsx` — Shows "Corporate Discount" on the trip card for corporate bookings

### Checkout Credit Limit Check

In checkout, after corporate discount, if remaining total exceeds company wallet balance:
→ Returns 400 "Insufficient wallet balance" (correct behavior)

---

## 4. Wallet System

### Top-Up (Admin)

Admin page: `src/app/admin/b2b/page.tsx`

The `handleTopUp` function calls `POST /api/wallet/topup` with `{ companyId, amount, description }`.

**Flow:**
1. Admin enters amount (quick amounts: ₹10K/25K/50K/1L or custom)
2. `POST /api/wallet/topup` creates a WalletLedgerEntry (type= CREDIT)
3. Updates Company.walletBalance
4. Returns new wallet balance

### Wallet Ledger

- `GET /api/wallet/ledger?companyId=xxx` returns all entries for audit trail
- Each entry has: type (CREDIT/DEBIT), amount, balance (post-entry), description, reference

### Wallet Deduction During Checkout

In checkout (`src/app/api/checkout/route.ts`):
1. After all discounts, check if booking total exceeds wallet balance → error
2. Deduct: `Company.walletBalance -= total`
3. Create WalletLedgerEntry (type= DEBIT, reference= bookingId)
4. Set `Booking.walletDeduction = total`

### API Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/companies` | Admin | List all companies |
| `GET /api/companies/:id` | Admin | Single company |
| `POST /api/companies` | Admin | Create company |
| `PATCH /api/companies/:id` | Admin | Update company (name, domain, discountRate) |
| `DELETE /api/companies/:id` | Admin | Delete company |
| `POST /api/wallet/topup` | Admin | Company wallet top-up |
| `GET /api/wallet/ledger` | Admin | Wallet ledger for a company |
| `GET /api/topup-amounts` | Public | Quick top-up amounts config |

---

## 5. Checkout Flow

### Corporate Checkout (`src/app/api/checkout/route.ts`)

1. User must be authenticated
2. Look up booking by bookingId
3. If user has `companyId`:
   a. Look up Company, verify `isActive`
   b. Calculate corporate discount
   c. Check wallet balance ≥ final total
   d. Deduct from wallet
   e. Create WalletLedgerEntry (DEBIT)
   f. Create Invoice record
4. Process standard payment (if non-corporate or partial)
5. Return success with booking + invoice data

### Invoice Creation in Checkout

When corporate checkout succeeds:
```
prisma.invoice.create({
  data: {
    companyId: user.companyId,
    bookingId: booking.id,
    number: "INV-" + ...,
    amount: basePrice,
    taxAmount: 0,  // default — can be updated via admin
    totalAmount: finalTotal,
    status: "PAID",
    dueDate: new Date(),
    paidAt: new Date(),
    paidAmount: finalTotal,
  }
})
```

---

## 6. Invoice Generation

### Invoice Number Format

`INV-YYMMDD-NNNN` — generated in checkout route:
```
const count = await prisma.invoice.count();
const invoiceNumber = `INV-${format(new Date(), "yyMMdd")}-${String(count + 1).padStart(4, "0")}`;
```

### Invoice Display (User-Facing)

- `src/components/InvoiceModal.tsx` — MODAL for viewing invoice from trips page
- Fetches real Invoice record from `GET /api/invoices/user/[bookingId]`
- If no Invoice exists, falls back to booking-derived display
- Shows: invoice number, company name, base price, tax amount, discounts, total, payment ref, status

### Invoice Display (Admin)

- `src/app/admin/invoices/page.tsx` — Full admin invoices dashboard
- Filters: date range, status, company
- Stats: total invoiced, collected, pending, overdue
- By-company breakdown
- Mark PENDING invoices as PAID
- Pagination

### Invoice API Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/invoices` | Admin | List invoices (filtered, paginated) |
| `GET /api/invoices/stats` | Admin | Invoice statistics |
| `PATCH /api/invoices/:id` | Admin | Update invoice (mark paid) |
| `GET /api/invoices/user/[bookingId]` | User (owner) | Get invoice for a specific booking |

---

## 7. Cancellation & Refund

### Corporate Cancellation (`src/app/api/cancellations/route.ts`)

When a corporate booking is cancelled:
1. Calculate refund amount based on cancellation policy
2. Add refund to Company.walletBalance
3. Create WalletLedgerEntry (CREDIT, reference= bookingId)
4. Create Invoice for the refund (or update status)
5. Mark booking as CANCELLED

### Trips Page Cancellation

- `src/app/trips/page.tsx` — Users can request cancellation
- If corporate booking: refund goes to company wallet (not user)
- Shows refund amount in cancellation confirmation

---

## 8. Admin Interfaces

### B2B Registry (`/admin/b2b`)

- `src/app/admin/b2b/page.tsx`
- List all corporate accounts
- Wallet top-up with quick amounts
- Create/edit/delete companies
- View employee count

### Invoices (`/admin/invoices`)

- `src/app/admin/invoices/page.tsx`
- Full invoice management with filters
- Stats dashboard
- Mark invoices as PAID

### Users (`/admin/users`)

- `src/app/admin/users/page.tsx`
- Create/edit users with company assignment
- Role validation (CORPORATE_USER only)

---

## 9. User-Facing UI

### Trips Page (`/trips`)

- `src/app/trips/page.tsx`
- Shows corporate discount on booking cards
- "Invoice" button opens InvoiceModal (fetches real Invoice from DB)
- Cancellation refunds go to company wallet

### Hotel Booking Modal

- `src/components/HotelBookingModal.tsx`
- Shows "Corporate Discount" in pricing summary when user is corporate
- Uses company discountRate from user.company relation
- Shows company name in the booking summary

---

## 10. File Map

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Company, Invoice, WalletLedgerEntry, User, Booking models |
| `src/lib/db/companies.ts` | Companies CRUD functions |
| `src/app/api/companies/route.ts` | Companies API (list, create) |
| `src/app/api/companies/[id]/route.ts` | Companies API (get, update, delete) |
| `src/app/api/wallet/topup/route.ts` | Wallet top-up |
| `src/app/api/wallet/ledger/route.ts` | Wallet ledger |
| `src/app/api/checkout/route.ts` | Checkout with corporate discount + wallet deduction + invoice creation |
| `src/app/api/cancellations/route.ts` | Cancellation with wallet refund |
| `src/app/api/invoices/route.ts` | Admin invoices list |
| `src/app/api/invoices/stats/route.ts` | Admin invoice stats |
| `src/app/api/invoices/[id]/route.ts` | Admin invoice update |
| `src/app/api/invoices/user/[bookingId]/route.ts` | User invoice fetch |
| `src/app/api/users/route.ts` | User CRUD with companyId validation |
| `src/app/api/topup-amounts/route.ts` | Quick top-up amounts config |
| `src/app/admin/b2b/page.tsx` | Admin B2B registry page |
| `src/app/admin/invoices/page.tsx` | Admin invoices dashboard |
| `src/app/admin/users/page.tsx` | Admin users with company assignment |
| `src/app/trips/page.tsx` | User trips with invoice display |
| `src/components/InvoiceModal.tsx` | Invoice modal (DB-backed) |
| `src/components/HotelBookingModal.tsx` | Hotel booking with corporate discount display |

---

## 11. Known Issues & Gaps

### Gaps (Unimplemented)

1. **Company.domain auto-assignment** — The `Company.domain` field exists but is never used to auto-assign users to companies. When a user registers with `@acme.com`, they should be automatically linked to the company whose domain is `acme.com`. Currently, admins must manually assign.

2. **Invoice.taxAmount always 0** — The checkout route creates invoices with `taxAmount: 0`. No tax calculation is implemented.

3. **Invoice.dueDate** — Set to `new Date()` on creation (PAID invoices). Not meaningful. Should be configurable per-company (e.g. "Net 30").

4. **No payment reference linking** — `Invoice.paymentRef` is set during creation but not linked to any external payment gateway reference for reconciliation.

5. **Corporate booking UI missing company name in HotelBookingModal** — The hotel booking modal shows discount but doesn't display the company name.

### Fixed

1. **B2B top-up used wrong endpoint** — `handleTopUp` was calling `PATCH /api/companies/{id}` with `walletBalance` which the PATCH handler ignores. Fixed: now calls `POST /api/wallet/topup` which creates a WalletLedgerEntry and properly updates balance.

2. **InvoiceModal not connected to DB** — Was displaying booking-derived data instead of the actual Invoice record. Fixed: now fetches from `GET /api/invoices/user/[bookingId]` and displays real Invoice data with fallback.
