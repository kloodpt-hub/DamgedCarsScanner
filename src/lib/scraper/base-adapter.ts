import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { createHash } from "crypto";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import type { RawListing, ScraperSelectors, ScraperAdapter } from "./types";
import { isListingSold } from "./sold-detector";
import { parsePrice } from "./attribute-parser";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const DEFAULT_THROTTLE_MS = 1500;
const REQUEST_TIMEOUT_MS = 30000;
const DEADLINE_MARGIN_MS = 5000;

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BaseAdapterOptions {
  throttleMs?: number;
  proxyUrl?: string;
  deadline?: Date;
  sourceId?: string;
}

export abstract class BaseAdapter implements ScraperAdapter {
  name: string = "BaseAdapter";

  protected throttleMs: number;
  protected proxyUrl: string | null;
  protected deadline: Date | null;
  protected sourceId: string | null = null;
  private dispatcher: ProxyAgent | null = null;

  constructor(options?: BaseAdapterOptions) {
    this.throttleMs = options?.throttleMs ?? DEFAULT_THROTTLE_MS;
    this.proxyUrl = options?.proxyUrl ?? process.env.PROXY_URL ?? null;
    this.deadline = options?.deadline ?? null;
    this.sourceId = options?.sourceId ?? null;
    if (this.proxyUrl) {
      try {
        this.dispatcher = new ProxyAgent(this.proxyUrl);
      } catch (err) {
        console.warn(`[${this.name}] Failed to init ProxyAgent:`, err);
      }
    }
  }

  abstract scrape(url: string, selectors: ScraperSelectors): Promise<RawListing[]>;

  protected isDeadlineExceeded(): boolean {
    if (!this.deadline) return false;
    return Date.now() > this.deadline.getTime() - DEADLINE_MARGIN_MS;
  }

  protected async fetchHtml(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (this.isDeadlineExceeded()) {
        throw new Error(`Deadline exceeded before fetching ${url}`);
      }

      try {
        const headers: Record<string, string> = {
          "User-Agent": getRandomUserAgent(),
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,nl;q=0.8,fr;q=0.7,de;q=0.6",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "no-cache",
        };

        const fetchInit: RequestInit & { dispatcher?: ProxyAgent } = {
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        };
        if (this.dispatcher) fetchInit.dispatcher = this.dispatcher;

        // Use undici.fetch so the dispatcher (proxy) option is honoured.
        const response = await (this.dispatcher
          ? undiciFetch(url, fetchInit as never)
          : fetch(url, fetchInit));

        if (!response.ok) {
          const status = response.status;

          // 4xx (except 429) → fail fast, do not retry.
          if (status >= 400 && status < 500 && status !== 429) {
            throw new NonRetryableError(`HTTP ${status}: ${response.statusText}`);
          }

          // Retryable: 429, 5xx
          let retryAfterMs = 0;
          if (status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            if (retryAfter) {
              const secs = parseInt(retryAfter, 10);
              if (!isNaN(secs)) retryAfterMs = secs * 1000;
            }
          }
          throw new RetryableError(
            `HTTP ${status}: ${response.statusText}`,
            retryAfterMs
          );
        }

        return await response.text();
      } catch (error) {
        // Non-retryable: real HTTP 4xx we threw above
        if (error instanceof NonRetryableError) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES) {
          let baseDelay = RETRY_DELAY_MS * 2 ** (attempt - 1);
          if (error instanceof RetryableError && error.retryAfterMs > 0) {
            baseDelay = Math.max(baseDelay, error.retryAfterMs);
          }
          const backoff = baseDelay + Math.random() * 1000;
          await sleep(backoff);
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  protected throttle(): Promise<void> {
    if (this.throttleMs <= 0) return Promise.resolve();
    const jitter = Math.floor(Math.random() * 500);
    return sleep(this.throttleMs + jitter);
  }

  protected parseHtml(
    html: string,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): { listings: RawListing[]; nextPageUrl: string | null } {
    const $ = cheerio.load(html);
    const listings = this.extractListings($, selectors, sourceUrl);
    const nextPageUrl = this.extractNextPageUrl($, selectors, sourceUrl);
    return { listings, nextPageUrl };
  }

  protected extractListings($: cheerio.CheerioAPI, selectors: ScraperSelectors, sourceUrl: string): RawListing[] {
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
          isSold: isListingSold(title, description),
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

  protected extractNextPageUrl(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $: any,
    selectors: ScraperSelectors,
    currentUrl: string
  ): string | null {
    if (!selectors.nextPage) return null;
    const nextHref = $(selectors.nextPage).first().attr("href");
    if (!nextHref) return null;
    try {
      return new URL(nextHref, currentUrl).href;
    } catch {
      return null;
    }
  }

  protected sourceIdForExternalId(_sourceUrl: string): string {
    // Overridable; default to adapter name so external IDs stay unique per source type.
    return this.name;
  }

  protected async fetchAndParse(
    url: string,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): Promise<{ listings: RawListing[]; nextPageUrl: string | null }> {
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
      if (this.isDeadlineExceeded()) break;

      const { listings, nextPageUrl } = await this.fetchAndParse(
        currentUrl,
        selectors,
        baseUrl
      );
      allListings.push(...listings);

      currentUrl = nextPageUrl;
      pageNum++;
      if (currentUrl) await this.throttle();
    }

    return allListings;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractText($: any, $el: any, selector: string): string | null {
    if (!selector) return null;
    const selectors = selector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const text = $el.find(sel).first().text().trim();
      if (text) return text;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractNumber($: any, $el: any, selector: string): number | null {
    if (!selector) return null;
    const selectors = selector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const text = $el.find(sel).first().text().trim();
      if (!text) continue;

      const parsed = parsePrice(text);
      if (parsed !== null) return parsed;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractImage($: any, $el: any, selector: string, baseUrl: string): string | null {
    if (!selector) return null;
    const selectors = selector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const img = $el.find(sel).first();
      if (!img.length) continue;

      const src =
        img.attr("src") || img.attr("data-src") || img.attr("data-lazy");
      if (!src) continue;

      try {
        return new URL(src, baseUrl).href;
      } catch {
        // skip invalid
      }
    }
    return null;
  }

  protected extractAllImages($: cheerio.CheerioAPI, $el: cheerio.Cheerio<AnyNode>, selector: string, baseUrl: string): string[] {
    if (!selector) return [];
    const images: string[] = [];
    const selectors = selector.split(",").map((s) => s.trim());

    for (const sel of selectors) {
      $el.find(sel).each((_, img) => {
        const $img = $(img);
        const src =
          $img.attr("src") || $img.attr("data-src") || $img.attr("data-lazy");
        if (src) {
          try {
            const resolved = new URL(src, baseUrl).href;
            if (!images.includes(resolved)) {
              images.push(resolved);
            }
          } catch {
            // Skip invalid URLs
          }
        }
      });
    }

    return images;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected extractLink($: any, $el: any, selector: string, baseUrl: string): string | null {
    if (!selector) return null;
    const selectors = selector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const href = $el.find(sel).first().attr("href");
      if (!href) continue;

      try {
        return new URL(href, baseUrl).href;
      } catch {
        // skip invalid
      }
    }
    return null;
  }

  protected generateExternalId(url: string, sourceId: string): string {
    const hash = createHash("sha256").update(url).digest("hex").slice(0, 16);
    return `${sourceId}_${hash}`;
  }
}

class RetryableError extends Error {
  retryAfterMs: number;
  constructor(message: string, retryAfterMs = 0) {
    super(message);
    this.name = "RetryableError";
    this.retryAfterMs = retryAfterMs;
  }
}

class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
  }
}
