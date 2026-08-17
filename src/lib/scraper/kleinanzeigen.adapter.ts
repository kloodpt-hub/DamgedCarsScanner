import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

const KA_SELECTORS: ScraperSelectors = {
  listingContainer: 'article.aditem',
  title: 'a.ellipsis, .textmodule-description a, .aditem-main--middle--title a',
  price: '.aditem-main--middle--price-shipping--price',
  year: '',
  mileage: '',
  damageStatus: '.aditem-main--middle--description',
  description: '.aditem-main--middle--description',
  imageUrl: '.aditem-image img',
  link: 'a[href*="/s-anzeige/"]',
  nextPage: 'a.pagination-next',
};

export class KleinanzeigenAdapter extends BaseAdapter {
  name = "kleinanzeigen";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = { ...KA_SELECTORS, ...selectors };
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

        const priceText = $el.find('.aditem-main--middle--price-shipping--price').first().text().trim();
        const price = parsePrice(priceText) ?? undefined;

        const descText = $el.find('.aditem-main--middle--description').first().text().trim();
        const fullText = `${title} ${descText}`;

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
          description: descText || undefined,
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
