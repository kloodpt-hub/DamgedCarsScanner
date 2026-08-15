import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";
import { deleteOldListings } from "@/lib/cron/cleanup";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: Request) {
  // Fail-closed: if the secret is not configured, never allow.
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const engine = new ScraperEngine(prisma);
    const results = await engine.runDueJobs();
    const deletedCount = await deleteOldListings(prisma);

    const scraped = results.filter((r) => r.status === "completed");
    const failed = results.filter((r) => r.status === "failed");
    const skipped = results.filter((r) => r.status === "skipped").length;
    const totalListings = results.reduce((sum, r) => sum + r.listingsFound, 0);
    const newListings = results.reduce((sum, r) => sum + r.newListings, 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        scraped: scraped.length,
        failed: failed.length,
        skipped,
        totalListings,
        newListings,
        deletedListings: deletedCount,
      },
      results: results.map((r) => ({
        sourceId: r.sourceId,
        sourceName: r.sourceName,
        status: r.status,
        listingsFound: r.listingsFound,
        newListings: r.newListings,
        errors: r.errors,
      })),
    });
  } catch (error) {
    console.error("Cron scrape failed:", error);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}
