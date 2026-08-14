import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getDictionary, type Locale } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Filter,
  Bell,
  BookOpen,
  Car,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "en" } = await params;
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
          where: {
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
          <CardTitle>{t.dashboard.todaysActivity}</CardTitle>
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
                price: number | null;
                year: number | null;
                mileage: number | null;
                canonicalUrl: string;
                isRead: boolean;
                createdAt: Date | string;
                source: { name: string };
              }) => (
                <div key={listing.id} className="card overflow-hidden">
                  <div className="relative h-32 bg-surface overflow-hidden rounded-lg mb-3">
                    {listing.imageUrl ? (
                      <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-muted">
                        <Car className="h-8 w-8 opacity-30" />
                      </div>
                    )}
                    {!listing.isRead && (
                      <span className="absolute top-2 start-2 badge badge-primary">{t.listings.new}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-text truncate">
                      <a href={listing.canonicalUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        {listing.title}
                      </a>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {listing.year && <span>{listing.year}</span>}
                      {listing.mileage != null && <span>{listing.mileage.toLocaleString()} km</span>}
                    </div>
                    {listing.price != null && (
                      <p className="text-sm font-bold text-primary">{formatCurrency(listing.price)}</p>
                    )}
                    <p className="text-xs text-text-muted">{listing.source.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
