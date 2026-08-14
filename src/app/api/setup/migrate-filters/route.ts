import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateListing } from "@/lib/filters/evaluator";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-seed-token");
  if (!process.env.SEED_TOKEN || token !== process.env.SEED_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filters = await prisma.filter.findMany({
      where: { isActive: true },
    });

    const listings = await prisma.listing.findMany();

    let totalConnections = 0;

    for (const filter of filters) {
      const matchingListings = listings.filter(
        (listing) => evaluateListing(listing, [filter]).length > 0
      );

      if (matchingListings.length > 0) {
        await prisma.filter.update({
          where: { id: filter.id },
          data: {
            listings: {
              connect: matchingListings.map((l) => ({ id: l.id })),
            },
          },
        });
        totalConnections += matchingListings.length;
      }
    }

    return NextResponse.json({
      ok: true,
      filters: filters.length,
      listings: listings.length,
      connections: totalConnections,
    });
  } catch (error) {
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
