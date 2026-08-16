-- Add 7 catalog scraper sources (data-only, no schema change).
-- These adapters are self-contained and ignore stored selectors, so selectors = '{}'.

INSERT INTO "ScraperSource" ("id", "name", "baseUrl", "adapterType", "selectors", "isActive", "scrapeIntervalMinutes", "createdAt", "updatedAt")
VALUES
  ('schadeauto-zoeker.nl', 'SchadeAuto-Zoeker.nl', 'https://www.schadeauto-zoeker.nl/en/search/damaged/passenger-cars/1/1/0/0/0/0/1/0?p=1925-2026', 'schadeauto-zoeker', '{}'::jsonb, true, 60, now(), now()),
  ('schadeautos.nl', 'Schadeautos.nl', 'https://www.schadeautos.nl/en/search/damaged/passenger-cars/1/1/0/0/0/0/1/0', 'schadeautos-nl', '{}'::jsonb, true, 60, now(), now()),
  ('declerckautohandel.be', 'Declerck Autohandel', 'https://www.declerckautohandel.be/en', 'autos-motos', '{}'::jsonb, true, 60, now(), now()),
  ('cars2repair.be', 'Didier (cars2repair)', 'https://www.cars2repair.be/en/store/buy-damaged-salvage-cars?page=1', 'didier', '{}'::jsonb, true, 60, now(), now()),
  ('inter-cars.be', 'Inter-Cars', 'https://www.inter-cars.be/', 'autos-motos', '{}'::jsonb, true, 60, now(), now()),
  ('dsmbelgium.com-used', 'DSM Belgium — Used', 'https://dsmbelgium.com/Vehicles/Used', 'dsm', '{}'::jsonb, true, 60, now(), now()),
  ('dsmbelgium.com-damaged', 'DSM Belgium — Damaged', 'https://dsmbelgium.com/Vehicles/Damaged', 'dsm', '{}'::jsonb, true, 60, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "baseUrl" = EXCLUDED."baseUrl",
  "adapterType" = EXCLUDED."adapterType",
  "selectors" = EXCLUDED."selectors",
  "isActive" = EXCLUDED."isActive",
  "scrapeIntervalMinutes" = EXCLUDED."scrapeIntervalMinutes",
  "updatedAt" = now();

-- Repoint the AutoScout24 seed source to a working damaged search URL (keep active).
UPDATE "ScraperSource" SET "baseUrl" = 'https://www.autoscout24.com/lst/damaged', "updatedAt" = now() WHERE "id" = 'seed-autoscout24';

-- Deactivate the unscrapeable LeBonCoin seed source.
UPDATE "ScraperSource" SET "isActive" = false, "updatedAt" = now() WHERE "id" = 'seed-leboncoin';
