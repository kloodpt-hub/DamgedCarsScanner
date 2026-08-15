import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  view: z.enum(["matched", "all"]).default("matched"),
  search: z.string().max(100).optional(),
  sourceId: z.string().optional(),
  read: z.enum(["read", "unread"]).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }
  const { page, limit, search, sourceId, read } = parsed.data;

  const isAdmin = session.user.role === "ADMIN";
  const effectiveView = isAdmin ? parsed.data.view : "matched";

  const skip = (page - 1) * limit;

  const where: Prisma.ListingWhereInput = {};

  where.isSold = false;

  if (effectiveView === "matched") {
    where.matchedFilters = { some: { userId: session.user.id } };
  }

  if (sourceId) {
    where.sourceId = sourceId;
  }

  if (read === "read") {
    where.readBy = { some: { userId: session.user.id } };
  } else if (read === "unread") {
    where.NOT = { readBy: { some: { userId: session.user.id } } };
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
