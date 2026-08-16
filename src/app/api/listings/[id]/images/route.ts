import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fetchAllImages } from "@/lib/scraper/image-fetcher";

const cache = new Map<string, { images: string[]; fetchedAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const cached = cache.get(id);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return NextResponse.json({ images: cached.images });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { canonicalUrl: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const images = await fetchAllImages(listing.canonicalUrl);

    cache.set(id, { images, fetchedAt: Date.now() });

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
