import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";
import { deleteOldListings } from "@/lib/cron/cleanup";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const engine = new ScraperEngine(prisma);
    const results = await engine.runDueJobs();
    const deletedCount = await deleteOldListings(prisma);

    const scraped = results.filter((r) => r.status === "completed");
    const failed = results.filter((r) => r.status === "failed");
    const skipped = 0;
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
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
