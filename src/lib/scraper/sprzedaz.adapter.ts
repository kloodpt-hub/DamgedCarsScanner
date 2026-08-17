import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

const SPRZEDAZ_SELECTORS: ScraperSelectors = {
  listingContainer: 'article.element',
  title: 'h2.title a, h2.title',
  price: '[class*="price"]',
  year: '',
  mileage: '',
  damageStatus: '',
  description: '.detailsWithSnippets .description, .details .snippet',
  imageUrl: 'img[src*="img-sprzedajemy"]',
  link: 'a.offerLink',
  nextPage: 'a[rel="next"], .pagination a:last-child',
};

export class SprzedazAdapter extends BaseAdapter {
  name = "sprzedaz";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = { ...SPRZEDAZ_SELECTORS, ...selectors };
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
