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
  if (listingYear == null) return true;
  if (minYear != null && listingYear < minYear) return false;
  if (maxYear != null && listingYear > maxYear) return false;
  return true;
}

export function matchPrice(
  listingPrice: number | null,
  minPrice?: number | null,
  maxPrice?: number | null
): boolean {
  if (listingPrice == null) return true;
  if (minPrice != null && listingPrice < minPrice) return false;
  if (maxPrice != null && listingPrice > maxPrice) return false;
  return true;
}

export function matchMileage(
  listingMileage: number | null,
  minMileage?: number | null,
  maxMileage?: number | null
): boolean {
  if (listingMileage == null) return true;
  if (minMileage != null && listingMileage < minMileage) return false;
  if (maxMileage != null && listingMileage > maxMileage) return false;
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
