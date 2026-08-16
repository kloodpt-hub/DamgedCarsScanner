import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.listing.findMany({
    where: { make: { not: null } },
    select: { make: true },
    distinct: ["make"],
    orderBy: { make: "asc" },
  });

  const brands = rows.map((r) => r.make!).filter(Boolean);
  return NextResponse.json(brands);
}
