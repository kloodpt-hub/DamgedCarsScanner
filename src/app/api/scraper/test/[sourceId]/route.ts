import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sourceId } = await params;

    const source = await prisma.scraperSource.findUnique({
      where: { id: sourceId },
    });
    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const engine = new ScraperEngine(prisma);
    const adapter = engine.getAdapter(source.adapterType, {
      sourceId: source.id,
    });

    const [listings, htmlPreview] = await Promise.all([
      adapter.scrape(source.baseUrl, source.selectors as never),
      (adapter as unknown as { fetchHtmlPreview(url: string): Promise<string> }).fetchHtmlPreview(source.baseUrl),
    ]);

    return NextResponse.json({
      listingsCount: listings.length,
      firstListing: listings[0] ?? null,
      htmlPreview,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
