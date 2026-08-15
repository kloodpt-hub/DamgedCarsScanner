-- Final sold-car cleanup: remove all listings previously flagged as sold
DELETE FROM "Listing" WHERE "isSold" = true;
