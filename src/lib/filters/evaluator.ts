import type { Listing, Filter } from "@prisma/client";

export function evaluateListing(listing: Listing, filters: Filter[]): Filter[] {
  return filters.filter((filter) => {
    if (!hasActiveConstraints(filter)) return false;

    if (filter.sourceIds && filter.sourceIds.length > 0) {
      if (!filter.sourceIds.includes(listing.sourceId)) return false;
    }

    if (!matchYear(listing.year, filter.minYear, filter.maxYear)) return false;
    if (!matchPrice(listing.price, filter.minPrice, filter.maxPrice)) return false;
    if (!matchMileage(listing.mileage, filter.minMileage, filter.maxMileage)) return false;
    if (!matchDamage(listing.damageStatus, filter.damageStatus)) return false;
    if (!matchKeywords(`${listing.title} ${listing.description ?? ""}`, filter.excludedKeywords)) return false;
    return true;
  });
}

function hasActiveConstraints(filter: Filter): boolean {
  const hasYear = filter.minYear != null || filter.maxYear != null;
  const hasPrice = filter.minPrice != null || filter.maxPrice != null;
  const hasMileage = filter.minMileage != null || filter.maxMileage != null;
  const hasDamage = !!filter.damageStatus;
  const hasKeywords = filter.excludedKeywords && filter.excludedKeywords.length > 0;
  return hasYear || hasPrice || hasMileage || hasDamage || hasKeywords;
}

export function matchYear(
  listingYear: number | null,
  minYear?: number | null,
  maxYear?: number | null
): boolean {
  const hasFilter = minYear != null || maxYear != null;
  if (!hasFilter) return true;
  if (listingYear == null) return false;
  if (minYear != null && listingYear < minYear) return false;
  if (maxYear != null && listingYear > maxYear) return false;
  return true;
}

export function matchPrice(
  listingPrice: number | null,
  minPrice?: number | null,
  maxPrice?: number | null
): boolean {
  const hasFilter = minPrice != null || maxPrice != null;
  if (!hasFilter) return true;
  if (listingPrice == null) return false;
  if (minPrice != null && listingPrice < minPrice) return false;
  if (maxPrice != null && listingPrice > maxPrice) return false;
  return true;
}

export function matchMileage(
  listingMileage: number | null,
  minMileage?: number | null,
  maxMileage?: number | null
): boolean {
  const hasFilter = minMileage != null || maxMileage != null;
  if (!hasFilter) return true;
  if (listingMileage == null) return false;
  if (minMileage != null && listingMileage < minMileage) return false;
  if (maxMileage != null && listingMileage > maxMileage) return false;
  return true;
}

export function matchDamage(
  listingDamage: string | null,
  filterDamage?: string | null
): boolean {
  if (!filterDamage) return true;
  if (!listingDamage) return false;

  const listing = listingDamage.toLowerCase();
  const filter = filterDamage.toLowerCase();

  if (filter === "no damage") {
    return listing === "no damage" || listing.includes("unfallfrei") || listing.includes("non accident");
  }
  if (filter === "damage") {
    return listing.includes("damage") || listing.includes("accident") || listing.includes("unfall") || listing.includes("schade") || listing.includes("schaden");
  }
  if (filter === "total loss") {
    return listing.includes("total loss") || listing.includes("totaalverlies") || listing.includes("totalschaden") || listing.includes("write-off");
  }

  return listing.includes(filter);
}

export function matchKeywords(title: string, excludedKeywords: string[]): boolean {
  if (!excludedKeywords || excludedKeywords.length === 0) return true;
  const lowerTitle = title.toLowerCase();
  return !excludedKeywords.some((kw) => lowerTitle.includes(kw.toLowerCase()));
}
