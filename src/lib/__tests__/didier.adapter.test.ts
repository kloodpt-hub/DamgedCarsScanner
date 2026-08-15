import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { DidierAdapter, DIDIER_SELECTORS } from "@/lib/scraper/didier.adapter";
import type { RawListing } from "@/lib/scraper/types";

const PAGE_URL = "https://www.cars2repair.be/en/store/buy-damaged-salvage-cars";

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, "fixtures", name),
    "utf8"
  );
}

class TestDidierAdapter extends DidierAdapter {
  parseFixture(html: string, url: string): RawListing[] {
    return this.extractListings(cheerio.load(html), DIDIER_SELECTORS, url);
  }

  nextPageUrl(html: string, url: string): string | null {
    return this.extractNextPageUrl(
      cheerio.load(html),
      DIDIER_SELECTORS,
      url
    );
  }
}

describe("DidierAdapter", () => {
  it("parses the category products card grid into listings without network", () => {
    const adapter = new TestDidierAdapter({ sourceId: "test-didier" });
    const listings = adapter.parseFixture(
      loadFixture("cars2repair.html"),
      PAGE_URL
    );

    expect(listings).toHaveLength(20);

    const tesla = listings[0];
    expect(tesla.title).toBe("TESLA Model 3");
    expect(tesla.price).toBe(6600);
    expect(tesla.year).toBe(2022);
    expect(tesla.mileage).toBe(66178);
    expect(tesla.imageUrl).toBe(
      "https://www.cars2repair.be/files/Product/overview/didier_756741.jpg"
    );
    expect(tesla.images).toEqual([
      "https://www.cars2repair.be/files/Product/overview/didier_756741.jpg",
    ]);
    expect(tesla.canonicalUrl).toBe(
      "https://www.cars2repair.be/en/store/buy-damaged-salvage-cars/tesla-model-3-dd60766"
    );
    expect(tesla.canonicalUrl).toContain("-dd60766");
    expect(tesla.externalId.startsWith("test-didier_")).toBe(true);

    const skoda = listings[1];
    expect(skoda.title).toBe("SKODA Karoq");
    expect(skoda.price).toBe(6500);
    expect(skoda.year).toBe(2019);
    expect(skoda.mileage).toBe(58925);
    expect(skoda.imageUrl).toBe(
      "https://www.cars2repair.be/files/Product/overview/didier_756766.jpg"
    );
    expect(skoda.canonicalUrl).toContain("-dd62773");

    expect(tesla.externalId).not.toBe(skoda.externalId);
  });

  it("parses the page 2 fixture with 20 more listings", () => {
    const adapter = new TestDidierAdapter({ sourceId: "test-didier" });
    const listings = adapter.parseFixture(
      loadFixture("cars2repair-p2.html"),
      `${PAGE_URL}?page=2`
    );

    expect(listings).toHaveLength(20);
    expect(listings[0].canonicalUrl).toContain("cars2repair.be");
  });

  it("derives the next page URL from the pages_list next link", () => {
    const adapter = new TestDidierAdapter({ sourceId: "test-didier" });
    const next = adapter.nextPageUrl(
      loadFixture("cars2repair.html"),
      PAGE_URL
    );

    expect(next).toBe(`${PAGE_URL}?page=2`);

    const nextFromP2 = adapter.nextPageUrl(
      loadFixture("cars2repair-p2.html"),
      `${PAGE_URL}?page=2`
    );
    expect(nextFromP2).toBe(`${PAGE_URL}?page=3`);
  });
});
