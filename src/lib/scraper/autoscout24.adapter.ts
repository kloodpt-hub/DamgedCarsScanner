import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";
import { isListingSold } from "./sold-detector";
import { parsePrice, parseMileage, parseYear, parseDamageStatus } from "./attribute-parser";

const AUTOSCOUT24_SELECTORS: ScraperSelectors = {
  listingContainer:
    '[data-testid="sr-listing-item"], [data-testid="list-item"], .cl-list-element',
  title:
    '[data-testid="vehicle-title"], [data-testid="title"], .heading, h2, .vehicle-title',
  price:
    '[data-testid="price"], [class*="price"], .price, [data-testid="listing-price"]',
  year:
    '[data-testid="vehicle-registration"], [data-testid="first-registration"], .first-registration, [class*="registration"]',
  mileage:
    '[data-testid="vehicle-mileage"], [data-testid="mileage"], .mileage, [class*="km"]',
  damageStatus:
    '[data-testid="vehicle-condition"], [class*="condition"], [class*="damage"]',
  description:
    '[data-testid="vehicle-details"], [data-testid="seller-details"], .seller-details, [class*="description"]',
  imageUrl: "img",
  link:
    'a[data-testid="listing-link"], a[data-testid="listing-detail-link"], a[href*="/listing/"]',
  nextPage:
    'button[aria-label="Next page"], a[aria-label="Next page"], [data-testid="pagination-next"], [class*="next"]',
};

const YEAR_PATTERN = /(?:01\/)?((?:19|20)\d{2})/;
const MILEAGE_PATTERN = /([\d\s.,]+)\s*km/i;

export class Autoscout24Adapter extends BaseAdapter {
  name = "autoscout24";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const appliedSelectors = selectors ?? AUTOSCOUT24_SELECTORS;
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
