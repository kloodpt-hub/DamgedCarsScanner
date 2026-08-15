// Background worker entrypoint — polls due scraper sources and runs scrape jobs.
// Runs outside Next.js (via tsx), so it uses relative imports and its own PrismaClient.
import { PrismaClient } from "@prisma/client";
import { ScraperEngine } from "./lib/scraper/engine";
import { deleteOldListings } from "./lib/cron/cleanup";

const POLL_INTERVAL_MS = 30_000;
const CLEANUP_EVERY_ITERATIONS = 30;

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("[worker] DATABASE_URL is not set. Exiting.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const engine = new ScraperEngine(prisma);
  let iterations = 0;

  console.log("[worker] Car Deals Hunter background worker started");
  console.log(`[worker] Polling due sources every ${POLL_INTERVAL_MS / 1000}s`);

  const runIteration = async () => {
    try {
      const results = await engine.runDueJobs();

      let totalListings = 0;
      let totalNew = 0;

      for (const result of results) {
        totalListings += result.listingsFound;
        totalNew += result.newListings;
        console.log(
          `[worker] Source "${result.sourceName}" (${result.sourceId}) -> status=${result.status}, listingsFound=${result.listingsFound}, newListings=${result.newListings}, errors=${result.errors.length}`
        );
        for (const error of result.errors) {
          console.error(`[worker]   error: ${error}`);
        }
      }

      console.log(
        `[worker] Run finished: ${results.length} source(s), ${totalListings} listings found, ${totalNew} new`
      );

      iterations += 1;
      if (iterations % CLEANUP_EVERY_ITERATIONS === 0) {
        const deleted = await deleteOldListings(prisma);
        console.log(`[worker] Cleanup run: deleted ${deleted} listings`);
      }
    } catch (err) {
      console.error(
        "[worker] Scrape iteration failed:",
        err instanceof Error ? (err.stack ?? err.message) : String(err)
      );
    }
  };

  await runIteration();
  const interval = setInterval(runIteration, POLL_INTERVAL_MS);

  const shutdown = async (signal: string) => {
    console.log(`[worker] Received ${signal}, shutting down`);
    clearInterval(interval);
    try {
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    console.error("[worker] Uncaught exception:", err instanceof Error ? (err.stack ?? err.message) : err);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[worker] Unhandled rejection:", reason instanceof Error ? (reason.stack ?? reason.message) : reason);
  });
}

void main();
