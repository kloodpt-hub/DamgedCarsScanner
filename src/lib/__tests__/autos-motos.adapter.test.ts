import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { AutosMotosAdapter } from "@/lib/scraper/autos-motos.adapter";
import type { RawListing } from "@/lib/scraper/types";

const INTERCARS_URL = "https://www.inter-cars.be/en";
const DECLERCK_URL = "https://declerckautohandel.be/en";

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, "fixtures", name),
    "utf8"
  );
}

class TestAutosMotosAdapter extends AutosMotosAdapter {
  parseFixture(html: string, url: string): RawListing[] {
    return (
      this as unknown as {
        parseListings: (html: string, url: string) => RawListing[];
      }
    ).parseListings(html, url);
  }

  loadCarsUrl(url: string): string {
    return this.buildLoadCarsUrl(url);
  }
}

describe("AutosMotosAdapter", () => {
  it("parses inter-cars cards into listings without network", () => {
    const adapter = new TestAutosMotosAdapter({
      sourceId: "test-autos-motos",
    });
    const listings = adapter.parseFixture(
      loadFixture("intercars-loadcars.html"),
      INTERCARS_URL
    );

    expect(listings).toHaveLength(8);

    const first = listings[0];
    expect(first.title).toBe("MINI ONE");
    expect(first.price).toBe(5950);
    expect(first.year).toBe(2019);
    expect(first.mileage).toBe(77833);
    expect(first.canonicalUrl).toBe(
      "https://www.inter-cars.be/vehicle/1785833332583579008"
    );
    expect(first.imageUrl).toContain("https://autos-motos.net/pictures/");
    expect(first.externalId.startsWith("test-autos-motos_")).toBe(true);

    const dacia = listings[5];
    expect(dacia.title).toBe("DACIA SANDERO III EXPRESSION");
    expect(dacia.price).toBe(7300);
    expect(dacia.year).toBe(2023);
    expect(dacia.mileage).toBe(55613);

    expect(first.externalId).not.toBe(dacia.externalId);
  });

  it("parses declerck cards (malformed HTML, no price) into listings", () => {
    const adapter = new TestAutosMotosAdapter({
      sourceId: "test-autos-motos",
    });
    const listings = adapter.parseFixture(
      loadFixture("declerck-loadcars.html"),
      DECLERCK_URL
    );

    expect(listings).toHaveLength(6);

    const first = listings[0];
    expect(first.title).toContain("VOLKSWAGEN TRANSPORTER");
    expect(first.price).toBeUndefined();
    expect(first.year).toBe(2023);
    expect(first.mileage).toBe(65448);
    expect(first.canonicalUrl).toBe(
      "https://declerckautohandel.be/vehicle/17828308761573564642"
    );
    expect(first.imageUrl).toContain("https://autos-motos.net/pictures/");

    const nissan = listings[1];
    expect(nissan.title).toContain("NISSAN MICRA");
    expect(nissan.year).toBe(2020);
    expect(nissan.mileage).toBe(141450);
    expect(nissan.canonicalUrl).toBe(
      "https://declerckautohandel.be/vehicle/17624379841297794835"
    );

    expect(first.externalId).not.toBe(nissan.externalId);
  });

  it("derives the AJAX loadcars URL from the base URL origin and lang", () => {
    const adapter = new TestAutosMotosAdapter();
    expect(adapter.loadCarsUrl(INTERCARS_URL)).toBe(
      "https://www.inter-cars.be/assets/php/loadcars.php?lang=en&make=NEW&count=0"
    );
    expect(adapter.loadCarsUrl("https://declerckautohandel.be/nl")).toBe(
      "https://declerckautohandel.be/assets/php/loadcars.php?lang=nl&make=NEW&count=0"
    );
  });
});
