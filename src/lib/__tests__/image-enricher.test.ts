import { describe, it, expect, vi, beforeEach } from "vitest";
import { enrichListingImages } from "@/lib/scraper/image-enricher";

vi.mock("@/lib/scraper/image-fetcher", () => ({
  fetchAllImages: vi.fn(),
}));

import { fetchAllImages } from "@/lib/scraper/image-fetcher";

const mockFetchAllImages = vi.mocked(fetchAllImages);

function createMockPrisma(listings: any[]) {
  return {
    listing: {
      findMany: vi.fn().mockResolvedValue(listings),
      update: vi.fn().mockResolvedValue({}),
    },
  } as any;
}

describe("enrichListingImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero counts when no listings need enrichment", async () => {
    const prisma = createMockPrisma([
      { id: "1", canonicalUrl: "http://example.com/1", images: ["a.jpg", "b.jpg"] },
      { id: "2", canonicalUrl: "http://example.com/2", images: ["c.jpg", "d.jpg", "e.jpg"] },
    ]);

    const result = await enrichListingImages(prisma);

    expect(result).toEqual({ enriched: 0, failed: 0, skipped: 0 });
    expect(mockFetchAllImages).not.toHaveBeenCalled();
  });

  it("enriches listings with 0 or 1 image", async () => {
    const prisma = createMockPrisma([
      { id: "1", canonicalUrl: "http://example.com/1", images: [] },
      { id: "2", canonicalUrl: "http://example.com/2", images: ["thumb.jpg"] },
    ]);

    mockFetchAllImages
      .mockResolvedValueOnce(["http://example.com/img1.jpg", "http://example.com/img2.jpg"])
      .mockResolvedValueOnce(["http://example.com/img3.jpg", "http://example.com/img4.jpg"]);

    const result = await enrichListingImages(prisma);

    expect(result.enriched).toBe(2);
    expect(result.failed).toBe(0);
    expect(prisma.listing.update).toHaveBeenCalledTimes(2);
  });

  it("preserves original thumbnail when not in new set", async () => {
    const prisma = createMockPrisma([
      { id: "1", canonicalUrl: "http://example.com/1", images: ["original.jpg"] },
    ]);

    mockFetchAllImages.mockResolvedValueOnce([
      "http://example.com/new1.jpg",
      "http://example.com/new2.jpg",
    ]);

    await enrichListingImages(prisma);

    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: {
        images: [
          "original.jpg",
          "http://example.com/new1.jpg",
          "http://example.com/new2.jpg",
        ],
      },
    });
  });

  it("does not duplicate original image if already in new set", async () => {
    const prisma = createMockPrisma([
      { id: "1", canonicalUrl: "http://example.com/1", images: ["http://example.com/new1.jpg"] },
    ]);

    mockFetchAllImages.mockResolvedValueOnce([
      "http://example.com/new1.jpg",
      "http://example.com/new2.jpg",
    ]);

    await enrichListingImages(prisma);

    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: {
        images: ["http://example.com/new1.jpg", "http://example.com/new2.jpg"],
      },
    });
  });

  it("counts failures when fetchAllImages throws", async () => {
    const prisma = createMockPrisma([
      { id: "1", canonicalUrl: "http://example.com/1", images: [] },
      { id: "2", canonicalUrl: "http://example.com/2", images: [] },
    ]);

    mockFetchAllImages
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(["http://example.com/img1.jpg", "http://example.com/img2.jpg"]);

    const result = await enrichListingImages(prisma);

    expect(result.enriched).toBe(1);
    expect(result.failed).toBe(1);
    expect(prisma.listing.update).toHaveBeenCalledTimes(1);
  });

  it("limits images to MAX_IMAGES (5)", async () => {
    const prisma = createMockPrisma([
      { id: "1", canonicalUrl: "http://example.com/1", images: [] },
    ]);

    const manyImages = Array.from({ length: 10 }, (_, i) => `http://example.com/img${i}.jpg`);
    mockFetchAllImages.mockResolvedValueOnce(manyImages);

    await enrichListingImages(prisma);

    const updateCall = prisma.listing.update.mock.calls[0][0];
    expect(updateCall.data.images.length).toBeLessThanOrEqual(5);
  });

  it("processes all listings needing enrichment up to batch size", async () => {
    const listings = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      canonicalUrl: `http://example.com/${i}`,
      images: i % 3 === 0 ? ["a.jpg", "b.jpg"] : [],
    }));
    const prisma = createMockPrisma(listings);

    mockFetchAllImages.mockResolvedValue(["http://example.com/img1.jpg", "http://example.com/img2.jpg"]);

    const result = await enrichListingImages(prisma);

    // 10 need enrichment (those with <=1 image), batch limit is 10
    expect(mockFetchAllImages).toHaveBeenCalledTimes(10);
    expect(result.enriched).toBe(10);
  }, 30000);

  it("skips listings when fetchAllImages returns 0 or 1 image", async () => {
    const prisma = createMockPrisma([
      { id: "1", canonicalUrl: "http://example.com/1", images: [] },
    ]);

    mockFetchAllImages.mockResolvedValueOnce(["http://example.com/single.jpg"]);

    const result = await enrichListingImages(prisma);

    expect(result.enriched).toBe(0);
    expect(prisma.listing.update).not.toHaveBeenCalled();
  });
});
