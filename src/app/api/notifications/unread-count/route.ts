import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const notifiedWhere = {
    isNotified: true,
    isSold: false,
    matchedFilters: { some: { userId } },
  };

  const unreadCount = await prisma.listing.count({
    where: {
      ...notifiedWhere,
      NOT: { readBy: { some: { userId } } },
    },
  });

  const recent = await prisma.listing.findMany({
    where: notifiedWhere,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      source: { select: { name: true } },
      readBy: { where: { userId } },
    },
  });

  return NextResponse.json({
    unreadCount,
    recent: recent.map((listing) => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      year: listing.year,
      mileage: listing.mileage,
      damageStatus: listing.damageStatus,
      canonicalUrl: listing.canonicalUrl,
      imageUrl: listing.imageUrl,
      sourceName: listing.source.name,
      createdAt: listing.createdAt,
      isRead: listing.readBy.length > 0,
    })),
  });
}
