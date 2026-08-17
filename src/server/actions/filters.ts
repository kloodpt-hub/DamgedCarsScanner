"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateListing } from "@/lib/filters/evaluator";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const BATCH_SIZE = 50;

// Sync flow: createFilter/updateFilter write to DB via Prisma, then call
// matchExistingListings to retroactively link listings. The client-side
// filters page re-fetches from /api/filters (which reads from DB). The
// Telegram /filters command also reads directly from DB via Prisma.
// revalidatePath is added defensively to ensure Next.js cache is busted.
async function matchExistingListings(filterId: string, userId: string) {
  const filter = await prisma.filter.findUnique({ where: { id: filterId } });
  if (!filter) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const whereClause = { isSold: false, createdAt: { gte: user.createdAt } };

  const totalListings = await prisma.listing.count({ where: whereClause });
  for (let skip = 0; skip < totalListings; skip += BATCH_SIZE) {
    const listings = await prisma.listing.findMany({
      skip,
      take: BATCH_SIZE,
      orderBy: { createdAt: "desc" },
      where: whereClause,
    });

    const matchingIds = listings
      .filter((listing) => evaluateListing(listing, [filter]).length > 0)
      .map((listing) => listing.id);

    if (matchingIds.length > 0) {
      await prisma.filter.update({
        where: { id: filterId },
        data: {
          listings: {
            connect: matchingIds.map((id) => ({ id })),
          },
        },
      });
    }
  }
}

const createFilterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  minYear: z.number().int().min(1900).max(2100).optional(),
  maxYear: z.number().int().min(1900).max(2100).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  priceType: z.enum(["any", "gross", "net"]).optional(),
  damageStatus: z.string().optional(),
  excludedKeywords: z.array(z.string()).optional(),
  minMileage: z.number().min(0).optional(),
  maxMileage: z.number().min(0).optional(),
  sourceIds: z.array(z.string()).optional(),
  excludeHeavyDamage: z.boolean().optional(),
  brands: z.array(z.string()).optional(),
});

const updateFilterSchema = createFilterSchema.partial();

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Authentication required");
  }
  return session;
}

export async function getAllFilters() {
  const session = await requireAuth();

  return prisma.filter.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createFilter(data: {
  name: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  priceType?: "any" | "gross" | "net";
  damageStatus?: string;
  excludedKeywords?: string[];
  minMileage?: number;
  maxMileage?: number;
  sourceIds?: string[];
  excludeHeavyDamage?: boolean;
  brands?: string[];
}) {
  const session = await requireAuth();
  const validated = createFilterSchema.parse(data);

  const filter = await prisma.filter.create({
    data: {
      ...validated,
      userId: session.user.id,
    },
  });

  await matchExistingListings(filter.id, session.user.id);
  revalidatePath("/dashboard");

  return { success: true, filter };
}

export async function updateFilter(
  id: string,
  data: {
    name?: string;
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    priceType?: "any" | "gross" | "net";
    damageStatus?: string;
    excludedKeywords?: string[];
    minMileage?: number;
    maxMileage?: number;
    sourceIds?: string[];
    excludeHeavyDamage?: boolean;
    brands?: string[];
  }
) {
  const session = await requireAuth();
  const validated = updateFilterSchema.parse(data);

  const filter = await prisma.filter.update({
    where: { id, userId: session.user.id },
    data: validated,
  });

  await prisma.filter.update({
    where: { id },
    data: { listings: { set: [] } },
  });

  await matchExistingListings(id, session.user.id);
  revalidatePath("/dashboard");

  return { success: true, filter };
}

export async function deleteFilter(id: string) {
  const session = await requireAuth();

  await prisma.filter.update({
    where: { id, userId: session.user.id },
    data: { isActive: false },
  });

  return { success: true };
}
