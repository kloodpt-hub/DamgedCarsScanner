import type { Listing, Filter } from "@prisma/client";

export function evaluateListing(listing: Listing, filters: Filter[]): Filter[] {
  return filters.filter((filter) => {
    if (!matchYear(listing.year, filter.minYear, filter.maxYear)) return false;
    if (!matchPrice(listing.price, filter.minPrice, filter.maxPrice)) return false;
    if (!matchMileage(listing.mileage, filter.minMileage, filter.maxMileage)) return false;
    if (!matchDamage(listing.damageStatus, filter.damageStatus)) return false;
    if (!matchKeywords(listing.title, filter.excludedKeywords)) return false;
    return true;
  });
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
  if (!listingDamage) return true;
  return listingDamage.toLowerCase().includes(filterDamage.toLowerCase());
}

export function matchKeywords(title: string, excludedKeywords: string[]): boolean {
  if (!excludedKeywords || excludedKeywords.length === 0) return true;
  const lowerTitle = title.toLowerCase();
  return !excludedKeywords.some((kw) => lowerTitle.includes(kw.toLowerCase()));
}
