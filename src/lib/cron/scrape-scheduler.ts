import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";

const SCRAPE_INTERVAL_MS = 60 * 1000; // 60 seconds
let scrapeTimer: ReturnType<typeof setInterval> | null = null;
let running = false;

export function startScrapeScheduler(): void {
  if (scrapeTimer) return; // already running
  if (process.env.NODE_ENV !== "production") return; // only in production

  const engine = new ScraperEngine(prisma);

  const tick = async () => {
    if (running) return; // skip tick if a run is still in progress
    running = true;

    try {
      const results = await engine.runDueJobs();
      const scraped = results.filter((r) => r.status === "completed").length;
      const failed = results.filter((r) => r.status === "failed").length;
      const skipped = results.filter((r) => r.status === "skipped").length;
      const newListings = results.reduce((sum, r) => sum + r.newListings, 0);
      console.log(
        `[scrape-scheduler] runDueJobs: scraped=${scraped} failed=${failed} skipped=${skipped} newListings=${newListings} at ${new Date().toISOString()}`
      );
    } catch (err) {
      console.error(
        "[scrape-scheduler] runDueJobs failed:",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      running = false;
    }
  };

  scrapeTimer = setInterval(tick, SCRAPE_INTERVAL_MS);
  console.log(`[scrape-scheduler] Started, checking every ${SCRAPE_INTERVAL_MS / 1000} seconds`);
}

export function stopScrapeScheduler(): void {
  if (scrapeTimer) {
    clearInterval(scrapeTimer);
    scrapeTimer = null;
  }
}

// Auto-start in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  startScrapeScheduler();
}
