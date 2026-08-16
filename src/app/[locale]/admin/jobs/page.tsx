import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { JobsClientBar } from "./JobsClientBar";

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sourceId?: string; status?: string }>;
}) {
  const { locale = "en" } = await params;
  const { sourceId, status } = await searchParams;
  const t = await getDictionary(locale as Locale);

  const where: Record<string, unknown> = {};
  if (sourceId) where.sourceId = sourceId;
  if (status) where.status = status;

  const [jobs, sources] = await Promise.all([
    prisma.scraperJob.findMany({
      where,
      include: { source: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.scraperSource.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]) as [
    Array<{
      id: string;
      status: string;
      listingsFound: number;
      newListings: number;
      startedAt: Date | null;
      completedAt: Date | null;
      createdAt: Date;
      source: { name: string };
    }>,
    Array<{ id: string; name: string }>,
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "warning" | "destructive" | "default"; label: string }> = {
      completed: { variant: "success", label: t.jobs.completed },
      pending: { variant: "warning", label: t.jobs.pending },
      running: { variant: "default", label: t.jobs.running },
      failed: { variant: "destructive", label: t.jobs.failed },
    };
    return map[status] ?? { variant: "default" as const, label: status };
  };

  const duration = (job: { startedAt: Date | null; completedAt: Date | null }) => {
    if (!job.startedAt || !job.completedAt) return "-";
    const diff = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    const secs = Math.round(diff / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-12" />}>
        <JobsClientBar
          locale={locale}
          sources={sources}
          currentSourceId={sourceId}
          currentStatus={status}
          hasRunning={jobs.some((j) => j.status === "running" || j.status === "pending")}
        />
      </Suspense>

      <div className="rounded-[1.75rem] bg-surface/70 p-1.5 ring-1 ring-border/40">
        <Card className="shadow-none">
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-text-muted text-sm py-8 text-center">
                {t.common.noData}
              </p>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.nav.sources}</TableHead>
                        <TableHead>{t.jobs.jobStatus}</TableHead>
                        <TableHead>{t.jobs.listingsFound}</TableHead>
                        <TableHead>{t.jobs.newListings}</TableHead>
                        <TableHead>{t.jobs.startedAt}</TableHead>
                        <TableHead>{t.jobs.completedAt}</TableHead>
                        <TableHead>{t.jobs.duration}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => {
                        const badge = statusBadge(job.status);
                        return (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium text-text">
                              {job.source.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </TableCell>
                            <TableCell className="text-text">{job.listingsFound}</TableCell>
                            <TableCell className="text-text">{job.newListings}</TableCell>
                            <TableCell className="text-text-muted">
                              {job.startedAt ? formatDateTime(job.startedAt, locale) : "-"}
                            </TableCell>
                            <TableCell className="text-text-muted">
                              {job.completedAt ? formatDateTime(job.completedAt, locale) : "-"}
                            </TableCell>
                            <TableCell className="text-text-muted">
                              {duration(job)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-3">
                  {jobs.map((job) => {
                    const badge = statusBadge(job.status);
                    return (
                      <div
                        key={job.id}
                        className="rounded-2xl border border-card-border bg-card-bg p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-text truncate">
                            {job.source.name}
                          </p>
                          <Badge variant={badge.variant} className="shrink-0">
                            {badge.label}
                          </Badge>
                        </div>
                        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <dt className="text-xs text-text-muted">
                              {t.jobs.listingsFound}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-text">
                              {job.listingsFound}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-text-muted">
                              {t.jobs.newListings}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-text">
                              {job.newListings}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-text-muted">
                              {t.jobs.duration}
                            </dt>
                            <dd className="mt-0.5 font-medium text-text">
                              {duration(job)}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-3 space-y-1 text-xs text-text-muted">
                          <p>
                            {t.jobs.startedAt}:{" "}
                            {job.startedAt ? formatDateTime(job.startedAt, locale) : "-"}
                          </p>
                          <p>
                            {t.jobs.completedAt}:{" "}
                            {job.completedAt ? formatDateTime(job.completedAt, locale) : "-"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
