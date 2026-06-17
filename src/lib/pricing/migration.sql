-- GoRASA Pricing Module Migration
-- Run against Supabase PostgreSQL database
-- Date: 2026-06-12

-- ============================================================
-- 1. Enhance PricingRule table
-- ============================================================
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Unnamed Rule';
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'ALL';
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "airlineCode" TEXT;
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "roomType" TEXT;
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "markupType" TEXT NOT NULL DEFAULT 'PERCENT';
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "markupValue" DOUBLE PRECISION;
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "minPrice" DOUBLE PRECISION;
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "maxPrice" DOUBLE PRECISION;
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "validFrom" TIMESTAMPTZ;
ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "validTo" TIMESTAMPTZ;

-- Migrate existing markupPercent → markupValue
UPDATE "PricingRule" SET "markupValue" = "markupPercent" WHERE "markupValue" IS NULL;
ALTER TABLE "PricingRule" ALTER COLUMN "markupValue" SET NOT NULL;
ALTER TABLE "PricingRule" ALTER COLUMN "markupValue" SET DEFAULT 0;

-- ============================================================
-- 2. Enhance PromoCode table (Supabase public schema)
-- ============================================================
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "maxDiscount" DOUBLE PRECISION;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "maxUses" INTEGER;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "usedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "applicableTo" TEXT NOT NULL DEFAULT 'ALL';
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "isFirstBooking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "validFrom" TIMESTAMPTZ;
ALTER TABLE "PromoCode" ADD COLUMN IF NOT EXISTS "validTo" TIMESTAMPTZ;

-- ============================================================
-- 3. Create CorporateRate table
-- ============================================================
CREATE TABLE IF NOT EXISTS "CorporateRate" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  category TEXT NOT NULL DEFAULT 'ALL',
  destination TEXT,
  "discountType" TEXT NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  "maxDiscount" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Seed default pricing rules
-- ============================================================
INSERT INTO "PricingRule" (id, name, type, category, "markupType", "markupValue", priority, "isActive")
SELECT 'default-hotel-markup', 'Global Hotel Markup', 'GLOBAL', 'HOTEL', 'PERCENT', 15, 0, true
WHERE NOT EXISTS (SELECT 1 FROM "PricingRule" WHERE id = 'default-hotel-markup');

INSERT INTO "PricingRule" (id, name, type, category, "markupType", "markupValue", priority, "isActive")
SELECT 'default-flight-markup', 'Global Flight Markup', 'GLOBAL', 'FLIGHT', 'FLAT', 500, 0, true
WHERE NOT EXISTS (SELECT 1 FROM "PricingRule" WHERE id = 'default-flight-markup');

INSERT INTO "PricingRule" (id, name, type, category, "markupType", "markupValue", priority, "isActive")
SELECT 'default-package-markup', 'Global Package Markup', 'GLOBAL', 'PACKAGE', 'PERCENT', 20, 0, true
WHERE NOT EXISTS (SELECT 1 FROM "PricingRule" WHERE id = 'default-package-markup');

-- ============================================================
-- 5. Supabase RLS policies (if using RLS)
-- ============================================================
-- Uncomment if your tables use Row Level Security:
-- ALTER TABLE "PricingRule" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "CorporateRate" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role full access" ON "PricingRule" FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Service role full access" ON "CorporateRate" FOR ALL USING (true) WITH CHECK (true);
