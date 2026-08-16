import { describe, it, expect } from "vitest";
import type { Listing, Filter } from "@prisma/client";
import { evaluateListing, matchPrice } from "@/lib/filters/evaluator";

function makeListing(partial: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    externalId: "ext-1",
    title: "Test Listing",
    price: null,
    year: null,
    mileage: null,
    damageStatus: null,
    description: null,
    imageUrl: null,
    images: [],
    canonicalUrl: "https://example.com/car/1",
    sourceId: "src-a",
    make: null,
    model: null,
    isRead: false,
    isNotified: false,
    isSold: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Listing;
}

function makeFilter(partial: Partial<Filter> = {}): Filter {
  return {
    id: "filter-1",
    name: "Test Filter",
    userId: "user-1",
    minYear: null,
    maxYear: null,
    minPrice: null,
    maxPrice: null,
    damageStatus: null,
    excludedKeywords: [],
    sourceIds: [],
    minMileage: null,
    maxMileage: null,
    excludeHeavyDamage: false,
    brands: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Filter;
}

describe("evaluateListing", () => {
  it("does not match an empty filter (no active constraints)", () => {
    const filter = makeFilter();
    const result = evaluateListing(makeListing(), [filter]);
    expect(result).toEqual([]);
  });

  describe("price", () => {
    it("matches when price is within maxPrice", () => {
      const filter = makeFilter({ maxPrice: 10000 });
      const result = evaluateListing(makeListing({ price: 5000 }), [filter]);
      expect(result).toEqual([filter]);
    });

    it("does not match when price is below minPrice", () => {
      const filter = makeFilter({ minPrice: 6000 });
      const result = evaluateListing(makeListing({ price: 5000 }), [filter]);
      expect(result).toEqual([]);
    });
  });

  describe("year", () => {
    it("matches when year is within minYear", () => {
      const filter = makeFilter({ minYear: 2000 });
      const result = evaluateListing(makeListing({ year: 2018 }), [filter]);
      expect(result).toEqual([filter]);
    });

    it("does not match when year is below minYear", () => {
      const filter = makeFilter({ minYear: 2019 });
      const result = evaluateListing(makeListing({ year: 2018 }), [filter]);
      expect(result).toEqual([]);
    });
  });

  describe("sourceIds", () => {
    it("matches a listing from an allowed source", () => {
      const filter = makeFilter({ sourceIds: ["src-a"] });
      const result = evaluateListing(makeListing({ sourceId: "src-a" }), [
        filter,
      ]);
      expect(result).toEqual([filter]);
    });

    it("excludes a listing from a disallowed source", () => {
      const filter = makeFilter({ sourceIds: ["src-a"] });
      const result = evaluateListing(makeListing({ sourceId: "src-b" }), [
        filter,
      ]);
      expect(result).toEqual([]);
    });
  });

  describe("excludedKeywords", () => {
    it("excludes a listing whose title contains a keyword", () => {
      const filter = makeFilter({ excludedKeywords: ["bmw"] });
      const result = evaluateListing(makeListing({ title: "BMW 320d" }), [
        filter,
      ]);
      expect(result).toEqual([]);
    });

    it("matches when the excluded keyword is absent", () => {
      const filter = makeFilter({ excludedKeywords: ["bmw"] });
      const result = evaluateListing(makeListing({ title: "Audi A4" }), [
        filter,
      ]);
      expect(result).toEqual([filter]);
    });
  });

  describe("damageStatus", () => {
    it("matches when damage statuses are equal", () => {
      const filter = makeFilter({ damageStatus: "Total Loss" });
      const result = evaluateListing(
        makeListing({ damageStatus: "Total Loss" }),
        [filter]
      );
      expect(result).toEqual([filter]);
    });

    it("does not match when damage statuses differ", () => {
      const filter = makeFilter({ damageStatus: "Total Loss" });
      const result = evaluateListing(makeListing({ damageStatus: "Damage" }), [
        filter,
      ]);
      expect(result).toEqual([]);
    });
  });

  describe("keyword boundaries", () => {
    it("does not exclude when the keyword is a substring of another word", () => {
      const filter = makeFilter({ excludedKeywords: ["sold"] });
      const result = evaluateListing(makeListing({ title: "soldier" }), [
        filter,
      ]);
      expect(result).toEqual([filter]);
    });

    it("excludes when the keyword is a whole word", () => {
      const filter = makeFilter({ excludedKeywords: ["sold"] });
      const result = evaluateListing(
        makeListing({ title: "car sold cheap" }),
        [filter]
      );
      expect(result).toEqual([]);
    });
  });

  describe("excludeHeavyDamage", () => {
    it("excludes a listing with Total Loss damageStatus", () => {
      const filter = makeFilter({ excludeHeavyDamage: true });
      const result = evaluateListing(
        makeListing({ damageStatus: "Total Loss" }),
        [filter]
      );
      expect(result).toEqual([]);
    });

    it("excludes a listing with heavy damage keyword in title", () => {
      const filter = makeFilter({ excludeHeavyDamage: true });
      const result = evaluateListing(
        makeListing({ title: "BMW 320d wreck" }),
        [filter]
      );
      expect(result).toEqual([]);
    });

    it("excludes a listing with heavy damage keyword in description", () => {
      const filter = makeFilter({ excludeHeavyDamage: true });
      const result = evaluateListing(
        makeListing({ title: "BMW 320d", description: "fire damage" }),
        [filter]
      );
      expect(result).toEqual([]);
    });

    it("matches a normal listing when excludeHeavyDamage is true", () => {
      const filter = makeFilter({ excludeHeavyDamage: true });
      const result = evaluateListing(
        makeListing({ title: "BMW 320d", damageStatus: "Damage" }),
        [filter]
      );
      expect(result).toEqual([filter]);
    });

    it("does not filter when excludeHeavyDamage is false", () => {
      const filter = makeFilter({ excludeHeavyDamage: false, minYear: 2000 });
      const result = evaluateListing(
        makeListing({ damageStatus: "Total Loss", year: 2018 }),
        [filter]
      );
      expect(result).toEqual([filter]);
    });
  });

  describe("brands", () => {
    it("matches a listing whose make is in the filter brands", () => {
      const filter = makeFilter({ brands: ["BMW", "Audi"] });
      const result = evaluateListing(
        makeListing({ make: "BMW" }),
        [filter]
      );
      expect(result).toEqual([filter]);
    });

    it("matches case-insensitively", () => {
      const filter = makeFilter({ brands: ["bmw"] });
      const result = evaluateListing(
        makeListing({ make: "BMW" }),
        [filter]
      );
      expect(result).toEqual([filter]);
    });

    it("excludes a listing whose make is not in the filter brands", () => {
      const filter = makeFilter({ brands: ["BMW"] });
      const result = evaluateListing(
        makeListing({ make: "Audi" }),
        [filter]
      );
      expect(result).toEqual([]);
    });

    it("excludes a listing with null make when brands filter is active", () => {
      const filter = makeFilter({ brands: ["BMW"] });
      const result = evaluateListing(
        makeListing({ make: null }),
        [filter]
      );
      expect(result).toEqual([]);
    });

    it("does not filter when brands array is empty", () => {
      const filter = makeFilter({ brands: [], minYear: 2000 });
      const result = evaluateListing(
        makeListing({ make: "BMW", year: 2018 }),
        [filter]
      );
      expect(result).toEqual([filter]);
    });
  });
});

describe("matchPrice", () => {
  it("returns false for a null listing price with an active constraint", () => {
    expect(matchPrice(null, undefined, 10000)).toBe(false);
  });
});
