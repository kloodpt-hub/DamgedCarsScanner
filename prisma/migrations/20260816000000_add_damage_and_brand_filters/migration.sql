-- AlterTable
ALTER TABLE "Filter" ADD COLUMN "excludeHeavyDamage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Filter" ADD COLUMN "brands" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "make" TEXT;
ALTER TABLE "Listing" ADD COLUMN "model" TEXT;

-- Backfill make from title (first word before first space or hyphen)
UPDATE "Listing" SET "make" = INITCAP(SPLIT_PART("title", ' ', 1)) WHERE "make" IS NULL AND "title" IS NOT NULL;
