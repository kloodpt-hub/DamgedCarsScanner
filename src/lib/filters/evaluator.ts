import type { Listing, Filter } from "@prisma/client";

export function evaluateListing(listing: Listing, filters: Filter[]): Filter[] {
  return filters.filter((filter) => {
    if (!hasActiveConstraints(filter)) return false;
    if (!matchYear(listing.year, filter.minYear, filter.maxYear)) return false;
    if (!matchPrice(listing.price, filter.minPrice, filter.maxPrice)) return false;
    if (!matchMileage(listing.mileage, filter.minMileage, filter.maxMileage)) return false;
    if (!matchDamage(listing.damageStatus, filter.damageStatus)) return false;
    if (!matchKeywords(listing.title, filter.excludedKeywords)) return false;
    return true;
  });
}

function hasActiveConstraints(filter: Filter): boolean {
  const hasYear = (filter.minYear != null && filter.minYear !== 0) || (filter.maxYear != null && filter.maxYear !== 0);
  const hasPrice = (filter.minPrice != null && filter.minPrice !== 0) || (filter.maxPrice != null && filter.maxPrice !== 0);
  const hasMileage = (filter.minMileage != null && filter.minMileage !== 0) || (filter.maxMileage != null && filter.maxMileage !== 0);
  const hasDamage = !!filter.damageStatus;
  const hasKeywords = filter.excludedKeywords && filter.excludedKeywords.length > 0;
  return hasYear || hasPrice || hasMileage || hasDamage || hasKeywords;
}

export function matchYear(
  listingYear: number | null,
  minYear?: number | null,
  maxYear?: number | null
): boolean {
  const hasFilter = (minYear != null && minYear !== 0) || (maxYear != null && maxYear !== 0);
  if (!hasFilter) return true;
  if (listingYear == null) return false;
  if (minYear != null && minYear !== 0 && listingYear < minYear) return false;
  if (maxYear != null && maxYear !== 0 && listingYear > maxYear) return false;
  return true;
}

export function matchPrice(
  listingPrice: number | null,
  minPrice?: number | null,
  maxPrice?: number | null
): boolean {
  const hasFilter = (minPrice != null && minPrice !== 0) || (maxPrice != null && maxPrice !== 0);
  if (!hasFilter) return true;
  if (listingPrice == null) return false;
  if (minPrice != null && minPrice !== 0 && listingPrice < minPrice) return false;
  if (maxPrice != null && maxPrice !== 0 && listingPrice > maxPrice) return false;
  return true;
}

export function matchMileage(
  listingMileage: number | null,
  minMileage?: number | null,
  maxMileage?: number | null
): boolean {
  const hasFilter = (minMileage != null && minMileage !== 0) || (maxMileage != null && maxMileage !== 0);
  if (!hasFilter) return true;
  if (listingMileage == null) return false;
  if (minMileage != null && minMileage !== 0 && listingMileage < minMileage) return false;
  if (maxMileage != null && maxMileage !== 0 && listingMileage > maxMileage) return false;
  return true;
}

export function matchDamage(
  listingDamage: string | null,
  filterDamage?: string | null
): boolean {
  if (!filterDamage) return true;
  if (!listingDamage) return false;
  return listingDamage.toLowerCase().includes(filterDamage.toLowerCase());
}

export function matchKeywords(title: string, excludedKeywords: string[]): boolean {
  if (!excludedKeywords || excludedKeywords.length === 0) return true;
  const lowerTitle = title.toLowerCase();
  return !excludedKeywords.some((kw) => lowerTitle.includes(kw.toLowerCase()));
}
