import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

const JM_SELECTORS: ScraperSelectors = {
  listingContainer: '.shop-item',
  title: 'h2.styleh3 a, h2 a, h3 a',
  price: '.price',
  year: '',
  mileage: '',
  damageStatus: '',
  description: '',
  imageUrl: '.rubrique2-carousel img, .image img',
  link: 'a[href*="vehicule"]',
  nextPage: '',
};

export class JmAutosAdapter extends BaseAdapter {
  name = "jm-autos";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = { ...JM_SELECTORS, ...selectors };
    const html = await this.fetchHtml(url);
    return this.parseListings(html, applied, url);
  }

  private parseListings(html: string, selectors: ScraperSelectors, sourceUrl: string): RawListing[] {
    const $ = cheerio.load(html);
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

        const fullText = title;

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
          description: undefined,
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
