import type { PrismaClient, ScraperSource } from "@prisma/client";

export const SCRAPE_LOCK_DEADLINE_MS = 10 * 60 * 1000;

export const SCRAPE_INTERVAL_MINUTES = 5;

export function isDueForScraping(source: ScraperSource): boolean {
  if (!source.isActive) return false;
  if (!source.lastScrapedAt) return true;

  const now = new Date();
  const lastScraped = new Date(source.lastScrapedAt);
  const intervalMs = SCRAPE_INTERVAL_MINUTES * 60 * 1000;

  return now.getTime() - lastScraped.getTime() >= intervalMs;
}

export function getNextRunTime(source: ScraperSource): Date | null {
  if (!source.isActive) return null;
  if (!source.lastScrapedAt) return new Date();

  const lastScraped = new Date(source.lastScrapedAt);
  return new Date(lastScraped.getTime() + SCRAPE_INTERVAL_MINUTES * 60 * 1000);
}

export async function getDueSources(prisma: PrismaClient): Promise<ScraperSource[]> {
  const sources = await prisma.scraperSource.findMany({
    where: { isActive: true },
  });

  const now = Date.now();
  return sources.filter((source) => {
    if (
      source.isScraping &&
      source.isScrapingLockedAt &&
      now - new Date(source.isScrapingLockedAt).getTime() < SCRAPE_LOCK_DEADLINE_MS
    ) {
      return false;
    }

    if (!source.lastScrapedAt) return true;
    const lastScraped = new Date(source.lastScrapedAt).getTime();
    const intervalMs = SCRAPE_INTERVAL_MINUTES * 60 * 1000;
    return now - lastScraped >= intervalMs;
  });
}

export async function releaseStaleLocks(prisma: PrismaClient): Promise<number> {
  const now = Date.now();
  const sources = await prisma.scraperSource.findMany({
    where: { isActive: true, isScraping: true },
  });

  const stale = sources.filter(
    (source) =>
      source.isScrapingLockedAt &&
      now - new Date(source.isScrapingLockedAt).getTime() >= SCRAPE_LOCK_DEADLINE_MS
  );

  for (const source of stale) {
    await prisma.$transaction([
      prisma.scraperJob.updateMany({
        where: { sourceId: source.id, status: "running" },
        data: {
          status: "failed",
          errorMessage: "Stale lock released (process died mid-job)",
          completedAt: new Date(),
        },
      }),
      prisma.scraperSource.update({
        where: { id: source.id },
        data: { isScraping: false, isScrapingLockedAt: null },
      }),
    ]);
  }

  return stale.length;
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
