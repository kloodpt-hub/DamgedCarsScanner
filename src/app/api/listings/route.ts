import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const sourceId = searchParams.get("sourceId");
  const isRead = searchParams.get("isRead");
  const search = searchParams.get("search");
  const skip = (page - 1) * limit;

  const view = searchParams.get("view");
  const defaultView = session.user.role === "ADMIN" ? "all" : "matched";
  const effectiveView = view ?? defaultView;

  const where: Record<string, unknown> = {};

  if (effectiveView === "matched") {
    where.matchedFilters = { some: { userId: session.user.id } };
  }

  if (sourceId) {
    where.sourceId = sourceId;
  }

  if (isRead !== null && isRead !== "") {
    where.isRead = isRead === "true";
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { source: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
