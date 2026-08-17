import type { Listing, Filter } from "@prisma/client";
import type { AiAssessment } from "@/lib/ai/assessor";
import { isHeavyDamage, getEffectiveAssessment, isDamageAcceptable } from "@/lib/damage-detector";

export function evaluateListing(listing: Listing, filters: Filter[]): Filter[] {
  return filters.filter((filter) => {
    if (!hasActiveConstraints(filter)) return false;

    if (filter.sourceIds && filter.sourceIds.length > 0) {
      if (listing.sourceId == null || !filter.sourceIds.includes(listing.sourceId))
        return false;
    }

    if (!matchYear(listing.year, filter.minYear, filter.maxYear)) return false;
    if (!matchPriceByType(listing, filter)) return false;
    if (!matchMileage(listing.mileage, filter.minMileage, filter.maxMileage)) return false;
    if (!matchDamage(listing.damageStatus, filter.damageStatus)) return false;
    if (!matchKeywords(listing.title, listing.description, filter.excludedKeywords)) return false;
    if (filter.excludeHeavyDamage) {
      if (isHeavyDamage(listing.title, listing.description, listing.damageStatus)) return false;
    }
    if (filter.maxDamageLevel && filter.maxDamageLevel !== "total_loss" && filter.maxDamageLevel !== "none") {
      const assessment = getEffectiveAssessment(listing);
      if (assessment && !isDamageAcceptable(assessment.damageLevel, filter.maxDamageLevel)) {
        return false;
      }
    }
    if (filter.brands && filter.brands.length > 0) {
      if (!listing.make) return false;
      const listingMake = listing.make.toLowerCase().trim();
      if (!filter.brands.some((b) => b.toLowerCase().trim() === listingMake)) return false;
    }
    return true;
  });
}

function matchPriceByType(listing: Listing, filter: Filter): boolean {
  const hasFilter = filter.minPrice != null || filter.maxPrice != null;
  if (!hasFilter) return true;

  const priceType = filter.priceType ?? "any";
  let effectivePrice: number | null;

  if (priceType === "gross") {
    effectivePrice = listing.grossPrice ?? listing.price;
  } else if (priceType === "net") {
    effectivePrice = listing.netPrice ?? listing.price;
  } else {
    effectivePrice = listing.price;
  }

  if (effectivePrice == null) return false;
  if (filter.minPrice != null && effectivePrice < filter.minPrice) return false;
  if (filter.maxPrice != null && effectivePrice > filter.maxPrice) return false;
  return true;
}

function hasActiveConstraints(filter: Filter): boolean {
  const hasYear = filter.minYear != null || filter.maxYear != null;
  const hasPrice = filter.minPrice != null || filter.maxPrice != null;
  const hasMileage = filter.minMileage != null || filter.maxMileage != null;
  const hasDamage = !!filter.damageStatus && filter.damageStatus !== "";
  const hasKeywords = filter.excludedKeywords && filter.excludedKeywords.length > 0;
  const hasSources = filter.sourceIds && filter.sourceIds.length > 0;
  const hasHeavyDamage = !!filter.excludeHeavyDamage;
  const hasMaxDamageLevel = !!filter.maxDamageLevel && filter.maxDamageLevel !== "total_loss" && filter.maxDamageLevel !== "none";
  const hasBrands = filter.brands && filter.brands.length > 0;
  return hasYear || hasPrice || hasMileage || hasDamage || hasKeywords || hasSources || hasHeavyDamage || hasMaxDamageLevel || hasBrands;
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

function matchDamage(
  listingDamage: string | null | undefined,
  filterDamage: string | null | undefined
): boolean {
  if (!filterDamage) return true;
  if (!listingDamage) return false;

  const l = listingDamage.toLowerCase().trim();
  const f = filterDamage.toLowerCase().trim();

  if (f === "no damage") return l === "no damage";
  if (f === "total loss") return l === "total loss";
  if (f === "damage") return l === "damage";

  return l === f;
}

export function matchKeywords(
  title: string,
  description: string | null | undefined,
  excludedKeywords: string[]
): boolean {
  if (!excludedKeywords || excludedKeywords.length === 0) return true;
  const text = `${title} ${description ?? ""}`.toLowerCase();
  return !excludedKeywords.some((kw) => {
    const trimmed = kw.trim().toLowerCase();
    if (!trimmed) return false;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });
}
