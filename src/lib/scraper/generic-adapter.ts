import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { isListingSold } from "./sold-detector";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

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
    const { listings } = this.parseHtml(html, selectors, url);
    return listings;
  }

  protected override parseHtml(
    html: string,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): { listings: RawListing[]; nextPageUrl: string | null } {
    const $ = cheerio.load(html);

    const effectiveSelectors = this.resolveSelectors($, selectors);
    const listings: RawListing[] = [];

    $(effectiveSelectors.listingContainer).each((_, element) => {
      try {
        const $el = $(element);

        const title = this.extractText($, $el, effectiveSelectors.title);
        if (!title) return;

        const link = this.extractLink($, $el, effectiveSelectors.link, sourceUrl);
        if (!link) return;

        const externalId = this.generateExternalId(
          link,
          this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
        );

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
          isSold: isListingSold(title, description),
        });
      } catch (err) {
        console.warn(
          "[generic] Skipping malformed listing:",
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    const nextPageUrl = this.extractNextPageUrl($, effectiveSelectors, sourceUrl);
    return { listings, nextPageUrl };
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
    const text = `${data.title} ${data.description ?? ""}`;

    let year = data.year;
    if (!year) {
      year = parseYear(text);
    }

    let mileage = data.mileage;
    if (!mileage) {
      mileage = parseMileage(text);
    }

    let damageStatus = data.damageStatus;
    if (!damageStatus) {
      damageStatus = parseDamageStatus(text);
    }

    return { year, mileage, damageStatus };
  }
}
