import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";

const LEBONCOIN_SELECTORS: ScraperSelectors = {
  listingContainer: '[data-qa-id="aditem_container"]',
  title: '[data-qa-id="aditem_title"]',
  price: '[data-qa-id="aditem_price"]',
  year: "",
  mileage: '[data-qa-id="criteria_container"] [data-qa-id="item_params"]',
  damageStatus: "",
  description: '[data-qa-id="aditem_description"]',
  imageUrl: "img",
  link: 'a[data-qa-id="aditem_container"]',
  nextPage: 'button[data-qa-id="pagination_next"]',
};

export class LeboncoinAdapter extends BaseAdapter {
  name = "leboncoin";

  async scrape(url: string, selectors?: ScraperSelectors): Promise<RawListing[]> {
    const appliedSelectors = selectors ?? LEBONCOIN_SELECTORS;
    return this.scrapeWithPagination(url, appliedSelectors);
  }
}
