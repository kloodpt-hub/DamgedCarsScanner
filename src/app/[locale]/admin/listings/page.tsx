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
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">{t.nav.listings}</h1>
          <p className="text-text-muted text-sm mt-1">
            {total} {isRtl ? "إعلان" : "listings"}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">
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

      <Card>
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
                        {listing.source.name}
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
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({ page: p.toString() })}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                p === page
                  ? "bg-primary text-white font-medium"
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
