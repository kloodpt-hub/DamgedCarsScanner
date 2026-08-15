import { describe, it, expect } from "vitest";
import { DebelsAdapter } from "@/lib/scraper/debels.adapter";
import type { RawListing } from "@/lib/scraper/types";

const PAGE_URL = "https://www.debels.com/autohandel-de-debels-damage-cars-promo";

const ALFA_CARD = `
  <div class='col-sm-12 col-md-12 col-lg-3 text-center rounded'>
    <div class='row'>
      <a rel='nofollow' href='/damage-salvage-cars/EN/1782968966656230795/ALFA-ROMEO/ALFA-159/2018'>
        <img class='img-fluid rounded border' alt='Damaged cars ALFA ROMEO 2018' src='https://www.autos-motos.net/pictures/BE425663516/173039/image-01-B~v1782968966.JPG'>
      </a>
    </div>
    <span class='carInfoBig text-center'>ALFA ROMEO 2018</span>
    <div class='col-12 text-center'>
      <span><strong>ALFA 159 </strong></span><br>
      <span><strong>L.P.G.,  - 181 Co&sup2;</strong></span><br>
      <span><strong>228.435 km, Gearbox (5)</strong></span>
    </div>
    <div class='col-12 carInfoPrice p-2 text-center'><div class='promo'>
      <span style='font-size:10pt;color:#fff'>PROMO</span><br>
      <span style='font-size:14pt;'>€ 750</span><br><span><i class='bi bi-telephone'></i> CALL US</span>
    </div></div>
  </div>`;

const AUDI_CARD = `
  <div class='col-sm-12 col-md-12 col-lg-3 text-center rounded'>
    <div class='row'>
      <a rel='nofollow' href='/damage-salvage-cars/EN/1782968966656230800/AUDI/A3/2019'>
        <img class='img-fluid rounded border' alt='Damaged cars AUDI 2019' src='https://www.autos-motos.net/pictures/BE425663517/173040/image-01-B~v1782968977.JPG'>
      </a>
    </div>
    <span class='carInfoBig text-center'>AUDI A3 2019</span>
    <div class='col-12 text-center'>
      <span><strong>A3 </strong></span><br>
      <span><strong>Diesel,  - 150 Co&sup2;</strong></span><br>
      <span><strong>45.000 km, Gearbox (6)</strong></span>
    </div>
    <div class='col-12 carInfoPrice p-2 text-center'><div class='promo'>
      <span style='font-size:10pt;color:#fff'>PROMO</span><br>
      <span style='font-size:14pt;'>€ 6.500</span><br><span><i class='bi bi-telephone'></i> CALL US</span>
    </div></div>
  </div>`;

const FIXTURE_HTML = `<div class='container'>${ALFA_CARD}${AUDI_CARD}</div>`;

describe("DebelsAdapter", () => {
  it("parses the promo card grid into listings without network", () => {
    const adapter = new DebelsAdapter({ sourceId: "test-debels" }) as unknown as {
      parseListings: (html: string, url: string) => RawListing[];
    };
    const listings = adapter.parseListings(FIXTURE_HTML, PAGE_URL);

    expect(listings).toHaveLength(2);

    const alfa = listings[0];
    expect(alfa.title).toContain("ALFA ROMEO");
    expect(alfa.title).toContain("ALFA 159");
    expect(alfa.price).toBe(750);
    expect(alfa.year).toBe(2018);
    expect(alfa.mileage).toBe(228435);
    expect(alfa.canonicalUrl).toContain("/damage-salvage-cars/");
    expect(alfa.canonicalUrl).toBe(
      "https://www.debels.com/damage-salvage-cars/EN/1782968966656230795/ALFA-ROMEO/ALFA-159/2018"
    );
    expect(alfa.isSold).toBe(false);
    expect(alfa.imageUrl).toContain("autos-motos.net");
    expect(alfa.externalId.startsWith("test-debels_")).toBe(true);

    const audi = listings[1];
    expect(audi.title).toContain("AUDI A3");
    expect(audi.title).toContain("A3");
    expect(audi.price).toBe(6500);
    expect(audi.year).toBe(2019);
    expect(audi.mileage).toBe(45000);

    expect(alfa.externalId).not.toBe(audi.externalId);
  });

  it("skips columns that are not damage car cards", () => {
    const decoyHtml = `
      <div class='col-lg-3 text-center'>
        <span class='carInfoBig text-center'>BANNER</span>
        <div class='col-12 text-center'><span><strong>Promo</strong></span></div>
      </div>`;

    const adapter = new DebelsAdapter({ sourceId: "test-debels" }) as unknown as {
      parseListings: (html: string, url: string) => RawListing[];
    };
    const listings = adapter.parseListings(`${decoyHtml}${ALFA_CARD}`, PAGE_URL);

    expect(listings).toHaveLength(1);
    expect(listings[0].title).toContain("ALFA ROMEO");
  });
});
