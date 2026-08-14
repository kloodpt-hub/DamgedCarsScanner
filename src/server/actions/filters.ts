"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createFilterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  minYear: z.number().int().min(1900).max(2100).optional(),
  maxYear: z.number().int().min(1900).max(2100).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  damageStatus: z.string().optional(),
  excludedKeywords: z.array(z.string()).optional(),
  minMileage: z.number().min(0).optional(),
  maxMileage: z.number().min(0).optional(),
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
  damageStatus?: string;
  excludedKeywords?: string[];
  minMileage?: number;
  maxMileage?: number;
}) {
  const session = await requireAuth();
  const validated = createFilterSchema.parse(data);

  const filter = await prisma.filter.create({
    data: {
      ...validated,
      userId: session.user.id,
    },
  });

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
    damageStatus?: string;
    excludedKeywords?: string[];
    minMileage?: number;
    maxMileage?: number;
  }
) {
  const session = await requireAuth();
  const validated = updateFilterSchema.parse(data);

  const filter = await prisma.filter.update({
    where: { id, userId: session.user.id },
    data: validated,
  });

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
