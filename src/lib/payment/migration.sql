-- GoRASA Payment Gateway Migration
-- Run against Supabase PostgreSQL database

-- 1. Enhance Payment table
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gateway" TEXT NOT NULL DEFAULT 'razorpay';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "signature" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMPTZ;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundAmount" DOUBLE PRECISION;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- 2. Enhance Booking table
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMPTZ;
