import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";

const AUTOSCOUT24_SELECTORS: ScraperSelectors = {
  listingContainer: '[data-testid="sr-listing-item"]',
  title: '[data-testid="vehicle-title"]',
  price: '[data-testid="price"]',
  year: '[data-testid="vehicle-registration"]',
  mileage: '[data-testid="vehicle-mileage"]',
  damageStatus: "",
  description: '[data-testid="vehicle-details"]',
  imageUrl: "img",
  link: 'a[data-testid="listing-link"]',
  nextPage: 'button[aria-label="Next page"]',
};

export class Autoscout24Adapter extends BaseAdapter {
  name = "autoscout24";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const appliedSelectors = selectors ?? AUTOSCOUT24_SELECTORS;
    return this.scrapeWithPagination(url, appliedSelectors);
  }
}
