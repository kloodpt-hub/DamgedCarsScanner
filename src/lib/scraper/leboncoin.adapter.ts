import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";

const LEBONCOIN_SELECTORS: ScraperSelectors = {
  listingContainer:
    '[data-qa-id="aditem_container"], [data-qa-id="listitem_ad"], .styles_adCard__',
  title: '[data-qa-id="aditem_title"], [data-qa-id="subject"], h2, .textHeading',
  price:
    '[data-qa-id="aditem_price"], [data-qa-id="price"], .adPrice, [class*="price"]',
  year: '[data-qa-id="criteria_value"], [class*="year"], [data-qa-id="aditem_date"]',
  mileage:
    '[data-qa-id="criteria_value"], [data-qa-id="item_params"] span, [class*="mileage"]',
  damageStatus: '[data-qa-id="aditem_description"], [class*="damage"], [class*="state"]',
  description:
    '[data-qa-id="aditem_description"], [data-qa-id="ad_description"], .textDescription',
  imageUrl: "img",
  link: 'a[data-qa-id="aditem_container"], a[data-qa-id="listitem_ad"], a[href*="/ad/"]',
  nextPage:
    'button[data-qa-id="pagination_next"], a[data-qa-id="pagination_next"], [aria-label="Page suivante"]',
};

const YEAR_PATTERN = /(?:19|20)\d{2}/;
const MILEAGE_PATTERN = /(\d[\d\s.,]*)\s*km/i;

export class LeboncoinAdapter extends BaseAdapter {
  name = "leboncoin";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const appliedSelectors = selectors ?? LEBONCOIN_SELECTORS;
    const listings = await this.scrapeWithPagination(url, appliedSelectors);
    return listings.map((l) => this.enhanceListing(l));
  }

  private enhanceListing(listing: RawListing): RawListing {
    let year = listing.year;
    if (!year && listing.title) {
      const titleMatch = listing.title.match(YEAR_PATTERN);
      if (titleMatch) {
        year = parseInt(titleMatch[0], 10);
      }
    }

    let mileage = listing.mileage;
    if (!mileage && listing.title) {
      const titleMileage = listing.title.match(MILEAGE_PATTERN);
      if (titleMileage) {
        mileage = parseInt(titleMileage[1].replace(/[\s.,]/g, ""), 10);
      }
    }
    if (!mileage && listing.description) {
      const descMileage = listing.description.match(MILEAGE_PATTERN);
      if (descMileage) {
        mileage = parseInt(descMileage[1].replace(/[\s.,]/g, ""), 10);
      }
    }

    let damageStatus = listing.damageStatus;
    if (!damageStatus) {
      const text = `${listing.title ?? ""} ${listing.description ?? ""}`.toLowerCase();
      if (text.includes("non accidenté") || text.includes("non accidente") || text.includes("sans accident")) {
        damageStatus = "Non accidenté";
      } else if (text.includes("accidenté") || text.includes("accidente") || text.includes("accident")) {
        damageStatus = "Accidenté";
      }
    }

    return { ...listing, year, mileage, damageStatus };
  }
}
