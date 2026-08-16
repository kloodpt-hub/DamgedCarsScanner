import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDate, formatCurrency } from "@/lib/utils";
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
import { ListingsFilters } from "@/components/admin/ListingsFilters";
import { FileText, ExternalLink, Info } from "lucide-react";

const PAGE_SIZE = 20;

export default async function AdminListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getDictionary(locale as Locale);
  const isRtl = locale === "ar";

  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));
  const search = typeof sp.search === "string" ? sp.search : "";
  const sourceId = typeof sp.sourceId === "string" ? sp.sourceId : "";
  const isRead = typeof sp.isRead === "string" ? sp.isRead : "";
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};

  where.isSold = false;

  if (sourceId) {
    where.sourceId = sourceId;
  }

  if (isRead === "true") {
    where.isRead = true;
  } else if (isRead === "false") {
    where.isRead = false;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [listings, total, sources] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { source: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
    prisma.scraperSource.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statusBadge = (listing: { isRead: boolean; isNotified: boolean }) => {
    if (listing.isNotified) {
      return { label: isRtl ? "تم الإشعار" : "Notified", variant: "success" as const };
    }
    if (listing.isRead) {
      return { label: isRtl ? "مقروء" : "Read", variant: "default" as const };
    }
    return { label: isRtl ? "جديد" : "New", variant: "warning" as const };
  };

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const finalSearch = overrides.search !== undefined ? overrides.search : search;
    const finalSourceId = overrides.sourceId !== undefined ? overrides.sourceId : sourceId;
    const finalIsRead = overrides.isRead !== undefined ? overrides.isRead : isRead;

    if (finalSearch) params.set("search", finalSearch);
    if (finalSourceId) params.set("sourceId", finalSourceId);
    if (finalIsRead) params.set("isRead", finalIsRead);
    if (overrides.page) params.set("page", overrides.page);
    return `/${locale}/admin/listings?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {isRtl ? "الإدارة" : "Admin"}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t.nav.listings}</h1>
          <p className="text-text-muted text-sm">
            {total} {isRtl ? "إعلان" : "listings"}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Info className="h-3.5 w-3.5 text-primary" />
        </div>
        <p className="text-xs text-text-muted leading-relaxed pt-1">
          {isRtl
            ? "عرض قاعدة البيانات للقراءة فقط. جميع الإعلانات تُحذف تلقائيًا بعد 7 أيام."
            : "Read-only database view. All listings auto-delete after 7 days."}
        </p>
      </div>

      <ListingsFilters
        search={search}
        sourceId={sourceId}
        isRead={isRead}
        sources={sources.map((s) => ({ id: s.id, name: s.name }))}
        isRtl={isRtl}
      />

      <div className="rounded-[1.75rem] bg-surface/70 p-1.5 ring-1 ring-border/40">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">
              {isRtl ? " جميع الإعلانات" : "All Listings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <p className="text-text-muted text-sm py-12 text-center">
                {t.common.noData}
              </p>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                        <TableHead>{isRtl ? "المصدر" : "Source"}</TableHead>
                        <TableHead>{isRtl ? "السعر" : "Price"}</TableHead>
                        <TableHead>{isRtl ? "السنة" : "Year"}</TableHead>
                        <TableHead>{isRtl ? "المسافة" : "Mileage"}</TableHead>
                        <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
                        <TableHead>{isRtl ? "عرض" : "View"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listings.map((listing) => {
                        const status = statusBadge(listing);
                        return (
                          <TableRow key={listing.id} className={!listing.isRead ? "bg-primary/5" : undefined}>
                            <TableCell className="max-w-[250px]">
                              <span className="text-sm font-medium text-text truncate block">
                                {listing.title}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-text-muted">
                              {listing.source?.name ?? "(Deleted)"}
                            </TableCell>
                            <TableCell className="text-sm text-text">
                              {listing.price != null ? formatCurrency(listing.price) : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-text">
                              {listing.year ?? "-"}
                            </TableCell>
                            <TableCell className="text-sm text-text">
                              {listing.mileage != null
                                ? `${listing.mileage.toLocaleString()} km`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-text-muted">
                              {formatDate(listing.createdAt, locale)}
                            </TableCell>
                            <TableCell>
                              <a
                                href={listing.canonicalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded text-text-muted hover:text-primary hover:bg-surface transition-colors inline-flex"
                                title={isRtl ? "عرض" : "View"}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-3">
                  {listings.map((listing) => {
                    const status = statusBadge(listing);
                    return (
                      <div
                        key={listing.id}
                        className={`rounded-2xl border border-card-border bg-card-bg p-4 ${
                          !listing.isRead ? "ring-1 ring-primary/20" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text line-clamp-2">
                              {listing.title}
                            </p>
                            <p className="mt-1 text-xs text-text-muted">
                              {listing.source?.name ?? "(Deleted)"}
                            </p>
                          </div>
                          <Badge variant={status.variant} className="shrink-0">
                            {status.label}
                          </Badge>
                        </div>
                        <dl className="mt-3 grid grid-cols-3 gap-2">
                          <div>
                            <dt className="text-xs text-text-muted">{isRtl ? "السعر" : "Price"}</dt>
                            <dd className="mt-0.5 text-sm font-semibold text-text truncate">
                              {listing.price != null ? formatCurrency(listing.price) : "-"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-text-muted">{isRtl ? "السنة" : "Year"}</dt>
                            <dd className="mt-0.5 text-sm font-medium text-text">
                              {listing.year ?? "-"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-text-muted">{isRtl ? "المسافة" : "Mileage"}</dt>
                            <dd className="mt-0.5 text-sm font-medium text-text">
                              {listing.mileage != null
                                ? `${listing.mileage.toLocaleString()} km`
                                : "-"}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                          <p className="text-xs text-text-muted">
                            {formatDate(listing.createdAt, locale)}
                          </p>
                          <a
                            href={listing.canonicalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted transition-all duration-300 ease-premium hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-[0.96]"
                            title={isRtl ? "عرض" : "View"}
                            aria-label={isRtl ? "عرض" : "View"}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
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

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({ page: p.toString() })}
              aria-current={p === page ? "page" : undefined}
              className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm transition-all duration-300 ease-premium active:scale-[0.96] ${
                p === page
                  ? "bg-primary font-semibold text-white shadow-ambient"
                  : "text-text-muted hover:bg-surface hover:text-text"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
