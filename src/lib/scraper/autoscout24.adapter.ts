import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { BaseAdapter } from "./base-adapter";
import type { RawListing } from "./types";

const CARD_SELECTOR = '[data-testid="list-item"]';
const TITLE_SELECTOR = ".ListItemTitle_title__sLi_x";
const SUBTITLE_SELECTOR = ".ListItemTitle_subtitle__V_ao6";

const MAX_PAGES = 5;
const LARGEST_IMAGE_SIGNATURE = "480x360.jpg";

export class Autoscout24Adapter extends BaseAdapter {
  name = "autoscout24";

  async scrape(url: string): Promise<RawListing[]> {
    this.seenExternalIds.clear();
    const allListings: RawListing[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      if (this.isDeadlineExceeded()) break;

      const pageUrl = this.withPageParam(url, page);

      let html: string;
      try {
        html = await this.fetchHtml(pageUrl);
      } catch (err) {
        // A failed fetch on a later page means we've reached the end (or got
        // blocked); stop paging instead of failing the whole job.
        if (page === 1) throw err;
        console.warn(
          `[${this.name}] Pagination stopped at page ${page}:`,
          err instanceof Error ? err.message : String(err)
        );
        break;
      }

      const listings = this.parseListings(html, url);
      if (listings.length === 0) break;

      for (const listing of listings) {
        if (this.seenExternalIds.has(listing.externalId)) continue;
        this.seenExternalIds.add(listing.externalId);
        allListings.push(listing);
      }

      if (page > 1) await this.throttle();
    }

    return allListings;
  }

  private parseListings(html: string, sourceUrl: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    $(CARD_SELECTOR).each((_, element) => {
      try {
        const $el = $(element);

        const guid = $el.attr("data-guid");
        if (!guid) return;

        const canonicalUrl = `https://www.autoscout24.com/offers/${guid}`;
        const externalId = this.generateExternalId(
          canonicalUrl,
          this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
        );

        const title = this.extractTitle($el);
        if (!title) return;

        const price = this.parseNumber($el.attr("data-price"));
        const mileage = this.parseNumber($el.attr("data-mileage"));
        const year = this.parseFirstRegistrationYear(
          $el.attr("data-first-registration")
        );
        const make = $el.attr("data-make") || undefined;
        const model = $el.attr("data-model") || undefined;

        const description = $el
          .find(SUBTITLE_SELECTOR)
          .first()
          .text()
          .trim();

        const imageUrl = this.extractLargestImage($, $el);

        listings.push({
          externalId,
          title,
          price,
          mileage,
          year,
          damageStatus: undefined,
          description: description || undefined,
          imageUrl: imageUrl ?? undefined,
          images: imageUrl ? [imageUrl] : [],
          canonicalUrl,
          sourceUrl,
          isSold: false,
          make,
          model,
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

  private extractTitle($el: cheerio.Cheerio<AnyNode>): string | null {
    const title = $el.find(TITLE_SELECTOR).first().text().trim();
    if (title) return title;

    const make = $el.attr("data-make");
    const model = $el.attr("data-model");
    const fallback = [make, model].filter(Boolean).join(" ").trim();
    return fallback || null;
  }

  private parseNumber(raw: string | undefined): number {
    if (raw === undefined) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  private parseFirstRegistrationYear(
    firstRegistration: string | undefined
  ): number | undefined {
    if (!firstRegistration) return undefined;
    const match = firstRegistration.match(/\b(?:19|20)\d{2}\b/);
    if (!match) return undefined;
    const year = parseInt(match[0], 10);
    if (year >= 1950 && year <= new Date().getFullYear() + 1) return year;
    return undefined;
  }

  private extractLargestImage(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<AnyNode>
  ): string | null {
    const candidates: string[] = [];

    $el.find("source").each((_, source) => {
      const $source = $(source);
      // React serializes the attribute as `srcset`/`srcSet`; check both.
      const srcset = $source.attr("srcset") || $source.attr("srcSet");
      if (srcset) candidates.push(srcset);
    });

    if (candidates.length === 0) {
      const $img = $el.find("img").first();
      const src =
        $img.attr("src") || $img.attr("data-src") || $img.attr("data-lazy");
      if (src) candidates.push(src);
    }

    return (
      candidates.find((c) => c.includes(LARGEST_IMAGE_SIGNATURE)) ??
      candidates[0] ??
      null
    );
  }

  private withPageParam(url: string, page: number): string {
    const parsed = new URL(url);
    parsed.searchParams.set("page", String(page));
    return parsed.href;
  }
}
