-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "aiAssessment" JSONB;

-- AlterTable
ALTER TABLE "Filter" ADD COLUMN "maxDamageLevel" TEXT NOT NULL DEFAULT 'total_loss';
