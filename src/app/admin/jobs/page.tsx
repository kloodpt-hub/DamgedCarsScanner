import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
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
  params: Promise<{ locale?: string }>;
  searchParams: Promise<{ sourceId?: string; status?: string }>;
}) {
  const { locale = "en" } = await params;
  const { sourceId, status } = await searchParams;
  const t = await getDictionary(locale as Locale);
  const isRtl = locale === "ar";

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
      completed: { variant: "success", label: isRtl ? "مكتمل" : "Completed" },
      pending: { variant: "warning", label: isRtl ? "قيد الانتظار" : "Pending" },
      running: { variant: "default", label: isRtl ? "قيد التنفيذ" : "Running" },
      failed: { variant: "destructive", label: isRtl ? "فشل" : "Failed" },
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
      <JobsClientBar
        locale={locale}
        sources={sources}
        currentSourceId={sourceId}
        currentStatus={status}
        hasRunning={jobs.some((j) => j.status === "running" || j.status === "pending")}
      />

      <Card>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">
              {t.common.noData}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "المصدر" : "Source"}</TableHead>
                  <TableHead>{t.jobs.jobStatus}</TableHead>
                  <TableHead>{t.jobs.listingsFound}</TableHead>
                  <TableHead>{t.jobs.newListings}</TableHead>
                  <TableHead>{t.jobs.startedAt}</TableHead>
                  <TableHead>{t.jobs.completedAt}</TableHead>
                  <TableHead>{isRtl ? "المدة" : "Duration"}</TableHead>
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
                        {job.startedAt ? formatDate(job.startedAt, locale) : "-"}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {job.completedAt ? formatDate(job.completedAt, locale) : "-"}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {duration(job)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
