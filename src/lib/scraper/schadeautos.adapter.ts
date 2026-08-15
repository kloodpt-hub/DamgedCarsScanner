import * as cheerio from "cheerio";
import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { isListingSold } from "./sold-detector";

const SCHADEAUTOS_SELECTORS: ScraperSelectors = {
  listingContainer: "a.schadeautos-card",
  title: ".schadeautos-card__title",
  price: ".schadeautos-card__price",
  year: ".schadeautos-card__footer .schadeautos-card__stat:nth-child(1) span",
  mileage: ".schadeautos-card__footer .schadeautos-card__stat:nth-child(3) span",
  damageStatus: "",
  description: ".schadeautos-card__subtitle",
  imageUrl: ".schadeautos-card__image",
  link: "a.schadeautos-card",
  nextPage: ".schadeautos-pagination__nav--next",
};

const DUTCH_DAMAGE_KEYWORDS = [
  "schade",
  "botschade",
  "brandschade",
  "waterschade",
  "total loss",
  "totaalverlies",
  "aantasting",
  "beschadigd",
];

export class SchadeautosAdapter extends BaseAdapter {
  name = "schadeautos";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const appliedSelectors = selectors?.listingContainer
      ? selectors
      : SCHADEAUTOS_SELECTORS;
    const html = await this.fetchHtml(url);
    const listings = this.parseFromDataAttributes(html, appliedSelectors, url);
    return listings.map((l) => this.enhanceListing(l));
  }

  protected parseFromDataAttributes(
    html: string,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    const containerSelector = selectors.listingContainer || "a.schadeautos-card";
    $(containerSelector).each((_, element) => {
      try {
        const $el = $(element);

        const title = $el.find(selectors.title || ".schadeautos-card__title").first().text().trim();
        if (!title) return;

        const href = $el.attr("href");
        if (!href) return;
        const canonicalUrl = new URL(href, sourceUrl).href;
        const externalId = this.generateExternalId(
          canonicalUrl,
          this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
        );

        const dataYear = parseInt($el.attr("data-year") || "", 10);
        const dataPrice = parseInt($el.attr("data-price") || "", 10);
        const makeLabel = $el.attr("data-make-label") || "";
        const baseModelLabel = $el.attr("data-base-model-label") || "";

        const subtitle = $el
          .find(selectors.description || ".schadeautos-card__subtitle")
          .first()
          .text()
          .trim();

        const fullTitle = [makeLabel, baseModelLabel || subtitle].filter(Boolean).join(" ") || title;

        let year: number | undefined;
        if (!isNaN(dataYear) && dataYear > 1900) {
          year = dataYear;
        } else {
          const yearText = $el
            .find(selectors.year || ".schadeautos-card__footer .schadeautos-card__stat:nth-child(1) span")
            .first()
            .text()
            .trim();
          const yearMatch = yearText.match(/(?:19|20)\d{2}/);
          if (yearMatch) year = parseInt(yearMatch[0], 10);
        }

        let price: number | undefined;
        if (!isNaN(dataPrice) && dataPrice > 0) {
          price = dataPrice;
        } else {
          const priceText = $el
            .find(selectors.price || ".schadeautos-card__price")
            .first()
            .text()
            .trim();
          const cleaned = priceText.replace(/[^\d.,]/g, "").replace(",", ".");
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) price = parsed;
        }

        let mileage: number | undefined;
        const mileageText = $el
          .find(selectors.mileage || ".schadeautos-card__footer .schadeautos-card__stat:nth-child(3) span")
          .first()
          .text()
          .trim();
        const mileageCleaned = mileageText.replace(/[^\d]/g, "");
        const mileageParsed = parseInt(mileageCleaned, 10);
        if (!isNaN(mileageParsed) && mileageParsed > 0) {
          mileage = mileageParsed;
        }

        const imageUrl = this.extractImage($, $el, selectors.imageUrl || ".schadeautos-card__image", sourceUrl);

        const images: string[] = [];
        if (imageUrl) images.push(imageUrl);

        const isSold =
          $el.hasClass("schadeautos-card--sold") ||
          $el.find(".schadeautos-card__sold").length > 0;

        listings.push({
          externalId,
          title: fullTitle,
          price,
          year,
          mileage,
          damageStatus: undefined,
          description: subtitle || undefined,
          imageUrl: imageUrl ?? undefined,
          images,
          canonicalUrl,
          sourceUrl,
          isSold,
        });
      } catch (err) {
        console.warn(
          `[schadeautos] Skipping malformed listing:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    return listings;
  }

  private enhanceListing(listing: RawListing): RawListing {
    let damageStatus = listing.damageStatus;
    if (!damageStatus) {
      const text = `${listing.title ?? ""} ${listing.description ?? ""}`.toLowerCase();
      for (const keyword of DUTCH_DAMAGE_KEYWORDS) {
        if (text.includes(keyword)) {
          damageStatus = "Schade";
          break;
        }
      }
    }

    const isSold = listing.isSold || isListingSold(listing.title, listing.description);

    return { ...listing, damageStatus, isSold };
  }
}
