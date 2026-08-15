import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  SchadeautoZoekerAdapter,
  SCHADEAUTO_ZOEKER_SELECTORS,
} from "@/lib/scraper/schadeauto-zoeker.adapter";
import type { RawListing } from "@/lib/scraper/types";

const PAGE_URL =
  "https://www.schadeauto-zoeker.nl/en/search/damaged/passenger-cars/1/1/0/0/0/0/1/0?p=1925-2026";

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, "fixtures", name),
    "utf8"
  );
}

class TestSchadeautoZoekerAdapter extends SchadeautoZoekerAdapter {
  parseFixture(html: string, url: string): RawListing[] {
    return (
      this as unknown as {
        parseListings: (
          html: string,
          selectors: typeof SCHADEAUTO_ZOEKER_SELECTORS,
          url: string
        ) => RawListing[];
      }
    ).parseListings(html, SCHADEAUTO_ZOEKER_SELECTORS, url);
  }

  nextPageUrl(url: string): string | null {
    return this.buildNextPageUrl(url);
  }
}

describe("SchadeautoZoekerAdapter", () => {
  it("parses the object3 card grid into listings without network", () => {
    const adapter = new TestSchadeautoZoekerAdapter({
      sourceId: "test-schadeauto-zoeker",
    });
    const listings = adapter.parseFixture(
      loadFixture("schadeauto-zoeker.html"),
      PAGE_URL
    );

    expect(listings).toHaveLength(12);

    const first = listings[0];
    expect(first.title).toBe("Audi SQ5");
    expect(first.price).toBe(56500);
    expect(first.year).toBe(2026);
    expect(first.canonicalUrl).toBe(
      "https://www.schadeauto-zoeker.nl/en/damaged/passenger-cars/Audi+SQ5+3-0-270-Kw-Sportback-Nieuwste-model/o/1797337"
    );
    expect(first.canonicalUrl).toContain("/o/1797337");
    expect(first.imageUrl).toContain("/cache/picture/");
    expect(first.mileage).toBeUndefined();
    expect(first.externalId.startsWith("test-schadeauto-zoeker_")).toBe(true);

    const peugeot = listings[1];
    expect(peugeot.title).toBe("Peugeot 308");
    expect(peugeot.price).toBe(20750);
    expect(peugeot.canonicalUrl).toContain("/o/1797385");

    expect(first.externalId).not.toBe(peugeot.externalId);
  });

  it("uses the p.merk + p.type fallback when title markup is missing", () => {
    const adapter = new TestSchadeautoZoekerAdapter({
      sourceId: "test-schadeauto-zoeker",
    });
    const html = `<div class="container3objecten">
      <div class="object3">
        <div class="foto">
          <a href="/en/damaged/passenger-cars/Ford+Fiesta/o/1111">
            <img src="/cache/picture/1/1111/x.jpg" alt="damaged Ford Fiesta 2020"/>
          </a>
          <div class="boxBottom"><p>&#8364; 9.000</p></div>
        </div>
        <p class="merk">Ford&nbsp;</p>
        <p class="type"> Fiesta&nbsp; </p>
        <p>
          <span class="fltlt"><span class="label">ERD: </span> 2020</span>
        </p>
      </div>
    </div>`;

    const listings = adapter.parseFixture(html, PAGE_URL);

    expect(listings).toHaveLength(1);
    expect(listings[0].title).toBe("Ford Fiesta");
    expect(listings[0].price).toBe(9000);
    expect(listings[0].year).toBe(2020);
  });

  it("falls back to the image alt for the title when merk/type are missing", () => {
    const adapter = new TestSchadeautoZoekerAdapter({
      sourceId: "test-schadeauto-zoeker",
    });
    const html = `<div class="object3">
      <div class="foto">
        <a href="/en/damaged/passenger-cars/VW+Golf/o/2222">
          <img src="/cache/picture/2/2222/y.jpg" alt="damaged VW Golf 2019"/>
        </a>
        <div class="boxBottom"><p>&#8364; 8.500</p></div>
      </div>
    </div>`;

    const listings = adapter.parseFixture(html, PAGE_URL);

    expect(listings).toHaveLength(1);
    expect(listings[0].title).toBe("damaged VW Golf 2019");
  });

  it("builds the next page URL by incrementing the last path segment", () => {
    const adapter = new TestSchadeautoZoekerAdapter({
      sourceId: "test-schadeauto-zoeker",
    });
    const next = adapter.nextPageUrl(PAGE_URL);

    expect(next).toBe(
      "https://www.schadeauto-zoeker.nl/en/search/damaged/passenger-cars/1/1/0/0/0/0/1/1?p=1925-2026"
    );

    const next2 = adapter.nextPageUrl(next as string);
    expect(next2).toContain("/1/1/0/0/0/0/1/2");
    expect(next2).toContain("p=1925-2026");
  });
});
