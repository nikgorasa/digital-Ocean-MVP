-- Add pay-later support columns to Booking table
-- Migration: 20260617_pay_later_support

-- Expiry tracking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMPTZ;

-- Price re-validation tracking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "validatedPrice" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "priceRevalidatedAt" TIMESTAMPTZ;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "priceChangeAmount" DOUBLE PRECISION;

-- Supplier reference
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "supplierBookingRef" TEXT;

-- Flexible metadata
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';

-- Index for expiry cron job
CREATE INDEX IF NOT EXISTS "idx_booking_pending_expiry" ON "Booking" ("status", "expiresAt")
  WHERE "status" = 'PENDING';

-- Backfill expiresAt for existing PENDING bookings (24h from creation)
UPDATE "Booking" SET "expiresAt" = "bookedAt" + INTERVAL '24 hours'
  WHERE "status" = 'PENDING' AND "expiresAt" IS NULL;
