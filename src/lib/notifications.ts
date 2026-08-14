import { prisma } from "./prisma";
import { sendListingAlert } from "./email";

export async function notifyNewListing(
  listing: {
    id: string;
    title: string;
    price: number | null;
    year: number | null;
    mileage: number | null;
    damageStatus: string | null;
    canonicalUrl: string;
    imageUrl: string | null;
    sourceId: string;
  },
  matchedFilters: { id: string; name: string; userId: string }[]
): Promise<void> {
  if (matchedFilters.length === 0) return;

  const userIds = [...new Set(matchedFilters.map((f) => f.userId))];
  const [users, source] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    }),
    prisma.scraperSource.findUnique({
      where: { id: listing.sourceId },
      select: { name: true },
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));

  for (const filter of matchedFilters) {
    const user = userMap.get(filter.userId);
    if (!user?.email) continue;

    await sendListingAlert(
      { email: user.email, name: user.name },
      { ...listing, source: source ?? { name: "Unknown" } },
      { name: filter.name }
    );
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: { isNotified: true },
  });
}
