import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-seed-token");
  if (!process.env.SEED_TOKEN || token !== process.env.SEED_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.scraperSource.updateMany({
      where: {
        baseUrl: { contains: "auto-didact.nl" },
      },
      data: {
        adapterType: "schadeautos",
        selectors: {
          listingContainer: "a.schadeautos-card",
          title: ".schadeautos-card__title",
          price: ".schadeautos-card__price",
          year: ".schadeautos-card__footer .schadeautos-card__stat:nth-child(1) span",
          mileage: ".schadeautos-card__footer .schadeautos-card__stat:nth-child(3) span",
          damageStatus: "",
          description: ".schadeautos-card__subtitle",
          imageUrl: ".schadeautos-card__image",
          link: "a.schadeautos-card",
          nextPage: ".schadeautos-pagination__nav--next",
        },
      },
    });

    return NextResponse.json({ ok: true, updated: result.count });
  } catch (error) {
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
