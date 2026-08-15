import { describe, it, expect } from "vitest";
import { SITE_CATALOG } from "@/lib/scraper/catalog";

describe("SITE_CATALOG", () => {
  it("contains exactly the 7 known sites", () => {
    expect(SITE_CATALOG).toHaveLength(7);
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
    ]);
    for (const site of SITE_CATALOG) {
      expect(expected.has(site.adapterType)).toBe(true);
    }
  });

  it("uses a 60-minute default interval everywhere", () => {
    for (const site of SITE_CATALOG) {
      expect(site.defaultInterval).toBe(60);
    }
  });

  it("has non-empty descriptions", () => {
    for (const site of SITE_CATALOG) {
      expect(site.description.length).toBeGreaterThan(0);
    }
  });
});
