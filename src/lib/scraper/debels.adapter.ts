import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing } from "./types";
import { parseMileage, parsePrice, parseYear } from "./attribute-parser";

export class DebelsAdapter extends BaseAdapter {
  name = "debels";

  async scrape(url: string): Promise<RawListing[]> {
    const html = await this.fetchHtml(url);
    return this.parseListings(html, url);
  }

  private parseListings(html: string, sourceUrl: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    $('div[class*="col-lg-3"]').each((_, element) => {
      try {
        const $el = $(element);

        const $link = $el.find('a[href*="/damage-salvage-cars/"]').first();
        if (!$link.length) return;
        const href = $link.attr("href");
        if (!href) return;

        const canonicalUrl = new URL(href, sourceUrl).href;
        const externalId = this.generateExternalId(
          canonicalUrl,
          this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
        );

        const brandPart = $el.find(".carInfoBig").first().text().trim();
        if (!brandPart) return;

        const strongTexts = $el
          .find("div.col-12 strong")
          .map((_, s) => $(s).text().trim())
          .get();

        const model = strongTexts[0] ?? "";
        const title = [brandPart, model].filter(Boolean).join(" ");
        const year = parseYear(`${brandPart} ${title}`) ?? undefined;
        const price = parsePrice($el.find(".carInfoPrice").first().text()) ?? undefined;

        let mileage: number | undefined;
        for (const text of strongTexts) {
          if (text.includes("km")) {
            mileage = parseMileage(text) ?? undefined;
            break;
          }
        }

        const description = strongTexts.join(" ") || undefined;
        const imageUrl = this.extractImage($, $el, "img", sourceUrl);
        const images: string[] = imageUrl ? [imageUrl] : [];

        listings.push({
          externalId,
          title,
          price,
          year,
          mileage,
          damageStatus: undefined,
          description,
          imageUrl: imageUrl ?? undefined,
          images,
          canonicalUrl,
          sourceUrl,
          isSold: false,
        });
      } catch (err) {
        console.warn(
          `[debels] Skipping malformed listing:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    return listings;
  }
}
