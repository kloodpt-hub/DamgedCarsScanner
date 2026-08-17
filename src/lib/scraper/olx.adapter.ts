import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

const OLX_SELECTORS: ScraperSelectors = {
  listingContainer: '[data-cy="l-card"]',
  title: 'h4, [data-cy="ad-card-title"]',
  price: '[data-testid="ad-price"], [class*="price"]',
  year: '',
  mileage: '',
  damageStatus: '',
  description: '[data-cy="ad-card-description"]',
  imageUrl: 'img',
  link: 'a[href*="/d/oferta/"]',
  nextPage: '[data-testid="pagination-next"], a[data-cy="pagination-next-btn"]',
};

export class OlxAdapter extends BaseAdapter {
  name = "olx";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = { ...OLX_SELECTORS, ...selectors };
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

        const priceText = $el.find('[data-testid="ad-price"], [class*="price"]').first().text().trim();
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
