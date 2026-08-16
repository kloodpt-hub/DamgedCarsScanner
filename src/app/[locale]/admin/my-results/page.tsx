import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/dashboard/ListingCard";

const PAGE_SIZE = 20;

interface AdminListing {
  id: string;
  title: string;
  price: number | null;
  year: number | null;
  mileage: number | null;
  damageStatus: string | null;
  imageUrl: string | null;
  canonicalUrl: string;
  isRead: boolean;
  isNotified: boolean;
  createdAt: Date | string;
}

export default async function AdminMyResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${locale}/login`);
  }
  const userId = session.user.id;

  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    isSold: false,
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
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {isRtl ? "الإدارة" : "Admin"}
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-text">
          {isRtl ? "نتائجي" : "My Results"}
        </h1>
        <p className="text-text-muted text-sm">
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
              <ListingCard key={listing.id} listing={listing as AdminListing} locale={locale} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={buildUrl(p)}
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
        </>
      )}
    </div>
  );
}
