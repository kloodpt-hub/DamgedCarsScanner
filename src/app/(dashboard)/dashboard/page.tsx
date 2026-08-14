import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { getDictionary, type Locale } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Filter,
  Bell,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "en" } = await params;
  const t = await getDictionary(locale as Locale);
  const isRtl = locale === "ar";

  const session = await auth();
  const userId = session?.user?.id;

  const [
    totalListings,
    unreadListings,
    activeFilters,
    notificationsSent,
    recentListings,
  ] = await Promise.all([
    userId
      ? prisma.listing.count({
          where: { matchedFilters: { some: { userId } } },
        })
      : 0,
    userId
      ? prisma.listing.count({
          where: {
            isRead: false,
            matchedFilters: { some: { userId } },
          },
        })
      : 0,
    userId
      ? prisma.filter.count({ where: { userId, isActive: true } })
      : 0,
    userId
      ? prisma.listing.count({
          where: { isNotified: true, matchedFilters: { some: { userId } } },
        })
      : 0,
    userId
      ? prisma.listing.findMany({
          where: { matchedFilters: { some: { userId } } },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { source: true },
        })
      : [],
  ]);

  const stats = [
    {
      label: t.dashboard.totalListings,
      value: totalListings,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: t.dashboard.activeFilters,
      value: activeFilters,
      icon: Filter,
      color: "text-accent",
    },
    {
      label: t.listings.unread,
      value: unreadListings,
      icon: BookOpen,
      color: "text-warning",
    },
    {
      label: t.dashboard.notificationsSent,
      value: notificationsSent,
      icon: Bell,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t.common.dashboard}</h1>
        <p className="text-text-muted text-sm mt-1">
          {t.dashboard.accountOverview}
        </p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.dashboard.recentActivity}</CardTitle>
          <Link
            href="/dashboard/results"
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            {t.dashboard.viewAll} &rarr;
          </Link>
        </CardHeader>
        <CardContent>
          {recentListings.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">
              {t.common.noData}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentListings.map((listing: {
                id: string;
                title: string;
                imageUrl: string | null;
                source: { name: string };
                isRead: boolean;
                createdAt: Date | string;
              }) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-surface/50 transition-colors"
                >
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-surface flex items-center justify-center overflow-hidden">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-text-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text truncate">
                      {listing.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {listing.source.name} &middot; {formatDate(listing.createdAt, locale)}
                    </p>
                  </div>
                  {!listing.isRead && (
                    <Badge variant="default" className="shrink-0">{t.listings.new}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
