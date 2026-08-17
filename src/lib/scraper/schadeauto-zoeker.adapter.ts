import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parsePrice, parseYear } from "./attribute-parser";

export const SCHADEAUTO_ZOEKER_SELECTORS: ScraperSelectors = {
  listingContainer: "div.object3",
  title: "p.merk",
  price: "div.foto > div.boxBottom > p",
  year: "span.fltlt",
  mileage: "",
  damageStatus: "",
  description: "",
  imageUrl: "div.foto > a > img",
  link: "div.foto > a[href]",
  nextPage: "",
};

const MAX_PAGES = 10;

export class SchadeautoZoekerAdapter extends BaseAdapter {
  name = "schadeauto-zoeker";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = { ...SCHADEAUTO_ZOEKER_SELECTORS, ...selectors };

    const allListings: RawListing[] = [];
    let currentUrl: string | null = url;
    let pageNum = 0;

    while (currentUrl && pageNum < MAX_PAGES) {
      if (this.isDeadlineExceeded()) break;

      try {
        const html = await this.fetchHtml(currentUrl);
        allListings.push(...this.parseListings(html, applied, url));
      } catch (err) {
        console.warn(
          `[${this.name}] Failed to fetch page ${pageNum + 1} (${currentUrl}):`,
          err instanceof Error ? err.message : String(err)
        );
        break;
      }

      currentUrl = this.buildNextPageUrl(currentUrl);
      pageNum++;
      if (currentUrl) await this.throttle();
    }

    return allListings;
  }

  protected buildNextPageUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      const pageNum = parseInt(last, 10);
      if (isNaN(pageNum)) return null;
      segments[segments.length - 1] = String(pageNum + 1);
      parsed.pathname = `/${segments.join("/")}`;
      return parsed.href;
    } catch {
      return null;
    }
  }

  private parseListings(
    html: string,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    const containerSel = selectors.listingContainer || "div.object3";
    const containerCount = $(containerSel).length;
    console.log(
      `[${this.name}] parseListings: ${containerCount} containers for "${containerSel}" in ${html.length} chars`
    );

    $(containerSel).each((_, element) => {
      try {
        const $el = $(element);

        const title = this.extractTitle($el);
        if (!title) {
          console.warn(`[${this.name}] Skipping: no title. merk="${$el.find("p.merk").first().text().trim()}" type="${$el.find("p.type").first().text().trim()}"`);
          return;
        }

        const link = this.extractLink($, $el, selectors.link, sourceUrl);
        if (!link) {
          console.warn(`[${this.name}] Skipping: no link. href="${$el.find("div.foto > a[href]").first().attr("href") ?? "none"}"`);
          return;
        }

        const externalId = this.generateExternalId(
          link,
          this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
        );

        const price =
          parsePrice(
            $el.find("div.foto > div.boxBottom > p").first().text()
          ) ?? undefined;

        let year: number | undefined;
        $el.find("span.fltlt").each((_, fltltEl) => {
          const $fltlt = $(fltltEl);
          const label = $fltlt.find(".label").first().text().trim().toLowerCase();
          if (label.includes("erd")) {
            year = parseYear($fltlt.text()) ?? undefined;
            return false;
          }
          return undefined;
        });

        const imageUrl = this.extractImage(
          $,
          $el,
          "div.foto > a > img",
          sourceUrl
        );

        const make = $el.find("p.merk").first().text().trim() || undefined;

        listings.push({
          externalId,
          title,
          price,
          year,
          mileage: undefined,
          damageStatus: undefined,
          description: undefined,
          imageUrl: imageUrl ?? undefined,
          images: imageUrl ? [imageUrl] : [],
          canonicalUrl: link,
          sourceUrl,
          isSold: false,
          make,
        });
      } catch (err) {
        console.warn(
          `[${this.name}] Skipping malformed listing:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    console.log(`[${this.name}] parseListings: ${listings.length} listings parsed from ${containerCount} containers`);
    return listings;
  }

  private extractTitle($el: cheerio.Cheerio<AnyNode>): string | null {
    const merk = $el.find("p.merk").first().text().trim();
    const type = $el.find("p.type").first().text().trim();
    const joined = [merk, type].filter(Boolean).join(" ").trim();
    if (joined) return joined;

    const alt = $el.find("div.foto > a > img").first().attr("alt");
    if (alt) return alt.trim();

    const href = $el.find("div.foto > a[href]").first().attr("href");
    if (href) {
      const slug = href.split("/").filter(Boolean).pop() || "";
      if (slug) return slug;
    }

    return null;
  }
}
