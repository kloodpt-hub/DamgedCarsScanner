-- AlterTable: Make sourceId nullable on Listing and ScraperJob
ALTER TABLE "Listing" ALTER COLUMN "sourceId" DROP NOT NULL;

ALTER TABLE "ScraperJob" ALTER COLUMN "sourceId" DROP NOT NULL;

-- AlterTable: Change foreign key constraints from CASCADE to SET NULL
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_sourceId_fkey",
    ADD CONSTRAINT "Listing_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ScraperSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScraperJob" DROP CONSTRAINT "ScraperJob_sourceId_fkey",
    ADD CONSTRAINT "ScraperJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ScraperSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
