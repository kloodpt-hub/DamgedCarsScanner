import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { isListingSold } from "./sold-detector";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

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
    const text = `${listing.title ?? ""} ${listing.description ?? ""}`;

    let year = listing.year;
    if (!year) {
      year = parseYear(text) ?? undefined;
    }

    let mileage = listing.mileage;
    if (!mileage) {
      mileage = parseMileage(text) ?? undefined;
    }

    let damageStatus = listing.damageStatus;
    if (!damageStatus) {
      damageStatus = parseDamageStatus(text) ?? undefined;
    }

    const isSold = isListingSold(listing.title, listing.description);

    return { ...listing, year, mileage, damageStatus, isSold };
  }
}
