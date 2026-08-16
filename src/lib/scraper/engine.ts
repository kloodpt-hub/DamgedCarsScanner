import { PrismaClient } from "@prisma/client";
import { GenericAdapter } from "./generic-adapter";
import { LeboncoinAdapter } from "./leboncoin.adapter";
import { Autoscout24Adapter } from "./autoscout24.adapter";
import { SchadeautosAdapter } from "./schadeautos.adapter";
import { DebelsAdapter } from "./debels.adapter";
import { SchadeautoZoekerAdapter } from "./schadeauto-zoeker.adapter";
import { SchadeautosNlAdapter } from "./schadeautos-nl.adapter";
import { AutosMotosAdapter } from "./autos-motos.adapter";
import { DidierAdapter } from "./didier.adapter";
import { DsmAdapter } from "./dsm.adapter";
import type { BaseAdapterOptions } from "./base-adapter";
import type { ScraperAdapter, ScraperJobResult, ScraperSelectors } from "./types";
import { evaluateListing } from "../filters/evaluator";
import { notifyNewListing } from "../notifications";
import { findDuplicates } from "../dedup/duplicate-detector";
import { getDueSources, markSourceScraped, releaseStaleLocks } from "../cron/scheduler";

const JOB_DEADLINE_MS = 5 * 60 * 1000;

const ADAPTERS: Record<string, (options?: BaseAdapterOptions) => ScraperAdapter> = {
  generic: (o) => new GenericAdapter(o),
  leboncoin: (o) => new LeboncoinAdapter(o),
  autoscout24: (o) => new Autoscout24Adapter(o),
  schadeautos: (o) => new SchadeautosAdapter(o),
  debels: (o) => new DebelsAdapter(o),
  "schadeauto-zoeker": (o) => new SchadeautoZoekerAdapter(o),
  "schadeautos-nl": (o) => new SchadeautosNlAdapter(o),
  "autos-motos": (o) => new AutosMotosAdapter(o),
  didier: (o) => new DidierAdapter(o),
  dsm: (o) => new DsmAdapter(o),
};

export interface ScrapeResult {
  sourceId: string;
  sourceName: string;
  status: "completed" | "failed" | "skipped";
  listingsFound: number;
  newListings: number;
  errors: string[];
}

export class ScraperEngine {
  constructor(private prisma: PrismaClient) {}

  getAdapter(adapterType: string, options?: BaseAdapterOptions): ScraperAdapter {
    const factory = ADAPTERS[adapterType] ?? ADAPTERS.generic;
    return factory(options);
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

    if (
      source.isScraping &&
      source.isScrapingLockedAt &&
      Date.now() - source.isScrapingLockedAt.getTime() < JOB_DEADLINE_MS
    ) {
      return { listingsFound: 0, newListings: 0, errors: [], skipped: true };
    }

    const job = await this.prisma.scraperJob.create({
      data: {
        sourceId: source.id,
        status: "running",
        startedAt: new Date(),
      },
    });

    try {
      await this.prisma.scraperSource.update({
        where: { id: source.id },
        data: { isScraping: true, isScrapingLockedAt: new Date() },
      });
    } catch (err) {
      console.warn(
        `[engine] Failed to set scrape lock for source ${source.id}:`,
        err instanceof Error ? err.message : String(err)
      );
    }

    try {
      const adapter = this.getAdapter(source.adapterType, {
        sourceId: source.id,
        deadline: new Date(Date.now() + JOB_DEADLINE_MS),
      });
      const selectors = source.selectors as unknown as ScraperSelectors;

      const rawListings = await adapter.scrape(source.baseUrl, selectors);
      const availableListings = rawListings.filter((l) => !l.isSold);
      console.log(
        `[engine] ${source.name}: ${rawListings.length} raw, ${availableListings.length} available (${rawListings.length - availableListings.length} sold)`
      );
      listingsFound = availableListings.length;

      if (rawListings.length === 0) {
        console.warn(
          `[engine] ${source.name}: 0 listings from ${source.baseUrl} — check selectors or anti-bot`
        );
      }

      const activeFilters = await this.prisma.filter.findMany({
        where: { isActive: true },
      });

      const relevantFilters = activeFilters.filter((f) => {
        if (!f.sourceIds || f.sourceIds.length === 0) return true;
        return f.sourceIds.includes(source.id);
      });

      for (const raw of rawListings) {
        try {
          if (raw.isSold) {
            await this.prisma.listing.deleteMany({
              where: { externalId: raw.externalId },
            });
            continue;
          }

          const existing = await this.prisma.listing.findUnique({
            where: { externalId: raw.externalId },
          });

          const listing = await this.prisma.listing.upsert({
            where: { externalId: raw.externalId },
            create: {
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
              isSold: raw.isSold ?? false,
              make: raw.make ?? null,
              model: raw.model ?? null,
            },
            update: {
              price: raw.price,
              year: raw.year,
              mileage: raw.mileage,
              damageStatus: raw.damageStatus,
              description: raw.description,
              imageUrl: raw.imageUrl,
              images: raw.images,
              canonicalUrl: raw.canonicalUrl,
              isSold: raw.isSold ?? false,
              make: raw.make ?? undefined,
              model: raw.model ?? undefined,
            },
          });

          if (raw.isSold) continue;

          if (existing) continue;

          newListings++;

          try {
            const duplicates = await findDuplicates(this.prisma, listing);
            if (duplicates.length > 0) {
              console.log(
                `[engine] Found ${duplicates.length} duplicate(s) for new listing ${raw.externalId}`
              );
            }
          } catch (err) {
            console.warn(
              `[engine] Duplicate detection failed for ${raw.externalId}:`,
              err instanceof Error ? err.message : String(err)
            );
          }

          const matchedFilters = evaluateListing(listing, relevantFilters);
          if (matchedFilters.length > 0) {
            await this.prisma.listing.update({
              where: { id: listing.id },
              data: {
                matchedFilters: {
                  connect: matchedFilters.map((f) => ({ id: f.id })),
                },
              },
            });

            await notifyNewListing(
              { ...listing, sourceId: source.id },
              matchedFilters
            );
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
    } finally {
      try {
        await markSourceScraped(this.prisma, source.id);
        await this.prisma.scraperSource.update({
          where: { id: source.id },
          data: { isScraping: false, isScrapingLockedAt: null },
        });
      } catch (err) {
        console.warn(
          `[engine] Failed to release scrape lock for source ${source.id}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    return { listingsFound, newListings, errors };
  }

  async runAllActiveJobs(): Promise<ScrapeResult[]> {
    await releaseStaleLocks(this.prisma);

    const sources = await this.prisma.scraperSource.findMany({
      where: { isActive: true },
    });

    const results: ScrapeResult[] = [];

    for (const source of sources) {
      const result = await this.runJob(source.id);
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        status: result.skipped ? "skipped" : result.errors.length > 0 ? "failed" : "completed",
        listingsFound: result.listingsFound,
        newListings: result.newListings,
        errors: result.errors,
      });
    }

    return results;
  }

  async runDueJobs(): Promise<ScrapeResult[]> {
    const released = await releaseStaleLocks(this.prisma);
    if (released > 0) {
      console.log(`[engine] Released ${released} stale scrape locks`);
    }

    const sources = await getDueSources(this.prisma);
    const results: ScrapeResult[] = [];

    for (const source of sources) {
      const result = await this.runJob(source.id);
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        status: result.skipped ? "skipped" : result.errors.length > 0 ? "failed" : "completed",
        listingsFound: result.listingsFound,
        newListings: result.newListings,
        errors: result.errors,
      });
    }

    return results;
  }
}
