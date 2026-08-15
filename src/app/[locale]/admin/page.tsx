import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  Globe,
  FileText,
  Activity,
  CheckCircle,
} from "lucide-react";
import { RunAllButton } from "@/components/admin/RunAllButton";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = "en" } = await params;
  const t = await getDictionary(locale as Locale);
  const isRtl = locale === "ar";

  const [
    totalSources,
    activeSources,
    totalListings,
    totalJobs,
    completedJobs,
    recentJobs,
  ] = await Promise.all([
    prisma.scraperSource.count(),
    prisma.scraperSource.count({ where: { isActive: true } }),
    prisma.listing.count({ where: { isSold: false } }),
    prisma.scraperJob.count(),
    prisma.scraperJob.count({ where: { status: "completed" } }),
    prisma.scraperJob.findMany({
      include: { source: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]) as [number, number, number, number, number, Array<{
    id: string;
    status: string;
    listingsFound: number;
    newListings: number;
    createdAt: Date;
    source: { name: string };
  }>];

  const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

  const stats = [
    {
      label: isRtl ? "إجمالي المصادر" : "Total Sources",
      value: totalSources,
      sub: `${activeSources} ${isRtl ? "نشط" : "active"}`,
      icon: Globe,
      color: "text-primary",
    },
    {
      label: isRtl ? "الإعلانات النشطة" : "Active Listings",
      value: totalListings,
      sub: null,
      icon: FileText,
      color: "text-accent",
    },
    {
      label: isRtl ? "إجمالي المهام" : "Total Jobs",
      value: totalJobs,
      sub: null,
      icon: Activity,
      color: "text-warning",
    },
    {
      label: isRtl ? "نسبة النجاح" : "Success Rate",
      value: `${successRate}%`,
      sub: `${completedJobs}/${totalJobs}`,
      icon: CheckCircle,
      color: "text-success",
    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "warning" | "destructive" | "default" }> = {
      completed: { variant: "success" },
      pending: { variant: "warning" },
      running: { variant: "default" },
      failed: { variant: "destructive" },
    };
    return map[status] ?? { variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-bold text-text">
            {t.common.dashboard}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {isRtl ? "نظرة عامة على النظام" : "System overview"}
          </p>
        </div>
        <RunAllButton locale={locale} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                  <p className="text-2xl font-bold text-text mt-1">{stat.value}</p>
                  {stat.sub && (
                    <p className="text-xs text-text-muted mt-0.5">{stat.sub}</p>
                  )}
                </div>
                <div className={`p-2 rounded-lg bg-surface ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isRtl ? "آخر المهام" : "Recent Jobs"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">
              {t.common.noData}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "المصدر" : "Source"}</TableHead>
                  <TableHead>{t.jobs.jobStatus}</TableHead>
                  <TableHead>{isRtl ? "إعلانات" : "Listings"}</TableHead>
                  <TableHead>{isRtl ? "جديد" : "New"}</TableHead>
                  <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-text">
                      {job.source.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(job.status).variant}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text">{job.listingsFound}</TableCell>
                    <TableCell className="text-text">{job.newListings}</TableCell>
                    <TableCell className="text-text-muted">
                      {formatDate(job.createdAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
