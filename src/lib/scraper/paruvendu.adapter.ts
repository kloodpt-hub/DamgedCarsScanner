import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

const PARUVENDU_SELECTORS: ScraperSelectors = {
  listingContainer: '[class*="annonce"], [class*="listing-item"], [class*="result-item"], article',
  title: 'h2, h3, [class*="title"]',
  price: '[class*="price"]',
  year: '[class*="year"], [class*="registration"]',
  mileage: '[class*="mileage"], [class*="km"]',
  damageStatus: '[class*="damage"], [class*="condition"]',
  description: '[class*="description"], [class*="desc"]',
  imageUrl: 'img',
  link: 'a[href*="/annonce/"]',
  nextPage: '[rel="next"], a[class*="next"]',
};

export class ParuvenduAdapter extends BaseAdapter {
  name = "paruvendu";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = { ...PARUVENDU_SELECTORS, ...selectors };
    return this.scrapeWithPagination(url, applied);
  }

  protected override extractListings(
    $: cheerio.CheerioAPI,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): RawListing[] {
    const listings: RawListing[] = [];

    $(selectors.listingContainer).each((_, element) => {
      try {
        const $el = $(element);

        const title = this.extractText($, $el, selectors.title);
        if (!title) return;

        const link = this.extractLink($, $el, selectors.link, sourceUrl);
        if (!link) return;

        const externalId = this.generateExternalId(
          link,
          this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
        );

        const priceText = $el.find(selectors.price).first().text().trim();
        const price = parsePrice(priceText) ?? undefined;

        const descText = this.extractText($, $el, selectors.description);
        const fullText = `${title} ${descText ?? ""}`;

        const year = parseYear(fullText) ?? undefined;
        const mileage = parseMileage(fullText) ?? undefined;
        const damageStatus = parseDamageStatus(fullText) ?? undefined;

        const imageUrl = this.extractImage($, $el, selectors.imageUrl, sourceUrl);
        const images = this.extractAllImages($, $el, selectors.imageUrl, sourceUrl);

        listings.push({
          externalId,
          title,
          price,
          year,
          mileage,
          damageStatus,
          description: descText ?? undefined,
          imageUrl: imageUrl ?? undefined,
          images,
          canonicalUrl: link,
          sourceUrl,
          isSold: false,
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
}
