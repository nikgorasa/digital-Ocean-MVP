# GoRASA Payment Gateway Module — Integration Instructions

## Module Structure

```
src/lib/payment/
├── index.ts                          # exports
├── types.ts                          # interfaces
├── config.ts                         # mock toggle + gateway config
├── razorpay-client.ts                # Razorpay (mock + real)
├── phonepe-client.ts                 # PhonePe (mock + real)
├── payment-service.ts                # core orchestration
├── mock-handler.ts                   # mock simulation
├── migration.sql                     # SQL
├── README.md                         # quick reference
├── INTEGRATION.md                    # this file
├── api/
│   ├── checkout/route.ts             # POST /api/checkout
│   ├── webhooks/
│   │   ├── razorpay/route.ts         # POST /api/webhooks/razorpay
│   │   └── phonepe/route.ts          # POST /api/webhooks/phonepe
│   └── payment-status/[id]/route.ts  # GET /api/payment-status/:id
├── components/
│   ├── CheckoutButton.tsx            # reusable pay button
│   └── PaymentStatusPage.tsx         # post-payment status
└── admin/
    └── payments-page.tsx             # admin payments table
```

---

## Phase 1: Database Migration

Run `src/lib/payment/migration.sql` in Supabase SQL Editor.

This adds to `Payment`: `gateway`, `orderId`, `paymentId`, `signature`, `failureReason`, `refundedAt`, `refundAmount`, `metadata`.

This adds to `Booking`: `paymentStatus`, `confirmedAt`.

---

## Phase 2: Prisma Schema Update

### Enhance Payment model:

```prisma
model Payment {
  id              String    @id @default(cuid())
  bookingId       String    @unique
  booking         Booking   @relation(fields: [bookingId], references: [id])
  amount          Float
  method          String
  status          String    @default("PENDING")
  gateway         String    @default("razorpay")
  orderId         String?
  paymentId       String?
  signature       String?
  phonepeId       String?
  failureReason   String?
  refundedAt      DateTime?
  refundAmount    Float?
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Add to Booking model:

```prisma
model Booking {
  ...existing fields...
  paymentStatus   String    @default("PENDING")
  confirmedAt     DateTime?
}
```

Then run: `npx prisma generate`

---

## Phase 3: Copy API Routes

```bash
# Checkout
mkdir -p src/app/api/checkout
cp src/lib/payment/api/checkout/route.ts src/app/api/checkout/route.ts

# Webhooks
mkdir -p src/app/api/webhooks/razorpay src/app/api/webhooks/phonepe
cp src/lib/payment/api/webhooks/razorpay/route.ts src/app/api/webhooks/razorpay/route.ts
cp src/lib/payment/api/webhooks/phonepe/route.ts src/app/api/webhooks/phonepe/route.ts

# Payment status
mkdir -p "src/app/api/payment-status/[id]"
cp "src/lib/payment/api/payment-status/[id]/route.ts" "src/app/api/payment-status/[id]/route.ts"
```

Fix imports in copied files — change relative imports to `@/lib/payment`:

```typescript
// In src/app/api/checkout/route.ts:
import { createCheckout } from "@/lib/payment";
import { PAYMENT_CONFIG } from "@/lib/payment";

// In src/app/api/webhooks/razorpay/route.ts:
import { handleRazorpayWebhook, PAYMENT_CONFIG } from "@/lib/payment";

// In src/app/api/webhooks/phonepe/route.ts:
import { handlePhonePeWebhook } from "@/lib/payment";

// In src/app/api/payment-status/[id]/route.ts:
import { getPaymentStatus } from "@/lib/payment";
```

---

## Phase 4: Copy Frontend Components

```bash
cp src/lib/payment/components/CheckoutButton.tsx src/components/
cp src/lib/payment/components/PaymentStatusPage.tsx src/components/
```

---

## Phase 5: Create Payment Success Page

Create `src/app/payment/success/page.tsx`:

```tsx
"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PaymentStatusPage from "@/components/PaymentStatusPage";
import { PAYMENT_CONFIG } from "@/lib/payment";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const orderId = searchParams.get("order_id") || "";
  const isMock = searchParams.get("mock") === "true";

  // In mock mode, auto-confirm by calling webhook
  useEffect(() => {
    if (isMock && orderId) {
      fetch("/api/webhooks/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Razorpay-Signature": "mock" },
        body: JSON.stringify({
          event: "payment.captured",
          payload: {
            payment: { entity: { id: `mock_pay_${Date.now()}`, order_id: orderId, amount: 0, status: "captured", method: "upi" } },
            order: { entity: { id: orderId, amount: 0, receipt: bookingId } },
          },
        }),
      }).catch(console.error);
    }
  }, [isMock, orderId, bookingId]);

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Invalid payment session.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <PaymentStatusPage bookingId={bookingId} orderId={orderId} />
      </div>
    </div>
  );
}
```

Also create `src/app/payment/success/layout.tsx`:

```tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

---

## Phase 6: Modify Booking Modals

### HotelBookingModal.tsx

Add import:
```typescript
import CheckoutButton from "@/components/CheckoutButton";
```

Add payment state:
```typescript
const [bookingId, setBookingId] = useState<string | null>(null);
```

After the "saving" step creates the booking successfully (~line 167), set the booking ID and change step to "payment":

```typescript
// AFTER the saveRes fetch, BEFORE setConfirmation:
const savedBooking = await saveRes.json();
setBookingId(savedBooking.id);
setStep("payment");
return;  // Don't set "done" yet
```

Add payment step UI (between "saving" and "done" states):

```tsx
{step === "payment" && bookingId && (
  <div className="p-6 space-y-4">
    <div className="text-center">
      <h3 className="font-bold text-slate-900 mb-1">Complete Payment</h3>
      <p className="text-sm text-slate-500">Your room is reserved. Pay now to confirm.</p>
    </div>
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">Amount to Pay</span>
        <span className="font-black font-mono text-lg text-emerald-700">{formatCurrency(room.totalFare)}</span>
      </div>
    </div>
    <CheckoutButton
      bookingId={bookingId}
      amount={room.totalFare}
      userEmail={user.email}
      onPaymentError={(err) => { setErrorMessage(err); setStep("error"); }}
    />
    <button
      onClick={() => setStep("form")}
      className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
    >
      Cancel and go back
    </button>
  </div>
)}
```

Update the BookingStep type:
```typescript
type BookingStep = "form" | "blocking" | "book-confirming" | "saving" | "payment" | "done" | "error";
```

### FlightBookingModal.tsx

Same pattern — add CheckoutButton after "saving" step.

---

## Phase 7: Add Environment Variables

Add to `.env.local`:

```env
# Payment module
PAYMENT_MOCK=true
PAYMENT_GATEWAY=razorpay
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Only when PAYMENT_MOCK=false:
# RAZORPAY_KEY_ID=rzp_test_xxxxx
# RAZORPAY_KEY_SECRET=xxxxx
# RAZORPAY_WEBHOOK_SECRET=xxxxx
```

---

## Phase 8: Admin Payments Page (Optional)

Copy admin page and add navigation:

```bash
mkdir -p src/app/admin/payments
cp src/lib/payment/admin/payments-page.tsx src/app/admin/payments/page.tsx
```

Note: The admin page fetches from `/api/payments` which doesn't exist yet. You'll need to create a simple GET route that lists all payments, or adapt it to use the Supabase client directly.

---

## Phase 9: Update Booking API

**File:** `src/app/api/bookings/route.ts`

In the POST handler, after creating the booking, set initial paymentStatus:

```typescript
const { data: booking, error } = await supabase
  .from("Booking")
  .insert({
    // ...existing fields...
    paymentStatus: "PENDING",  // ADD THIS
  })
```

---

## Verification Checklist

| # | Check | How |
|---|-------|-----|
| 1 | TypeScript clean | `npx tsc --noEmit` |
| 2 | Migration ran | Supabase: Payment has new columns, Booking has paymentStatus |
| 3 | Checkout flow | POST /api/checkout → returns checkoutUrl |
| 4 | Mock success | Redirect to /payment/success?bookingId=xxx&mock=true → auto-confirms |
| 5 | Payment status | GET /api/payment-status/:id → returns COMPLETED |
| 6 | Booking updated | Booking.paymentStatus = COMPLETED, status = CONFIRMED |
| 7 | Hotel modal | Book hotel → see "Pay Now" button → redirect → confirmed |
| 8 | Flight modal | Same flow for flights |
| 9 | Webhook (real) | Set PAYMENT_MOCK=false → complete Razorpay test payment → webhook fires |

---

## Architecture Summary

```
Booking Modal                    Payment Service                  Gateway
     │                                │                              │
     │── POST /api/checkout ─────────>│                              │
     │                                │── Create Payment (PENDING)   │
     │                                │── createOrder() ────────────>│
     │                                │<── checkoutUrl ──────────────│
     │<── { checkoutUrl } ────────────│                              │
     │                                │                              │
     │── redirect ─────────────────────────────────────────────────>│
     │                                │                              │
     │                          [user pays on gateway]              │
     │                                │                              │
     │                                │<── webhook POST ─────────────│
     │                                │── Verify signature           │
     │                                │── Update Payment (COMPLETED) │
     │                                │── Update Booking (CONFIRMED) │
     │                                │                              │
     │── GET /api/payment-status ────>│                              │
     │<── { status: "COMPLETED" } ────│                              │
```
