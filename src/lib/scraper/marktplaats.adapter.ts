import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

const MP_SELECTORS: ScraperSelectors = {
  listingContainer: '.hz-Listing.hz-Listing--list-item',
  title: '.hz-Listing-listview-content--title, h3',
  price: '.hz-Listing-listview-content--price, [class*="price"]',
  year: '',
  mileage: '',
  damageStatus: '',
  description: '.hz-Listing-listview-content--subtitle',
  imageUrl: 'img',
  link: 'a[href*="/v/"]',
  nextPage: 'a[data-testid="pagination-next"], [class*="pagination"] a:last-child',
};

export class MarktplaatsAdapter extends BaseAdapter {
  name = "marktplaats";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = { ...MP_SELECTORS, ...selectors };
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

        const priceText = $el.find('[class*="price"]').first().text().trim();
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
