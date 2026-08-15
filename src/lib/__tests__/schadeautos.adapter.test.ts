import { describe, it, expect } from "vitest";
import { SchadeautosAdapter } from "@/lib/scraper/schadeautos.adapter";
import type { RawListing, ScraperSelectors } from "@/lib/scraper/types";

class TestSchadeautosAdapter extends SchadeautosAdapter {
  exposeParseFromDataAttributes(
    html: string,
    selectors: ScraperSelectors,
    sourceUrl: string
  ): RawListing[] {
    return this.parseFromDataAttributes(html, selectors, sourceUrl);
  }
}

const SELECTORS: ScraperSelectors = {
  listingContainer: "a.schadeautos-card",
  title: "",
  price: "",
  year: "",
  mileage: "",
  damageStatus: "",
  description: "",
  imageUrl: "",
  link: "",
};

describe("SchadeautosAdapter", () => {
  it("falls back to the card subtitle as the model when base-model-label is empty", () => {
    const adapter = new TestSchadeautosAdapter({ sourceId: "test" });
    const html = `<a class="schadeautos-card" data-make-label="Peugeot" data-base-model-label="" href="/auto/peugeot-123">
      <div class="schadeautos-card__title">Peugeot</div>
      <div class="schadeautos-card__subtitle">1.6 THP Automaat Navi Led...</div>
    </a>`;

    const listings = adapter.exposeParseFromDataAttributes(
      html,
      SELECTORS,
      "https://www.auto-didact.nl"
    );

    expect(listings).toHaveLength(1);
    expect(listings[0].title).toBe("Peugeot 1.6 THP Automaat Navi Led...");
    expect(listings[0].description).toBe("1.6 THP Automaat Navi Led...");
  });

  it("uses the base-model-label when present", () => {
    const adapter = new TestSchadeautosAdapter({ sourceId: "test" });
    const html = `<a class="schadeautos-card" data-make-label="Peugeot" data-base-model-label="508" href="/auto/peugeot-508">
      <div class="schadeautos-card__title">Peugeot</div>
      <div class="schadeautos-card__subtitle">1.6 THP Automaat Navi Led...</div>
    </a>`;

    const listings = adapter.exposeParseFromDataAttributes(
      html,
      SELECTORS,
      "https://www.auto-didact.nl"
    );

    expect(listings).toHaveLength(1);
    expect(listings[0].title).toBe("Peugeot 508");
  });
});
