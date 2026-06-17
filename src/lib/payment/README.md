# GoRASA Payment Gateway Module

Mock-first payment integration for Razorpay (primary) + PhonePe. Async webhook pattern for Vercel compatibility.

## How It Works

```
User clicks "Pay" → Booking created (PENDING) → Redirect to gateway → Webhook confirms → Booking CONFIRMED
```

**Mock mode (default):** All payments auto-succeed after redirect. No real gateway calls.
**Real mode:** Set `PAYMENT_MOCK=false` + add API keys.

## Quick Start

```bash
# 1. Run migration in Supabase SQL Editor
cat src/lib/payment/migration.sql | pbcopy   # paste into Supabase Dashboard

# 2. Update Prisma schema (see INTEGRATION.md)

# 3. Copy API routes
cp -r src/lib/payment/api/checkout src/app/api/
cp -r src/lib/payment/api/webhooks src/app/api/
cp -r "src/lib/payment/api/payment-status" src/app/api/

# 4. Copy components
cp src/lib/payment/components/CheckoutButton.tsx src/components/
cp src/lib/payment/components/PaymentStatusPage.tsx src/components/

# 5. Copy payment success page
mkdir -p src/app/payment/success
# (create page.tsx — see INTEGRATION.md)

# 6. Add env vars
echo "PAYMENT_MOCK=true" >> .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
```

## Files

| File | Purpose |
|------|---------|
| `config.ts` | Mock mode toggle + gateway config |
| `razorpay-client.ts` | Razorpay SDK (mock + real) |
| `phonepe-client.ts` | PhonePe API (mock + real) |
| `payment-service.ts` | Core: createCheckout, webhooks, status |
| `mock-handler.ts` | Mock payment simulation |
| `api/checkout/route.ts` | POST — create payment order |
| `api/webhooks/razorpay/route.ts` | POST — Razorpay webhook |
| `api/webhooks/phonepe/route.ts` | POST — PhonePe webhook |
| `api/payment-status/[id]/route.ts` | GET — poll payment status |
| `components/CheckoutButton.tsx` | Reusable pay button |
| `components/PaymentStatusPage.tsx` | Post-payment status display |
| `admin/payments-page.tsx` | Admin payments table |

## Environment Variables

```env
# Mock mode (default: true)
PAYMENT_MOCK=true
PAYMENT_GATEWAY=razorpay

# Only needed when PAYMENT_MOCK=false
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
PHONEPE_MERCHANT_ID=M1xxxxx
PHONEPE_SALT_KEY=xxxxx
PHONEPE_SALT_INDEX=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Usage

### Create checkout

```typescript
import { createCheckout } from "@/lib/payment";

const result = await createCheckout({
  bookingId: "booking-123",
  amount: 5750,
  gateway: "razorpay",
  userEmail: "user@example.com",
});

// result.checkoutUrl = "http://localhost:3000/payment/success?order_id=mock_order_xxx"
// result.orderId = "mock_order_xxx"
```

### Check status

```typescript
import { getPaymentStatus } from "@/lib/payment";

const status = await getPaymentStatus("booking-123");
// { status: "COMPLETED", amount: 5750, gateway: "razorpay" }
```

## Mock vs Real

| | Mock (`PAYMENT_MOCK=true`) | Real (`PAYMENT_MOCK=false`) |
|---|---|---|
| Create order | Returns fake URL instantly | Calls Razorpay/PhonePe API |
| Webhook | Auto-fires from success page | Sent by Razorpay/PhonePe servers |
| Signature | Always valid | Verified with HMAC |
| Refund | Fake refund ID | Real refund via API |

## Full Integration Guide

See [INTEGRATION.md](./INTEGRATION.md).
