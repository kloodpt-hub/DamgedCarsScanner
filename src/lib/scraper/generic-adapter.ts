import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";

const COMMON_PATTERNS = {
  listingContainer: [
    '[class*="listing"]',
    '[class*="card"]',
    '[class*="result"]',
    '[class*="item"]',
    '[class*="annonce"]',
    "[data-listing]",
    "[data-ad]",
    "article",
  ],
  price: [
    '[class*="price"]',
    '[class*="prix"]',
    '[data-price]',
    '[itemprop="price"]',
    '[class*="amount"]',
  ],
  year: [
    '[class*="year"]',
    '[class*="annee"]',
    '[class*="registration"]',
    '[class*="immatriculation"]',
  ],
  mileage: [
    '[class*="mileage"]',
    '[class*="km"]',
    '[class*="kilometr"]',
    '[data-mileage]',
  ],
  imageUrl: ["img[src]", "img[data-src]", "img[data-lazy]"],
};

export class GenericAdapter extends BaseAdapter {
  name = "generic";

  async scrape(url: string, selectors: ScraperSelectors): Promise<RawListing[]> {
    const html = await this.fetchHtml(url);
    return this.parseHtml(html, selectors, url);
  }

  protected override parseHtml(
    html: string,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): RawListing[] {
    const $ = cheerio.load(html);

    const effectiveSelectors = this.resolveSelectors($, selectors);
    const listings: RawListing[] = [];

    $(effectiveSelectors.listingContainer).each((_: number, element: any) => {
      try {
        const $el = $(element);

        const title = this.extractText($, $el, effectiveSelectors.title);
        if (!title) return;

        const link = this.extractLink($, $el, effectiveSelectors.link, sourceUrl);
        if (!link) return;

        const externalId = this.generateExternalId(link);

        const price = this.extractNumber($, $el, effectiveSelectors.price);
        const year = this.extractNumber($, $el, effectiveSelectors.year);
        const mileage = this.extractNumber($, $el, effectiveSelectors.mileage);
        const damageStatus = this.extractText($, $el, effectiveSelectors.damageStatus);
        const description = this.extractText($, $el, effectiveSelectors.description);
        const imageUrl = this.extractImage($, $el, effectiveSelectors.imageUrl, sourceUrl);
        const images = this.extractAllImages($, $el, effectiveSelectors.imageUrl, sourceUrl);

        const enhanced = this.enhanceFromText({
          title,
          description,
          year,
          mileage,
          damageStatus,
        });

        listings.push({
          externalId,
          title,
          price: price ?? undefined,
          year: enhanced.year ?? undefined,
          mileage: enhanced.mileage ?? undefined,
          damageStatus: enhanced.damageStatus ?? undefined,
          description: description ?? undefined,
          imageUrl: imageUrl ?? undefined,
          images,
          canonicalUrl: link,
          sourceUrl,
        });
      } catch (err) {
        console.warn(
          "[generic] Skipping malformed listing:",
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    return listings;
  }

  private resolveSelectors($: cheerio.CheerioAPI, base: ScraperSelectors): ScraperSelectors {
    const pick = (candidates: string[], fallback: string): string => {
      for (const sel of candidates) {
        if ($(sel).length > 0) return sel;
      }
      return fallback;
    };

    return {
      listingContainer: pick(
        COMMON_PATTERNS.listingContainer,
        base.listingContainer
      ),
      title: base.title || "h2, h3, [class*='title']",
      price: pick(COMMON_PATTERNS.price, base.price || "[class*='price']"),
      year: pick(COMMON_PATTERNS.year, base.year || "[class*='year']"),
      mileage: pick(COMMON_PATTERNS.mileage, base.mileage || "[class*='mileage']"),
      damageStatus: base.damageStatus || "[class*='damage'], [class*='state']",
      description:
        base.description || "[class*='description'], [class*='desc'], p",
      imageUrl: pick(COMMON_PATTERNS.imageUrl, base.imageUrl || "img"),
      link: base.link || "a[href]",
      nextPage: base.nextPage,
    };
  }

  private enhanceFromText(data: {
    title: string;
    description: string | null;
    year: number | null;
    mileage: number | null;
    damageStatus: string | null;
  }): { year: number | null; mileage: number | null; damageStatus: string | null } {
    const text = `${data.title} ${data.description ?? ""}`.toLowerCase();

    let year = data.year;
    if (!year) {
      const yearMatch = text.match(/(?:19|20)\d{2}/);
      if (yearMatch) {
        const parsed = parseInt(yearMatch[0], 10);
        if (parsed >= 1950 && parsed <= new Date().getFullYear() + 1) {
          year = parsed;
        }
      }
    }

    let mileage = data.mileage;
    if (!mileage) {
      const kmMatch = text.match(/([\d\s.,]+)\s*km/);
      if (kmMatch) {
        mileage = parseInt(kmMatch[1].replace(/[\s.,]/g, ""), 10);
      }
    }

    let damageStatus = data.damageStatus;
    if (!damageStatus) {
      const damageKeywords: [RegExp, string][] = [
        [/non[\s-]accident[eé]|sans[\s-]accident/i, "Non accidenté"],
        [/accident[eé]|accident[\s-]/i, "Accidenté"],
        [/unfallfrei|no[\s-]accident/i, "Unfallfrei"],
        [/unfall|accident/i, "Unfall"],
      ];
      for (const [pattern, status] of damageKeywords) {
        if (pattern.test(text)) {
          damageStatus = status;
          break;
        }
      }
    }

    return { year, mileage, damageStatus };
  }
}
