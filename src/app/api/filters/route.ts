import { NextRequest, NextResponse } from "next/server";
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
  sourceIds: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = await prisma.filter.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(filters);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createFilterSchema.parse(body);

    const filter = await prisma.filter.create({
      data: {
        ...validated,
        userId: session.user.id,
      },
    });

    return NextResponse.json(filter, { status: 201 });
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
