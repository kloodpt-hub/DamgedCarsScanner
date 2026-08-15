import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkCsrf } from "@/lib/csrf";
import { z } from "zod";

const createSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  adapterType: z.string().default("generic"),
  selectors: z.record(z.string()),
  isActive: z.boolean().default(true),
  scrapeIntervalMinutes: z.number().int().min(1).default(60),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = session.user.role === "ADMIN"
    ? {}
    : { isActive: true };

  const sources = await prisma.scraperSource.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sources);
}

export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createSourceSchema.parse(body);

    const source = await prisma.scraperSource.create({
      data: validated,
    });

    return NextResponse.json(source, { status: 201 });
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
