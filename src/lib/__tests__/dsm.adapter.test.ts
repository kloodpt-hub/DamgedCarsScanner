import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { DsmAdapter } from "@/lib/scraper/dsm.adapter";
import type { RawListing } from "@/lib/scraper/types";

const USED_URL = "https://www.dsmbelgium.com/Vehicles/Used";
const DAMAGED_URL = "https://www.dsmbelgium.com/Vehicles/Damaged";

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, "fixtures", name),
    "utf8"
  );
}

class TestDsmAdapter extends DsmAdapter {
  parseFixture(html: string, url: string): RawListing[] {
    return (
      this as unknown as {
        parseListings: (html: string, url: string) => RawListing[];
      }
    ).parseListings(html, url);
  }
}

describe("DsmAdapter", () => {
  it("parses the used vehicles grid into listings without network", () => {
    const adapter = new TestDsmAdapter({ sourceId: "test-dsm" });
    const listings = adapter.parseFixture(
      loadFixture("dsmbelgium-used.html"),
      USED_URL
    );

    expect(listings).toHaveLength(27);

    const audi = listings[0];
    expect(audi.title).toBe("Audi A1");
    expect(audi.price).toBe(19500);
    expect(audi.year).toBe(2023);
    expect(audi.mileage).toBe(40100);
    expect(audi.canonicalUrl).toBe(
      "https://www.dsmbelgium.com/Vehicles/Details?VehicleId=18751"
    );
    expect(audi.imageUrl).toBe(
      "https://www.dsmbelgium.com/Picture/Show/360x226/18751/1"
    );
    expect(audi.isSold).toBe(false);
    expect(audi.externalId.startsWith("test-dsm_")).toBe(true);
  });

  it("parses the damaged vehicles grid and flags sold listings", () => {
    const adapter = new TestDsmAdapter({ sourceId: "test-dsm" });
    const listings = adapter.parseFixture(
      loadFixture("dsmbelgium-damaged.html"),
      DAMAGED_URL
    );

    expect(listings).toHaveLength(100);

    const sold = listings.filter((l) => l.isSold);
    const available = listings.filter((l) => !l.isSold);
    expect(sold.length).toBe(62);
    expect(available.length).toBe(38);

    const soldListing = listings[0];
    expect(soldListing.title).toBe("Audi A1");
    expect(soldListing.isSold).toBe(true);
    expect(soldListing.price).toBeUndefined();

    const availableListing = available.find((l) => l.title === "Audi A3");
    expect(availableListing).toBeDefined();
    expect(availableListing!.price).toBe(13500);
    expect(availableListing!.year).toBe(2024);
    expect(availableListing!.mileage).toBe(57461);
    expect(availableListing!.canonicalUrl).toBe(
      "https://www.dsmbelgium.com/Vehicles/Details?VehicleId=18913"
    );
  });
});
