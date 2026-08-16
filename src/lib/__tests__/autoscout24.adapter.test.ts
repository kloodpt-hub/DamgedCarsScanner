import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { Autoscout24Adapter } from "@/lib/scraper/autoscout24.adapter";
import type { RawListing } from "@/lib/scraper/types";

const SOURCE_URL = "https://www.autoscout24.com/lst/damaged";

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

class TestAutoscout24Adapter extends Autoscout24Adapter {
  parseFixture(html: string, url: string): RawListing[] {
    return (
      this as unknown as {
        parseListings: (html: string, url: string) => RawListing[];
      }
    ).parseListings(html, url);
  }
}

describe("Autoscout24Adapter", () => {
  it("parses the damaged vehicles grid into listings without network", () => {
    const adapter = new TestAutoscout24Adapter({
      sourceId: "test-autoscout24",
    });
    const listings = adapter.parseFixture(
      loadFixture("autoscout24-damaged.html"),
      SOURCE_URL
    );

    expect(listings).toHaveLength(4);

    const first = listings[0];
    expect(first.title).toBe("Ford Fiesta");
    expect(first.price).toBe(800);
    expect(first.mileage).toBe(227000);
    expect(first.year).toBe(2014);
    expect(first.imageUrl).toMatch(
      /^https:\/\/prod\.pictures\.autoscout24\.net\/listing-images\/8a719cb1/
    );
    expect(first.canonicalUrl).toBe(
      "https://www.autoscout24.com/offers/8a719cb1-1b6f-46a6-a3dd-3d4c5a70ccc8"
    );
    expect(first.isSold).toBe(false);
    expect(first.externalId.startsWith("test-autoscout24_")).toBe(true);
  });

  it("falls back to make + model when the title block is missing", () => {
    const adapter = new TestAutoscout24Adapter({
      sourceId: "test-autoscout24",
    });
    const html = `<article data-testid="list-item" data-guid="synthetic-guid-1" data-price="1500" data-mileage="120000" data-make="audi" data-model="a4" data-first-registration="01-2015"><div class="DeclutteredListItemDefaultView_title__T5asr"></div></article>`;
    const listings = adapter.parseFixture(html, SOURCE_URL);

    expect(listings).toHaveLength(1);
    expect(listings[0].title).toBe("audi a4");
    expect(listings[0].price).toBe(1500);
    expect(listings[0].mileage).toBe(120000);
    expect(listings[0].year).toBe(2015);
  });

  it("normalizes a missing price to 0", () => {
    const adapter = new TestAutoscout24Adapter({
      sourceId: "test-autoscout24",
    });
    const html = `<article data-testid="list-item" data-guid="synthetic-guid-2" data-mileage="100000" data-make="ford" data-model="fiesta" data-first-registration="03-2014"><div class="ListItemTitle_title__sLi_x">Ford Fiesta</div></article>`;
    const listings = adapter.parseFixture(html, SOURCE_URL);

    expect(listings).toHaveLength(1);
    expect(listings[0].price).toBe(0);
    expect(listings[0].mileage).toBe(100000);
  });

  it("leaves the year undefined when first registration is unparseable", () => {
    const adapter = new TestAutoscout24Adapter({
      sourceId: "test-autoscout24",
    });
    const html = `<article data-testid="list-item" data-guid="synthetic-guid-3" data-price="2000" data-make="ford" data-model="fiesta" data-first-registration="unknown"><div class="ListItemTitle_title__sLi_x">Ford Fiesta</div></article>`;
    const listings = adapter.parseFixture(html, SOURCE_URL);

    expect(listings).toHaveLength(1);
    expect(listings[0].year).toBeUndefined();
  });

  it("generates unique external IDs across listings", () => {
    const adapter = new TestAutoscout24Adapter({
      sourceId: "test-autoscout24",
    });
    const listings = adapter.parseFixture(
      loadFixture("autoscout24-damaged.html"),
      SOURCE_URL
    );
    const ids = new Set(listings.map((l) => l.externalId));
    expect(ids.size).toBe(listings.length);
  });
});
