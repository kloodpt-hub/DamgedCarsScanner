import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parseMileage, parsePrice, parseYear } from "./attribute-parser";

export const SCHADEAUTOS_NL_SELECTORS: ScraperSelectors = {
  listingContainer: "div[data-href].flexitem.car",
  title: "h2 a",
  price: "div.price",
  year: ".details div[title='ERD']",
  mileage: ".details div[title='mileage']",
  damageStatus: "",
  description: "p.model-type",
  imageUrl: ".car-image img",
  link: "a[href]",
  nextPage: "link[rel='next']",
};

export class SchadeautosNlAdapter extends BaseAdapter {
  name = "schadeautos-nl";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = selectors?.listingContainer
      ? selectors
      : SCHADEAUTOS_NL_SELECTORS;
    return this.scrapeWithPagination(url, applied);
  }

  protected extractListings(
    $: cheerio.CheerioAPI,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): RawListing[] {
    const listings: RawListing[] = [];

    $(selectors.listingContainer || "div[data-href].flexitem.car").each(
      (_, element) => {
        try {
          const $el = $(element);

          const title = $el.find("h2 a").first().text().trim();
          if (!title) return;

          const dataHref = $el.attr("data-href");
          if (!dataHref) return;

          const canonicalUrl = new URL(dataHref, sourceUrl).href;
          const externalId = this.generateExternalId(
            canonicalUrl,
            this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
          );

          const price =
            parsePrice($el.find("div.price").first().text()) ?? undefined;

          const year =
            parseYear(
              $el.find('.details div[title="ERD"]').first().text()
            ) ?? undefined;

          const mileage =
            parseMileage(
              $el.find('.details div[title="mileage"]').first().text()
            ) ?? undefined;

          const description =
            $el.find("p.model-type").first().text().trim() || undefined;

          const make = $el.attr("data-make-label") || undefined;

          const imageUrl = this.extractImage($, $el, ".car-image img", sourceUrl);

          listings.push({
            externalId,
            title,
            price,
            year,
            mileage,
            damageStatus: undefined,
            description,
            imageUrl: imageUrl ?? undefined,
            images: imageUrl ? [imageUrl] : [],
            canonicalUrl,
            sourceUrl,
            isSold: false,
            make,
          });
        } catch (err) {
          console.warn(
            `[${this.name}] Skipping malformed listing:`,
            err instanceof Error ? err.message : String(err)
          );
        }
      }
    );

    return listings;
  }
}
