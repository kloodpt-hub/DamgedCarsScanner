-- Drop NOT NULL constraint on User.password to allow Google OAuth users
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Add scrape lock columns to ScraperSource
ALTER TABLE "ScraperSource" ADD COLUMN "isScraping" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScraperSource" ADD COLUMN "isScrapingLockedAt" TIMESTAMP(3);

-- Add isSold to Listing to persist sold listings (was filtered out before)
ALTER TABLE "Listing" ADD COLUMN "isSold" BOOLEAN NOT NULL DEFAULT false;

-- Add default to Filter.sourceIds (already added via 20260816000000 but ensure)
-- (no-op: column already exists with DEFAULT ARRAY[]::TEXT[])

-- Create UserListingRead join table (per-user read state, replaces global Listing.isRead)
CREATE TABLE "UserListingRead" (
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserListingRead_pkey" PRIMARY KEY ("userId", "listingId")
);

-- Add indexes for performance (fresh DB, plain CREATE INDEX is fine)
CREATE INDEX "Listing_sourceId_createdAt_idx" ON "Listing"("sourceId", "createdAt");
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");
CREATE INDEX "Listing_isNotified_idx" ON "Listing"("isNotified");
CREATE INDEX "Filter_userId_idx" ON "Filter"("userId");
CREATE INDEX "ScraperJob_sourceId_createdAt_idx" ON "ScraperJob"("sourceId", "createdAt");
CREATE INDEX "ScraperJob_userId_idx" ON "ScraperJob"("userId");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX "ScraperSource_isActive_idx" ON "ScraperSource"("isActive");
CREATE INDEX "UserListingRead_listingId_idx" ON "UserListingRead"("listingId");

-- Foreign keys for UserListingRead
ALTER TABLE "UserListingRead" ADD CONSTRAINT "UserListingRead_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserListingRead" ADD CONSTRAINT "UserListingRead_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
