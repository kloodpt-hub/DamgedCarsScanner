import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Car } from "lucide-react";

const PAGE_SIZE = 20;

export default async function AdminMyResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getDictionary(locale as Locale);

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${locale}/login`);
  }
  const userId = session.user.id;

  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    matchedFilters: { some: { userId } },
  };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { source: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const isRtl = locale === "ar";

  const buildUrl = (p: number) => `/${locale}/admin/my-results?page=${p}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">
          {isRtl ? "نتائجي" : "My Results"}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {isRtl
            ? "الإعلانات المطابقة لفلاترك الشخصية"
            : "Listings matching your personal filters"}
        </p>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-text-muted text-sm py-12 text-center">
              {isRtl ? "لا توجد نتائج مطابقة بعد" : "No matching results yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="relative h-32 bg-surface overflow-hidden rounded-lg mb-3">
                    {listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-muted">
                        <Car className="h-8 w-8 opacity-30" />
                      </div>
                    )}
                    {!listing.isRead && (
                      <Badge variant="default" className="absolute top-2 start-2">
                        {isRtl ? "جديد" : "New"}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-text truncate">
                      <a
                        href={listing.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary inline-flex items-center gap-1"
                      >
                        {listing.title}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {listing.year && <span>{listing.year}</span>}
                      {listing.mileage != null && (
                        <span>{listing.mileage.toLocaleString()} km</span>
                      )}
                    </div>
                    {listing.price != null && (
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(listing.price)}
                      </p>
                    )}
                    <p className="text-xs text-text-muted">
                      {listing.source.name} · {formatDate(listing.createdAt, locale)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={buildUrl(p)}
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
        </>
      )}
    </div>
  );
}
