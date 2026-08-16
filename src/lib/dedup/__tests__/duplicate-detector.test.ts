import { describe, it, expect } from "vitest";
import { normalizeTitle, titleSimilarity, isDuplicate } from "../duplicate-detector";
import type { Listing } from "@prisma/client";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "clx1",
    externalId: "ext-1",
    title: "BMW 320d 2018 120000km",
    price: 15000,
    year: 2018,
    mileage: 120000,
    damageStatus: null,
    description: null,
    imageUrl: null,
    images: [],
    canonicalUrl: "https://example.com/1",
    sourceId: "src-1",
    make: "BMW",
    model: "320d",
    isRead: false,
    isNotified: false,
    isSold: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Listing;
}

describe("normalizeTitle", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeTitle("Éléphant Rénault")).toContain("elephant");
    expect(normalizeTitle("Éléphant Rénault")).toContain("renault");
  });

  it("removes punctuation", () => {
    expect(normalizeTitle("BMW 320d! (diesel)")).toBe("320d bmw");
  });

  it("removes filler words", () => {
    const result = normalizeTitle("BMW 320d 120000 km diesel");
    expect(result).not.toContain("km");
    expect(result).not.toContain("diesel");
    expect(result).toContain("bmw");
    expect(result).toContain("320d");
    expect(result).toContain("120000");
  });

  it("sorts words alphabetically", () => {
    expect(normalizeTitle("Toyota Yaris 2015")).toBe("2015 toyota yaris");
  });
});

describe("titleSimilarity", () => {
  it("returns 1 for identical sets", () => {
    expect(titleSimilarity("bmw 320d", "bmw 320d")).toBe(1);
  });

  it("returns 0 for disjoint sets", () => {
    expect(titleSimilarity("audi a4", "toyota yaris")).toBe(0);
  });

  it("returns >0.8 for mostly overlapping sets", () => {
    const sim = titleSimilarity("bmw 320d diesel automatic turbo", "bmw 320d diesel automatic");
    expect(sim).toBeGreaterThanOrEqual(0.8);
  });
});

describe("isDuplicate", () => {
  it("returns true for matching listings", () => {
    const a = makeListing({ sourceId: "src-1" });
    const b = makeListing({ id: "clx2", externalId: "ext-2", sourceId: "src-2" });
    expect(isDuplicate(a, b)).toBe(true);
  });

  it("returns false for different years", () => {
    const a = makeListing({ year: 2018 });
    const b = makeListing({ id: "clx2", externalId: "ext-2", year: 2020 });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it("returns false when price differs by more than 20%", () => {
    const a = makeListing({ price: 10000 });
    const b = makeListing({ id: "clx2", externalId: "ext-2", price: 15000 });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it("returns true when price is within 20%", () => {
    const a = makeListing({ price: 10000 });
    const b = makeListing({ id: "clx2", externalId: "ext-2", price: 11000 });
    expect(isDuplicate(a, b)).toBe(true);
  });

  it("returns false when mileage differs by more than 10%", () => {
    const a = makeListing({ mileage: 100000 });
    const b = makeListing({ id: "clx2", externalId: "ext-2", mileage: 120000 });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it("returns true when mileage is within 10%", () => {
    const a = makeListing({ mileage: 100000 });
    const b = makeListing({ id: "clx2", externalId: "ext-2", mileage: 105000 });
    expect(isDuplicate(a, b)).toBe(true);
  });

  it("returns false when year is null", () => {
    const a = makeListing({ year: null });
    const b = makeListing({ id: "clx2", externalId: "ext-2", year: null });
    expect(isDuplicate(a, b)).toBe(false);
  });
});
