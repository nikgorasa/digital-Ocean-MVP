-- Auto-cancel PENDING bookings after 24 hours
-- Run this in Supabase SQL Editor or as a migration

-- Add cancelledAt and cancellationReason columns to Booking table
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

-- Create pg_cron extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule auto-cancel job (runs every hour)
-- Note: pg_cron requires Supabase Pro plan or higher
-- If not available, use Supabase Edge Functions with scheduled triggers
SELECT cron.schedule('cleanup-pending-bookings', '0 * * * *', 
  $$UPDATE "Booking" 
    SET status = 'CANCELLED', 
        "cancelledAt" = NOW(), 
        "cancellationReason" = 'Payment timeout - auto-cancelled after 24 hours',
        "updatedAt" = NOW()
    WHERE status = 'PENDING' 
      AND "createdAt" < NOW() - INTERVAL '24 hours'$$
);

-- Create index for efficient querying of PENDING bookings
CREATE INDEX IF NOT EXISTS idx_booking_pending ON "Booking" (status, "createdAt") 
  WHERE status = 'PENDING';
