import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parseMileage, parsePrice, parseYear } from "./attribute-parser";

const DSM_SELECTORS: ScraperSelectors = {
  listingContainer: "div.thumbnail.team-person",
  title: "div.panel-header header",
  price: "span.price",
  year: "",
  mileage: "",
  damageStatus: "",
  description: "",
  imageUrl: "img",
  link: "a[href*='VehicleId=']",
  nextPage: "",
};

export class DsmAdapter extends BaseAdapter {
  name = "dsm";

  async scrape(url: string): Promise<RawListing[]> {
    const html = await this.fetchHtml(url);
    return this.parseListings(html, url);
  }

  private parseListings(html: string, sourceUrl: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    $(DSM_SELECTORS.listingContainer).each((_, element) => {
      try {
        const $el = $(element);

        const title = $el.find("div.panel-header header").first().text().trim();
        if (!title) return;

        const link = this.extractLink($, $el, DSM_SELECTORS.link, sourceUrl);
        if (!link) return;

        const externalId = this.generateExternalId(
          link,
          this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
        );

        const priceText = $el.find("span.price").first().text().trim();
        const isSold = /sold/i.test(priceText);
        const price = parsePrice(priceText) ?? undefined;

        const { year, mileage } = this.extractYearAndMileage($, $el);

        const imageUrl = this.extractImage($, $el, "img", sourceUrl);

        listings.push({
          externalId,
          title,
          price,
          year,
          mileage,
          damageStatus: undefined,
          description: undefined,
          imageUrl: imageUrl ?? undefined,
          images: imageUrl ? [imageUrl] : [],
          canonicalUrl: link,
          sourceUrl,
          isSold,
        });
      } catch (err) {
        console.warn(
          `[${this.name}] Skipping malformed listing:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    return listings;
  }

  private extractYearAndMileage(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<AnyNode>
  ): { year?: number; mileage?: number } {
    let year: number | undefined;
    let mileage: number | undefined;

    $el.find("table tr").each((_, row) => {
      const $row = $(row);
      const cells = $row.find("td");
      if (cells.length < 2) return;

      const label = cells.eq(0).text().trim().toLowerCase();
      const value = cells.eq(1).text().trim();

      if (label.includes("first registration") && year === undefined) {
        year = parseYear(value) ?? undefined;
      } else if (label === "mileage" && mileage === undefined) {
        mileage = parseMileage(value) ?? undefined;
      }
    });

    return { year, mileage };
  }
}
