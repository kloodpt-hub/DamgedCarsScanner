import { PrismaClient } from "@prisma/client";
import { GenericAdapter } from "./generic-adapter";
import { LeboncoinAdapter } from "./leboncoin.adapter";
import { Autoscout24Adapter } from "./autoscout24.adapter";
import type { ScraperAdapter, ScraperJobResult, ScraperSelectors } from "./types";
import { evaluateListing } from "../filters/evaluator";

const ADAPTERS: Record<string, () => ScraperAdapter> = {
  generic: () => new GenericAdapter(),
  leboncoin: () => new LeboncoinAdapter(),
  autoscout24: () => new Autoscout24Adapter(),
};

export class ScraperEngine {
  constructor(private prisma: PrismaClient) {}

  getAdapter(adapterType: string): ScraperAdapter {
    const factory = ADAPTERS[adapterType] ?? ADAPTERS.generic;
    return factory();
  }

  async runJob(sourceId: string): Promise<ScraperJobResult> {
    const errors: string[] = [];
    let listingsFound = 0;
    let newListings = 0;

    const source = await this.prisma.scraperSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return { listingsFound: 0, newListings: 0, errors: [`Source ${sourceId} not found`] };
    }

    if (!source.isActive) {
      return { listingsFound: 0, newListings: 0, errors: [`Source ${source.name} is inactive`] };
    }

    const job = await this.prisma.scraperJob.create({
      data: {
        sourceId: source.id,
        status: "running",
        startedAt: new Date(),
      },
    });

    try {
      const adapter = this.getAdapter(source.adapterType);
      const selectors = source.selectors as unknown as ScraperSelectors;

      const rawListings = await adapter.scrape(source.baseUrl, selectors);
      listingsFound = rawListings.length;

      const activeFilters = await this.prisma.filter.findMany({
        where: { isActive: true },
      });

      for (const raw of rawListings) {
        try {
          const existing = await this.prisma.listing.findUnique({
            where: { externalId: raw.externalId },
          });

          if (existing) continue;

          const listing = await this.prisma.listing.create({
            data: {
              externalId: raw.externalId,
              title: raw.title,
              price: raw.price,
              year: raw.year,
              mileage: raw.mileage,
              damageStatus: raw.damageStatus,
              description: raw.description,
              imageUrl: raw.imageUrl,
              images: raw.images,
              canonicalUrl: raw.canonicalUrl,
              sourceId: source.id,
            },
          });

          newListings++;

          const matchedFilters = evaluateListing(listing, activeFilters);
          if (matchedFilters.length > 0) {
            await this.prisma.listing.update({
              where: { id: listing.id },
              data: {
                matchedFilters: {
                  connect: matchedFilters.map((f) => ({ id: f.id })),
                },
              },
            });
          }
        } catch (err) {
          errors.push(`Failed to process listing ${raw.externalId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      await this.prisma.scraperJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          listingsFound,
          newListings,
          completedAt: new Date(),
        },
      });

      await this.prisma.scraperSource.update({
        where: { id: source.id },
        data: { lastScrapedAt: new Date() },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push(errorMessage);

      await this.prisma.scraperJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage,
          completedAt: new Date(),
        },
      });
    }

    return { listingsFound, newListings, errors };
  }

  async runAllActiveJobs(): Promise<ScraperJobResult[]> {
    const sources = await this.prisma.scraperSource.findMany({
      where: { isActive: true },
    });

    const results: ScraperJobResult[] = [];

    for (const source of sources) {
      const result = await this.runJob(source.id);
      results.push(result);
    }

    return results;
  }
}
