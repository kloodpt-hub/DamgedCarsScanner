-- Reset selectors to empty object for all sources
-- The production DB has incorrect selectors (e.g., a.schadeautos-card) that don't match
-- the actual HTML structure, causing adapters to find 0 listings.
-- Adapters have hardcoded default selectors that are used when selectors is {}.
UPDATE "ScraperSource" SET "selectors" = '{}';
