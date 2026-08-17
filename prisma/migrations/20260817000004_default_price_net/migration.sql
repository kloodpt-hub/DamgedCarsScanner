-- Update existing filters that use "any" to "net" (new default)
UPDATE "Filter" SET "priceType" = 'net' WHERE "priceType" = 'any';
