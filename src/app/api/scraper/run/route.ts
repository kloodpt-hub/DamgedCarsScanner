import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScraperEngine } from "@/lib/scraper/engine";
import { checkCsrf } from "@/lib/csrf";
import { z } from "zod";

const runSchema = z.object({
  sourceId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sourceId } = runSchema.parse(body);

    const engine = new ScraperEngine(prisma);

    if (sourceId) {
      const result = await engine.runJob(sourceId);
      return NextResponse.json(result);
    }

    const results = await engine.runAllActiveJobs();
    const total = results.reduce((a, r) => a + r.listingsFound, 0);
    const newListings = results.reduce((a, r) => a + r.newListings, 0);
    return NextResponse.json({ listingsFound: total, newListings, results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
