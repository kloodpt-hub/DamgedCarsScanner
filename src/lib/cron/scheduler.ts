import type { PrismaClient, ScraperSource } from "@prisma/client";

export function isDueForScraping(source: ScraperSource): boolean {
  if (!source.isActive) return false;
  if (!source.lastScrapedAt) return true;

  const now = new Date();
  const lastScraped = new Date(source.lastScrapedAt);
  const intervalMs = source.scrapeIntervalMinutes * 60 * 1000;

  return now.getTime() - lastScraped.getTime() >= intervalMs;
}

export function getNextRunTime(source: ScraperSource): Date | null {
  if (!source.isActive) return null;
  if (!source.lastScrapedAt) return new Date();

  const lastScraped = new Date(source.lastScrapedAt);
  return new Date(lastScraped.getTime() + source.scrapeIntervalMinutes * 60 * 1000);
}

export async function getDueSources(prisma: PrismaClient): Promise<ScraperSource[]> {
  return prisma.scraperSource.findMany({
    where: {
      isActive: true,
      OR: [
        { lastScrapedAt: null },
        {
          lastScrapedAt: {
            lte: new Date(Date.now() - 60 * 1000),
          },
        },
      ],
    },
  });
}

export async function markSourceScraped(
  prisma: PrismaClient,
  sourceId: string
): Promise<void> {
  await prisma.scraperSource.update({
    where: { id: sourceId },
    data: { lastScrapedAt: new Date() },
  });
}
