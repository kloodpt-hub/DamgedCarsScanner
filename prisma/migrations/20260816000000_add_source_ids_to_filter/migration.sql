-- AlterTable
ALTER TABLE "Filter" ADD COLUMN "sourceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
