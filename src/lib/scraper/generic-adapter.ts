import { BaseAdapter } from "./base-adapter";
import type { RawListing, ScraperSelectors } from "./types";

export class GenericAdapter extends BaseAdapter {
  name = "generic";

  async scrape(url: string, selectors: ScraperSelectors): Promise<RawListing[]> {
    return this.scrapeWithPagination(url, selectors);
  }
}
