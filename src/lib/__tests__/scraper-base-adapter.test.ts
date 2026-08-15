import { describe, it, expect } from "vitest";
import { BaseAdapter } from "@/lib/scraper/base-adapter";
import type { RawListing, ScraperSelectors } from "@/lib/scraper/types";

class TestAdapter extends BaseAdapter {
  name = "test-adapter";

  async scrape(
    _url: string,
    _selectors: ScraperSelectors
  ): Promise<RawListing[]> {
    return [];
  }

  exposeGenerateExternalId(url: string, sourceId: string): string {
    return this.generateExternalId(url, sourceId);
  }

  exposeSourceIdForExternalId(sourceUrl: string): string {
    return this.sourceIdForExternalId(sourceUrl);
  }

  exposeIsDeadlineExceeded(): boolean {
    return this.isDeadlineExceeded();
  }
}

describe("BaseAdapter", () => {
  it("namespaces generated external IDs by sourceId", () => {
    const adapter = new TestAdapter();
    const idA = adapter.exposeGenerateExternalId(
      "https://example.com/car/1",
      "src-a"
    );
    const idB = adapter.exposeGenerateExternalId(
      "https://example.com/car/1",
      "src-b"
    );
    expect(idA).not.toBe(idB);
  });

  it("generates deterministic external IDs for the same url + sourceId", () => {
    const adapter = new TestAdapter();
    const id1 = adapter.exposeGenerateExternalId(
      "https://example.com/car/1",
      "src-a"
    );
    const id2 = adapter.exposeGenerateExternalId(
      "https://example.com/car/1",
      "src-a"
    );
    expect(id1).toBe(id2);
  });

  it("defaults sourceIdForExternalId to the adapter name", () => {
    const adapter = new TestAdapter();
    expect(adapter.exposeSourceIdForExternalId("https://anything.example")).toBe(
      "test-adapter"
    );
  });

  it("reports the deadline as exceeded when it is in the past", () => {
    const adapter = new TestAdapter({
      deadline: new Date(Date.now() - 60_000),
    });
    expect(adapter.exposeIsDeadlineExceeded()).toBe(true);
  });

  it("does not report the deadline as exceeded when there is no deadline", () => {
    const adapter = new TestAdapter();
    expect(adapter.exposeIsDeadlineExceeded()).toBe(false);
  });

  it("does not report the deadline as exceeded when it is in the future", () => {
    const adapter = new TestAdapter({
      deadline: new Date(Date.now() + 60_000),
    });
    expect(adapter.exposeIsDeadlineExceeded()).toBe(false);
  });

  it("accepts a custom sourceId in the constructor options", () => {
    const adapter = new TestAdapter({ sourceId: "custom" });
    expect((adapter as unknown as { sourceId: string | null }).sourceId).toBe(
      "custom"
    );
  });
});
