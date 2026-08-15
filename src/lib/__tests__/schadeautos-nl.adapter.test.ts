import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import {
  SchadeautosNlAdapter,
  SCHADEAUTOS_NL_SELECTORS,
} from "@/lib/scraper/schadeautos-nl.adapter";
import type { RawListing } from "@/lib/scraper/types";

const PAGE_URL =
  "https://www.schadeautos.nl/en/search/damaged/passenger-cars/1/1/0/0/0/0/1/0";
const PAGE_URL_P2 =
  "https://www.schadeautos.nl/en/search/damaged/passenger-cars/1/1/0/0/0/0/1/1";

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, "fixtures", name),
    "utf8"
  );
}

class TestSchadeautosNlAdapter extends SchadeautosNlAdapter {
  parseFixture(html: string, url: string): RawListing[] {
    return this.extractListings(cheerio.load(html), SCHADEAUTOS_NL_SELECTORS, url);
  }

  nextPageUrl(html: string, url: string): string | null {
    return this.extractNextPageUrl(
      cheerio.load(html),
      SCHADEAUTOS_NL_SELECTORS,
      url
    );
  }
}

describe("SchadeautosNlAdapter", () => {
  it("parses the flexitem car grid into listings without network", () => {
    const adapter = new TestSchadeautosNlAdapter({
      sourceId: "test-schadeautos-nl",
    });
    const listings = adapter.parseFixture(
      loadFixture("schadeautos.html"),
      PAGE_URL
    );

    expect(listings).toHaveLength(12);

    const first = listings[0];
    expect(first.title).toBe("Audi SQ5");
    expect(first.price).toBe(56500);
    expect(first.year).toBe(2026);
    expect(first.mileage).toBe(12000);
    expect(first.canonicalUrl).toBe(
      "https://www.schadeautos.nl/en/damaged/passenger-cars/audi-sq5-3-0-270-kw-sportback-nieuwste-model/o/1797337"
    );
    expect(first.canonicalUrl).toContain("/o/1797337");
    expect(first.imageUrl).toContain("/cache/picture/");
    expect(first.description).toBe("3.0 - 270 Kw Sportback   Nieuwste model");
    expect(first.externalId.startsWith("test-schadeautos-nl_")).toBe(true);

    const peugeot = listings[1];
    expect(peugeot.title).toBe("Peugeot 308");
    expect(peugeot.price).toBe(20750);
    expect(peugeot.mileage).toBe(632);

    expect(first.externalId).not.toBe(peugeot.externalId);
  });

  it("parses the page 2 fixture with 12 more listings", () => {
    const adapter = new TestSchadeautosNlAdapter({
      sourceId: "test-schadeautos-nl",
    });
    const listings = adapter.parseFixture(
      loadFixture("schadeautos-p2.html"),
      PAGE_URL_P2
    );

    expect(listings).toHaveLength(12);

    const corsa = listings[0];
    expect(corsa.title).toBe("Opel Corsa");
    expect(corsa.price).toBe(3250);
    expect(corsa.year).toBe(2017);
    expect(corsa.mileage).toBe(125585);
    expect(corsa.canonicalUrl).toContain("/o/1797369");
    expect(corsa.canonicalUrl).toContain("schadeautos.nl");
  });

  it("derives the next page URL from the rel=next head link", () => {
    const adapter = new TestSchadeautosNlAdapter({
      sourceId: "test-schadeautos-nl",
    });
    const next = adapter.nextPageUrl(loadFixture("schadeautos.html"), PAGE_URL);

    expect(next).toBe(PAGE_URL_P2);
  });
});
