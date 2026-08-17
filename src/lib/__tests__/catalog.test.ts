import { describe, it, expect } from "vitest";
import { SITE_CATALOG } from "@/lib/scraper/catalog";

describe("SITE_CATALOG", () => {
  it("contains known sites", () => {
    expect(SITE_CATALOG.length).toBeGreaterThanOrEqual(26);
  });

  it("has unique ids and names", () => {
    const ids = SITE_CATALOG.map((s) => s.id);
    const names = SITE_CATALOG.map((s) => s.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("exposes valid base URLs", () => {
    for (const site of SITE_CATALOG) {
      expect(() => new URL(site.baseUrl)).not.toThrow();
    }
  });

  it("uses only registered adapter type keys", () => {
    const expected = new Set([
      "schadeauto-zoeker",
      "schadeautos-nl",
      "autos-motos",
      "didier",
      "dsm",
      "leboncoin",
      "autoscout24",
      "schadeautos",
      "debels",
      "generic",
      "kleinanzeigen",
      "marktplaats",
      "olx",
      "sprzedaz",
      "carito",
      "paruvendu",
      "jm-autos",
      "voiture-accidentee",
    ]);
    for (const site of SITE_CATALOG) {
      expect(expected.has(site.adapterType)).toBe(true);
    }
  });

  it("uses reasonable default intervals", () => {
    for (const site of SITE_CATALOG) {
      expect(site.defaultInterval).toBeGreaterThanOrEqual(30);
      expect(site.defaultInterval).toBeLessThanOrEqual(120);
    }
  });

  it("has non-empty descriptions", () => {
    for (const site of SITE_CATALOG) {
      expect(site.description.length).toBeGreaterThan(0);
    }
  });
});
