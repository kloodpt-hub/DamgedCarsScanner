"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";

const VALID_STATUSES = ["pending", "running", "completed", "failed"] as const;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getAllJobs(params: {
  page?: number;
  limit?: number;
  sourceId?: string;
  status?: string;
}) {
  const session = await requireAuth();

  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (session.user.role !== "ADMIN") {
    where.userId = session.user.id;
  }

  if (params.sourceId) {
    where.sourceId = params.sourceId;
  }

  if (
    params.status &&
    VALID_STATUSES.includes(params.status as (typeof VALID_STATUSES)[number])
  ) {
    where.status = params.status;
  }

  const [jobs, total] = await Promise.all([
    prisma.scraperJob.findMany({
      where,
      include: { source: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.scraperJob.count({ where }),
  ]);

  return {
    jobs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getJob(id: string) {
  const session = await requireAuth();

  const job = await prisma.scraperJob.findUnique({
    where: { id },
    include: { source: true },
  });

  if (!job) {
    throw new Error("Not found");
  }

  if (session.user.role !== "ADMIN" && job.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  return job;
}

export async function runJob(sourceId: string) {
  await requireAdmin();

  const engine = new ScraperEngine(prisma);
  const result = await engine.runJob(sourceId);

  return { success: true, result };
}

export async function runAllJobs() {
  await requireAdmin();

  const engine = new ScraperEngine(prisma);
  const results = await engine.runAllActiveJobs();

  return { success: true, results };
}
