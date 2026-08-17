import { PrismaClient } from "@prisma/client";
import { fetchAllImages } from "./image-fetcher";

const ENRICH_BATCH_SIZE = 10;
const ENRICH_THROTTLE_MS = 2000;
const MAX_IMAGES = 5;

export async function enrichListingImages(prisma: PrismaClient): Promise<{
  enriched: number;
  failed: number;
  skipped: number;
}> {
  const listings = await prisma.listing.findMany({
    where: {
      isSold: false,
      canonicalUrl: { not: "" },
    },
    select: {
      id: true,
      canonicalUrl: true,
      images: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const needsEnrichment = listings
    .filter((l) => {
      const images = l.images ?? [];
      return images.length <= 1;
    })
    .slice(0, ENRICH_BATCH_SIZE);

  if (needsEnrichment.length === 0) {
    return { enriched: 0, failed: 0, skipped: 0 };
  }

  let enriched = 0;
  let failed = 0;

  for (let i = 0; i < needsEnrichment.length; i++) {
    const listing = needsEnrichment[i];
    try {
      const images = await fetchAllImages(listing.canonicalUrl);

      if (images.length > 1) {
        const originalImage = listing.images?.[0];
        const allImages = images.slice(0, MAX_IMAGES);

        if (originalImage && !allImages.includes(originalImage)) {
          allImages.unshift(originalImage);
          allImages.splice(MAX_IMAGES);
        }

        await prisma.listing.update({
          where: { id: listing.id },
          data: { images: allImages },
        });
        enriched++;
      }
    } catch (err) {
      console.warn(
        `[image-enricher] Failed to enrich listing ${listing.id}:`,
        err instanceof Error ? err.message : String(err)
      );
      failed++;
    }

    if (i < needsEnrichment.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, ENRICH_THROTTLE_MS));
    }
  }

  console.log(
    `[image-enricher] Enriched ${enriched}, failed ${failed}, total processed ${needsEnrichment.length}`
  );

  return { enriched, failed, skipped: listings.length - needsEnrichment.length };
}
