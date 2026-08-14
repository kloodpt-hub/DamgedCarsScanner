import * as cheerio from "cheerio";
import type { RawListing, ScraperSelectors, ScraperAdapter } from "./types";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const PAGE_DELAY_MS = 1000;

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export abstract class BaseAdapter implements ScraperAdapter {
  abstract name: string;

  abstract scrape(url: string, selectors: ScraperSelectors): Promise<RawListing[]>;

  protected async fetchHtml(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": getRandomUserAgent(),
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  protected parseHtml(html: string, selectors: ScraperSelectors, sourceUrl: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    $(selectors.listingContainer).each((_: number, element: any) => {
      try {
        const $el = $(element);

        const title = this.extractText($, $el, selectors.title);
        if (!title) return;

        const link = this.extractLink($, $el, selectors.link, sourceUrl);
        if (!link) return;

        const externalId = this.generateExternalId(link);

        const price = this.extractNumber($, $el, selectors.price);
        const year = this.extractNumber($, $el, selectors.year);
        const mileage = this.extractNumber($, $el, selectors.mileage);
        const damageStatus = this.extractText($, $el, selectors.damageStatus);
        const description = this.extractText($, $el, selectors.description);
        const imageUrl = this.extractImage($, $el, selectors.imageUrl, sourceUrl);
        const images = this.extractAllImages($, $el, selectors.imageUrl, sourceUrl);

        listings.push({
          externalId,
          title,
          price: price ?? undefined,
          year: year ?? undefined,
          mileage: mileage ?? undefined,
          damageStatus: damageStatus ?? undefined,
          description: description ?? undefined,
          imageUrl: imageUrl ?? undefined,
          images,
          canonicalUrl: link,
          sourceUrl,
        });
      } catch {
        // Skip malformed listings silently
      }
    });

    return listings;
  }

  protected async fetchAndParse(
    url: string,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): Promise<RawListing[]> {
    const html = await this.fetchHtml(url);
    return this.parseHtml(html, selectors, sourceUrl);
  }

  protected async scrapeWithPagination(
    baseUrl: string,
    selectors: ScraperSelectors
  ): Promise<RawListing[]> {
    const allListings: RawListing[] = [];
    let currentUrl: string | null = baseUrl;
    let pageNum = 0;
    const maxPages = 10;

    while (currentUrl && pageNum < maxPages) {
      const listings = await this.fetchAndParse(currentUrl, selectors, baseUrl);
      allListings.push(...listings);

      if (selectors.nextPage) {
        const html = await this.fetchHtml(currentUrl);
        const $ = cheerio.load(html);
        const nextHref = $(selectors.nextPage).attr("href");
        currentUrl = nextHref
          ? new URL(nextHref, currentUrl).href
          : null;
      } else {
        currentUrl = null;
      }

      pageNum++;
      if (currentUrl) await sleep(PAGE_DELAY_MS);
    }

    return allListings;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractText($: any, $el: any, selector: string): string | null {
    if (!selector) return null;
    const text = $el.find(selector).first().text().trim();
    return text || null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractNumber($: any, $el: any, selector: string): number | null {
    if (!selector) return null;
    const text = $el.find(selector).first().text().trim();
    if (!text) return null;

    const cleaned = text.replace(/[^\d.,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractImage($: any, $el: any, selector: string, baseUrl: string): string | null {
    if (!selector) return null;
    const img = $el.find(selector).first();
    if (!img.length) return null;

    const src = img.attr("src") || img.attr("data-src") || img.attr("data-lazy");
    if (!src) return null;

    try {
      return new URL(src, baseUrl).href;
    } catch {
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractAllImages($: any, $el: any, selector: string, baseUrl: string): string[] {
    if (!selector) return [];
    const images: string[] = [];

    $el.find(selector).each((_: number, img: any) => {
      const $img = $(img);
      const src = $img.attr("src") || $img.attr("data-src") || $img.attr("data-lazy");
      if (src) {
        try {
          images.push(new URL(src, baseUrl).href);
        } catch {
          // Skip invalid URLs
        }
      }
    });

    return images;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractLink($: any, $el: any, selector: string, baseUrl: string): string | null {
    if (!selector) return null;
    const href = $el.find(selector).first().attr("href");
    if (!href) return null;

    try {
      return new URL(href, baseUrl).href;
    } catch {
      return null;
    }
  }

  protected generateExternalId(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `ext_${Math.abs(hash).toString(36)}`;
  }
}
