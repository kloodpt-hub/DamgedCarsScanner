"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
  Send,
  Car,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/dashboard/ListingCard";
import { markAsRead, markAsNotified } from "@/server/actions/listings";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Listing {
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
  createdAt: string;
  source: { id: string; name: string };
}

interface Source {
  id: string;
  name: string;
}

const labels = {
  en: {
    title: "Listings",
    search: "Search listings...",
    allSources: "All Sources",
    all: "All",
    read: "Read",
    unread: "Unread",
    view: "View",
    markRead: "Mark Read",
    notify: "Notify",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    noResults: "No listings found",
    grid: "Grid",
    list: "List",
    filters: "Filters",
    titleCol: "Title",
    priceCol: "Price",
    yearCol: "Year",
    mileageCol: "Mileage",
    damageCol: "Damage",
    sourceCol: "Source",
    dateCol: "Date",
    actionsCol: "Actions",
    new: "New",
    loading: "Loading...",
    listingsCount: "listings",
  },
  ar: {
    title: "الإعلانات",
    search: "بحث في الإعلانات...",
    allSources: "جميع المصادر",
    all: "الكل",
    read: "مقروء",
    unread: "غير مقروء",
    view: "عرض",
    markRead: "تحديد كمقروء",
    notify: "إشعار",
    previous: "السابق",
    next: "التالي",
    page: "صفحة",
    of: "من",
    noResults: "لا توجد إعلانات",
    grid: "شبكة",
    list: "قائمة",
    filters: "الفلاتر",
    titleCol: "العنوان",
    priceCol: "السعر",
    yearCol: "السنة",
    mileageCol: "المسافة",
    damageCol: "الضرر",
    sourceCol: "المصدر",
    dateCol: "التاريخ",
    actionsCol: "الإجراءات",
    new: "جديد",
    loading: "جاري التحميل...",
    listingsCount: "إعلان",
  },
} as const;

export default function ListingsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const [locale, setLocale] = useState("en");
  const [listings, setListings] = useState<Listing[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [isRead, setIsRead] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [loading, setLoading] = useState(true);

  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const isRtl = locale === "ar";

  useEffect(() => {
    params.then((p) => setLocale(p.locale ?? "en"));
  }, [params]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("page", page.toString());
      sp.set("limit", "20");
      if (search) sp.set("search", search);
      if (sourceId) sp.set("sourceId", sourceId);
      if (isRead) sp.set("isRead", isRead);

      const res = await fetch(`/api/listings?${sp.toString()}`);
      const data = await res.json();
      setListings(data.listings);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [page, search, sourceId, isRead]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((data) => setSources(data.sources ?? data))
      .catch(() => {});
  }, []);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isRead: true } : l))
    );
    toast.success(t.markRead);
  };

  const handleNotify = async (id: string) => {
    await markAsNotified(id);
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isNotified: true } : l))
    );
    toast.success(t.notify);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <p className="text-text-muted text-sm mt-1">
          {total} {t.listingsCount}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t.search}
            className="ps-9"
          />
        </div>

        <Select
          value={sourceId}
          onChange={(e) => {
            setSourceId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t.allSources}</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select
          value={isRead}
          onChange={(e) => {
            setIsRead(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t.all}</option>
          <option value="false">{t.unread}</option>
          <option value="true">{t.read}</option>
        </Select>

        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "list"
                ? "bg-surface text-text"
                : "text-text-muted hover:text-text"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "grid"
                ? "bg-surface text-text"
                : "text-text-muted hover:text-text"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-text-muted">
          {t.loading}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-12 text-center text-text-muted">{t.noResults}</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.titleCol}</TableHead>
                  <TableHead>{t.priceCol}</TableHead>
                  <TableHead>{t.yearCol}</TableHead>
                  <TableHead>{t.mileageCol}</TableHead>
                  <TableHead>{t.damageCol}</TableHead>
                  <TableHead>{t.sourceCol}</TableHead>
                  <TableHead>{t.dateCol}</TableHead>
                  <TableHead>{t.actionsCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow
                    key={listing.id}
                    className={cn(!listing.isRead && "bg-primary/5")}
                  >
                    <TableCell className="max-w-[250px]">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 shrink-0 rounded bg-surface flex items-center justify-center overflow-hidden">
                          {listing.imageUrl ? (
                            <img
                              src={listing.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Car className="h-4 w-4 text-text-muted" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-text truncate">
                          {listing.title}
                        </span>
                        {!listing.isRead && (
                          <Badge variant="default" className="shrink-0 text-[10px]">
                            {t.new}
                          </Badge>
                        )}
                      </div>
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
                      {listing.damageStatus ? (
                        <Badge variant="warning">{listing.damageStatus}</Badge>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-text-muted">
                      {listing.source.name}
                    </TableCell>
                    <TableCell className="text-sm text-text-muted">
                      {formatDate(listing.createdAt, locale)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <a
                          href={listing.canonicalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-text-muted hover:text-primary hover:bg-surface transition-colors"
                          title={t.view}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {!listing.isRead && (
                          <button
                            onClick={() => handleMarkRead(listing.id)}
                            className="p-1.5 rounded text-text-muted hover:text-success hover:bg-surface transition-colors"
                            title={t.markRead}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {!listing.isNotified && (
                          <button
                            onClick={() => handleNotify(listing.id)}
                            className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-surface transition-colors"
                            title={t.notify}
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            {t.page} {page} {t.of} {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              {t.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t.next}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
