import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { parseMileage, parsePrice, parseYear } from "./attribute-parser";

export const DIDIER_SELECTORS: ScraperSelectors = {
  listingContainer: ".c-category-products__card",
  title: ".c-category-products__item-title",
  price: "span.price",
  year: "",
  mileage: "",
  damageStatus: "",
  description: "",
  imageUrl: "",
  link: "a.c-category-products__title-block, a.c-category-products__cta-holder",
  nextPage: "ul.pages_list li.next a",
};

export class DidierAdapter extends BaseAdapter {
  name = "didier";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const applied = { ...DIDIER_SELECTORS, ...selectors };
    return this.scrapeWithPagination(url, applied);
  }

  protected extractListings(
    $: cheerio.CheerioAPI,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): RawListing[] {
    const listings: RawListing[] = [];

    $(selectors.listingContainer || ".c-category-products__card").each(
      (_, element) => {
        try {
          const $el = $(element);

          const title = $el
            .find(".c-category-products__item-title")
            .first()
            .text()
            .trim();
          if (!title) return;

          const link = this.extractLink($, $el, selectors.link, sourceUrl);
          if (!link) return;

          const externalId = this.generateExternalId(
            link,
            this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
          );

          const price =
            parsePrice($el.find("span.price").first().text()) ?? undefined;

          const year = this.extractAttributeValue($, $el, "icon-firstuseyear");
          const mileage = this.extractAttributeValue($, $el, "icon-mileage");

          const imageUrl = this.extractBackgroundImage($, $el, sourceUrl);

          listings.push({
            externalId,
            title,
            price,
            year,
            mileage,
            damageStatus: undefined,
            description: undefined,
            imageUrl: imageUrl ?? undefined,
            images: imageUrl ? [imageUrl] : [],
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
      }
    );

    return listings;
  }

  private extractBackgroundImage(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<AnyNode>,
    baseUrl: string
  ): string | null {
    const $image = $el
      .closest("li.c-category-products__item")
      .find("a.c-category-products__image")
      .first();
    if (!$image.length) return null;

    const style = $image.attr("style") || "";
    const match = style.match(/background-image\s*:\s*url\(([^)]+)\)/i);
    if (!match) return null;

    const src = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (!src) return null;

    try {
      return new URL(src, baseUrl).href;
    } catch {
      return null;
    }
  }

  private extractAttributeValue(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<AnyNode>,
    iconClass: string
  ): number | undefined {
    const $attribute = $el
      .find(".c-primary-attributes__attribute")
      .filter((_, attribute) =>
        $(attribute).find(`i.${iconClass}`).first().length > 0
      )
      .first();

    if (!$attribute.length) return undefined;

    const value = $attribute
      .find(".c-primary-attributes__value")
      .first()
      .text()
      .trim();

    if (iconClass === "icon-mileage") {
      return parseMileage(value) ?? undefined;
    }
    return parseYear(value) ?? undefined;
  }
}
