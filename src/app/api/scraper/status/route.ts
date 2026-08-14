import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  const jobs = await prisma.scraperJob.findMany({
    include: { source: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(jobs);
}
