-- AlterTable
ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN "telegramConvDraft" JSONB,
ADD COLUMN "telegramConvStep" TEXT,
ADD COLUMN "telegramPaused" BOOLEAN NOT NULL DEFAULT false;
