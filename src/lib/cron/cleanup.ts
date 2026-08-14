import type { PrismaClient } from "@prisma/client";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function deleteOldListings(prisma: PrismaClient): Promise<number> {
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

  const deleted = await prisma.listing.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });

  console.log(`[cleanup] Deleted ${deleted.count} listings older than 7 days`);
  return deleted.count;
}
