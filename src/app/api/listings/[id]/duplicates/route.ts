import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { findDuplicates } from "@/lib/dedup/duplicate-detector";

const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

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
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { source: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const duplicates = await findDuplicates(prisma, listing);

  const result = {
    duplicates: duplicates.map((d) => ({
      id: d.id,
      title: d.title,
      price: d.price,
      year: d.year,
      mileage: d.mileage,
      make: d.make,
      model: d.model,
      sourceId: d.sourceId,
      canonicalUrl: d.canonicalUrl,
    })),
  };

  cache.set(id, { data: result, fetchedAt: Date.now() });

  return NextResponse.json(result);
}
