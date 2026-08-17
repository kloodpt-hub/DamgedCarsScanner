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
    const applied = { ...SCHADEAUTOS_NL_SELECTORS, ...selectors };
    return this.scrapeWithPagination(url, applied);
  }

  protected extractListings(
    $: cheerio.CheerioAPI,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): RawListing[] {
    const listings: RawListing[] = [];

    const containerSel = selectors.listingContainer || "div[data-href].flexitem.car";
    const containerCount = $(containerSel).length;
    console.log(
      `[${this.name}] extractListings: ${containerCount} containers for "${containerSel}"`
    );

    $(containerSel).each(
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

          const grossPrice =
            parsePrice($el.find("div.price").first().text()) ?? undefined;

          const netPrice =
            parsePrice($el.find("span.label-price").first().text()) ?? undefined;

          const price = netPrice ?? grossPrice ?? undefined;

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
          const images = this.extractAllImages($, $el, ".car-image img", sourceUrl);

          listings.push({
            externalId,
            title,
            price,
            grossPrice,
            netPrice,
            year,
            mileage,
            damageStatus: undefined,
            description,
            imageUrl: imageUrl ?? undefined,
            images: images.length > 0 ? images : imageUrl ? [imageUrl] : [],
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

    console.log(`[${this.name}] extractListings: ${listings.length} listings parsed from ${containerCount} containers`);
    return listings;
  }
}
