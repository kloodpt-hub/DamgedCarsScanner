import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const engine = new ScraperEngine(prisma);
    const results = await engine.runAllActiveJobs();

    const jobsRun = results.length;
    const totalListings = results.reduce((sum, r) => sum + r.listingsFound, 0);
    const newListings = results.reduce((sum, r) => sum + r.newListings, 0);

    return NextResponse.json({
      success: true,
      jobsRun,
      totalListings,
      newListings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
