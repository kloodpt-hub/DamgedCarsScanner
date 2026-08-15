"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getAllListings(params: {
  page?: number;
  limit?: number;
  sourceId?: string;
  isRead?: boolean;
  search?: string;
}) {
  const session = await requireAuth();

  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 100);
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
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        source: true,
        matchedFilters: true,
        readBy: { where: { userId: session.user.id } },
      },
    });
  }

  return prisma.listing.findUnique({
    where: { id, matchedFilters: { some: { userId: session.user.id } } },
    include: {
      source: true,
      matchedFilters: { where: { userId: session.user.id } },
      readBy: { where: { userId: session.user.id } },
    },
  });
}

export async function markAsRead(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  try {
    // Verify the user has access to this listing (matched filter OR admin)
    if (session.user.role !== "ADMIN") {
      const listing = await prisma.listing.findUnique({
        where: { id },
        select: { id: true },
      });
      const hasAccess = await prisma.filter.findFirst({
        where: { userId, listings: { some: { id } } },
        select: { id: true },
      });
      if (!listing || !hasAccess) {
        throw new Error("Unauthorized");
      }
    } else {
      const listing = await prisma.listing.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!listing) {
        throw new Error("Unauthorized");
      }
    }

    await prisma.userListingRead.upsert({
      where: { userId_listingId: { userId, listingId: id } },
      create: { userId, listingId: id },
      update: { readAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      throw error;
    }
    throw new Error("Failed to mark as read");
  }
}

// NOTE: Used by the notification pipeline (server-side), which updates
// isNotified. Any authenticated user may mark a listing as notified.
export async function markAsNotified(id: string) {
  await requireAuth();

  try {
    await prisma.listing.update({
      where: { id },
      data: { isNotified: true },
    });
    return { success: true };
  } catch {
    throw new Error("Failed to mark as notified");
  }
}

export async function deleteListing(id: string) {
  await requireAdmin();
  return prisma.listing.delete({ where: { id } });
}
