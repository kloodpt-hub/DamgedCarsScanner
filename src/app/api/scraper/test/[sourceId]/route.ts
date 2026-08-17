import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";
import * as cheerio from "cheerio";

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

    // Step 1: Fetch HTML first (sequential, no race condition)
    const fetchHtml = (adapter as unknown as { fetchHtmlPreview(url: string): Promise<string> }).fetchHtmlPreview.bind(adapter);
    const htmlPreview = await fetchHtml(source.baseUrl);

    // Step 2: Parse with cheerio to diagnose selector matching
    let cheerioDiagnostics: Record<string, unknown> = {};
    if (!htmlPreview.startsWith("ERROR:") && htmlPreview.length > 500) {
      const $ = cheerio.load(htmlPreview);
      // Find listing containers based on adapter type
      const containerSelectors: Record<string, string> = {
        "schadeauto-zoeker": "div.object3",
        "schadeautos-nl": "div[data-href].flexitem.car",
        "autoscout24": "[data-testid='list-item']",
        debels: ".list-item",
      };
      const containerSel = containerSelectors[source.adapterType] || "div.object3";
      const containerCount = $(containerSel).length;

      // Check inner selectors for first container
      const firstEl = $(containerSel).first();
      const innerSelectors: Record<string, string[]> = {
        "schadeauto-zoeker": ["p.merk", "p.type", "div.foto > a > img", "div.foto > a[href]", "span.fltlt"],
        "schadeautos-nl": ["h2 a", "p.model-type", ".car-image img", '[title="ERD"]', '[title="mileage"]'],
      };
      const inners = (innerSelectors[source.adapterType] || []).map((sel) => ({
        selector: sel,
        count: firstEl.find(sel).length,
        text: firstEl.find(sel).first().text().trim().slice(0, 80),
      }));

      cheerioDiagnostics = {
        containerSelector: containerSel,
        containerCount,
        firstContainerInnerSelectors: inners,
        htmlLength: htmlPreview.length,
        firstContainerHtml: firstEl.length > 0 ? firstEl.toString().slice(0, 500) : "none",
      };
    }

    // Step 3: Actually run scrape (separately)
    const listings = await adapter.scrape(source.baseUrl, source.selectors as never);

    return NextResponse.json({
      listingsCount: listings.length,
      firstListing: listings[0] ?? null,
      htmlPreviewLength: htmlPreview.length,
      htmlPreviewStarts: htmlPreview.slice(0, 300),
      cheerioDiagnostics,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
