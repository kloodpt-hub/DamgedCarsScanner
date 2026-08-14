import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const engine = new ScraperEngine(prisma);
    const results = await engine.runDueJobs();

    const scraped = results.filter((r) => r.status === "completed");
    const failed = results.filter((r) => r.status === "failed");
    const totalListings = results.reduce((sum, r) => sum + r.listingsFound, 0);
    const newListings = results.reduce((sum, r) => sum + r.newListings, 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        scraped: scraped.length,
        failed: failed.length,
        totalListings,
        newListings,
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
