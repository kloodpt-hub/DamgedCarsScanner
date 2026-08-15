export interface RawListing {
  externalId: string;
  title: string;
  price?: number;
  year?: number;
  mileage?: number;
  damageStatus?: string;
  description?: string;
  imageUrl?: string;
  images: string[];
  canonicalUrl: string;
  sourceUrl: string;
  isSold?: boolean;
}

export interface ScraperSelectors {
  listingContainer: string;
  title: string;
  price: string;
  year: string;
  mileage: string;
  damageStatus: string;
  description: string;
  imageUrl: string;
  link: string;
  nextPage?: string;
}

export interface ScraperAdapter {
  name: string;
  scrape(url: string, selectors: ScraperSelectors): Promise<RawListing[]>;
}

export interface ScraperJobResult {
  listingsFound: number;
  newListings: number;
  errors: string[];
  skipped?: boolean;
}
