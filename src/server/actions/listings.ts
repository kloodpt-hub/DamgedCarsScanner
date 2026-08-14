"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getAllListings(params: {
  page?: number;
  limit?: number;
  sourceId?: string;
  isRead?: boolean;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (session.user.role !== "ADMIN") {
    where.matchedFilters = { some: { userId: session.user.id } };
  }

  if (params.sourceId) {
    where.sourceId = params.sourceId;
  }

  if (params.isRead !== undefined) {
    where.isRead = params.isRead;
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
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

  return {
    listings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getListing(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: { source: true, matchedFilters: true },
  });
}

export async function markAsRead(id: string) {
  return prisma.listing.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAsNotified(id: string) {
  return prisma.listing.update({
    where: { id },
    data: { isNotified: true },
  });
}

export async function deleteListing(id: string) {
  return prisma.listing.delete({ where: { id } });
}
