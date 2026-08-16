import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cn, formatCurrency } from "@/lib/utils";
import { getDictionary, type Locale } from "@/lib/i18n";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Filter,
  Bell,
  BookOpen,
  Car,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const chipTint: Record<string, string> = {
  "text-primary": "bg-primary/10",
  "text-accent": "bg-accent/10",
  "text-warning": "bg-warning/10",
  "text-success": "bg-success/10",
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);

  const session = await auth();
  const userId = session?.user?.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalListings,
    unreadListings,
    activeFilters,
    notificationsSent,
    recentListings,
  ] = await Promise.all([
    userId
      ? prisma.listing.count({
          where: {
            isSold: false,
            matchedFilters: { some: { userId } },
          },
        })
      : 0,
    userId
      ? prisma.listing.count({
          where: {
            isRead: false,
            isSold: false,
            matchedFilters: { some: { userId } },
          },
        })
      : 0,
    userId
      ? prisma.filter.count({ where: { userId, isActive: true } })
      : 0,
    userId
      ? prisma.listing.count({
          where: {
            isNotified: true,
            isSold: false,
            matchedFilters: { some: { userId } },
          },
        })
      : 0,
    userId
      ? prisma.listing.findMany({
          where: {
            isSold: false,
            matchedFilters: { some: { userId } },
            createdAt: { gte: todayStart },
          },
          orderBy: { createdAt: "desc" },
          take: 12,
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
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
          {t.dashboard.accountOverview}
        </p>
        <h1 className="text-2xl font-bold text-text">{t.common.dashboard}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="p-3 min-[420px]:p-4 transition-all duration-500 ease-premium hover:-translate-y-1 hover:border-primary/25"
            >
              <CardContent className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-text-muted sm:text-sm">{stat.label}</p>
                  <p className="mt-1.5 text-2xl font-bold tabular-nums text-text sm:text-3xl">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    stat.color,
                    chipTint[stat.color] ?? "bg-surface"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
              {t.dashboard.newToday}
            </p>
            <h2 className="text-lg font-semibold text-text">
              {t.dashboard.todaysActivity}
            </h2>
          </div>
          <Link
            href={`/${locale}/dashboard/results`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            {t.dashboard.viewAll} <span className="inline-block rtl:rotate-180">&rarr;</span>
          </Link>
        </div>

        {recentListings.length === 0 ? (
          <div className="rounded-2xl bg-surface/70 p-1.5 ring-1 ring-border/80">
            <div className="rounded-[calc(1rem-0.375rem)] border border-dashed border-border bg-card-bg py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text-muted">
                <Car className="h-5 w-5" />
              </div>
              <p className="text-sm text-text-muted">{t.common.noData}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {recentListings.map((listing: {
              id: string;
              title: string;
              imageUrl: string | null;
              price: number | null;
              year: number | null;
              mileage: number | null;
              canonicalUrl: string;
              isRead: boolean;
              createdAt: Date | string;
              source: { name: string };
            }) => (
              <div
                key={listing.id}
                className="group rounded-2xl bg-surface/70 p-1.5 ring-1 ring-border/80 transition-all duration-500 ease-premium hover:-translate-y-1 hover:shadow-ambient hover:ring-border"
              >
                <div className="overflow-hidden rounded-[calc(1rem-0.375rem)] border border-card-border bg-card-bg">
                  <div className="relative aspect-[16/9] overflow-hidden bg-surface">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-muted">
                        <Car className="h-8 w-8 opacity-30" />
                      </div>
                    )}
                    {!listing.isRead && (
                      <span className="absolute top-2.5 start-2.5 z-10">
                        <Badge variant="default">{t.listings.new}</Badge>
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 p-4">
                    <h3 className="text-sm font-semibold leading-snug text-text truncate">
                      <a
                        href={listing.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {listing.title}
                      </a>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {listing.year && <span>{listing.year}</span>}
                      {listing.mileage != null && <span>{listing.mileage.toLocaleString()} km</span>}
                    </div>
                    {listing.price != null && (
                      <p className="text-sm font-bold tabular-nums text-primary">
                        {formatCurrency(listing.price)}
                      </p>
                    )}
                    <p className="pt-2 text-xs text-text-muted border-t border-card-border/60">
                      <a
                        href={listing.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-hover transition-colors"
                      >
                        {listing.source.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
