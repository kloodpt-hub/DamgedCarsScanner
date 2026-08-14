"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  adapterType: z.string().default("generic"),
  selectors: z.record(z.string()),
  isActive: z.boolean().default(true),
  scrapeIntervalMinutes: z.number().int().min(1).default(60),
});

const updateSourceSchema = createSourceSchema.partial();

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getAllSources() {
  await requireAdmin();
  return prisma.scraperSource.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getSource(id: string) {
  await requireAdmin();
  return prisma.scraperSource.findUnique({
    where: { id },
    include: { _count: { select: { listings: true } } },
  });
}

export async function createSource(data: {
  name: string;
  baseUrl: string;
  adapterType?: string;
  selectors: Record<string, string>;
  isActive?: boolean;
  scrapeIntervalMinutes?: number;
}) {
  await requireAdmin();
  const validated = createSourceSchema.parse(data);

  const source = await prisma.scraperSource.create({
    data: validated,
  });

  revalidatePath("/admin/sources");
  return { success: true, source };
}

export async function updateSource(
  id: string,
  data: {
    name?: string;
    baseUrl?: string;
    adapterType?: string;
    selectors?: Record<string, string>;
    isActive?: boolean;
    scrapeIntervalMinutes?: number;
  }
) {
  await requireAdmin();
  const validated = updateSourceSchema.parse(data);

  const source = await prisma.scraperSource.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/admin/sources");
  return { success: true, source };
}

export async function deleteSource(id: string) {
  await requireAdmin();

  await prisma.scraperSource.delete({ where: { id } });

  revalidatePath("/admin/sources");
  return { success: true };
}
