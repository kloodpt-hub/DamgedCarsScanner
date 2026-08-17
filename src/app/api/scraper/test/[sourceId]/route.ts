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

    // Step 1: Fetch HTML via adapter's protected fetchHtml
    let html = "";
    try {
      html = await (adapter as unknown as { fetchHtml(url: string): Promise<string> }).fetchHtml.bind(adapter)(source.baseUrl);
    } catch (err) {
      return NextResponse.json({
        error: `fetchHtml failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Step 2: Determine what selectors scrape() would use
    const dbSelectors = source.selectors as Record<string, string>;
    const defaultSelectors: Record<string, string> = {
      "schadeauto-zoeker": "div.object3",
      "schadeautos-nl": "div[data-href].flexitem.car",
    };
    const containerSel = (dbSelectors?.listingContainer) || defaultSelectors[source.adapterType] || "div.object3";

    // Step 3: Parse with cheerio — replicate what parseListings does
    const $ = cheerio.load(html);
    const containers = $(containerSel);
    const containerCount = containers.length;
    const perContainer: Array<{ index: number; title: string | null; link: string | null; titleSelector: string; linkSelector: string; skipped: string | null }> = [];

    containers.each((i, element) => {
      const $el = $(element);

      // extractTitle logic
      let title: string | null = null;
      const merk = $el.find("p.merk").first().text().trim();
      const type = $el.find("p.type").first().text().trim();
      const joined = [merk, type].filter(Boolean).join(" ").trim();
      if (joined) title = joined;

      // extractLink logic
      let link: string | null = null;
      const linkSelector = "div.foto > a[href]";
      const href = $el.find(linkSelector).first().attr("href");
      if (href) {
        try { link = new URL(href, source.baseUrl).href; } catch { /* skip */ }
      }

      let skipped: string | null = null;
      if (!title) skipped = "no title";
      else if (!link) skipped = "no link";

      if (perContainer.length < 3) {
        perContainer.push({ index: i, title, link, titleSelector: `merk="${merk}" type="${type}"`, linkSelector: `href="${href ?? "none"}"`, skipped });
      }
    });

    // Step 4: Also run scrape() for comparison
    const listings = await adapter.scrape(source.baseUrl, source.selectors as never);

    return NextResponse.json({
      htmlLength: html.length,
      adapterType: source.adapterType,
      containerSel,
      containerCount,
      scrapeResultCount: listings.length,
      perContainer,
      htmlPreview: html.slice(0, 200),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
