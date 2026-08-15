"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ListingCard } from "@/components/dashboard/ListingCard";
import { formatDate } from "@/lib/utils";
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
    title: "Results",
    search: "Search results...",
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
    noResults: "No results found",
    new: "New",
    loading: "Loading...",
    listingsCount: "results",
    failedToLoad: "Failed to load results",
    today: "Today",
    yesterday: "Yesterday",
  },
  ar: {
    title: "النتائج",
    search: "بحث في النتائج...",
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
    noResults: "لا توجد نتائج",
    new: "جديد",
    loading: "جاري التحميل...",
    listingsCount: "نتيجة",
    failedToLoad: "فشل تحميل النتائج",
    today: "اليوم",
    yesterday: "أمس",
  },
} as const;

export default function ResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("en");
  const [listings, setListings] = useState<Listing[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [isRead, setIsRead] = useState("");
  const [loading, setLoading] = useState(true);

  const t = labels[locale as keyof typeof labels] ?? labels.en;

  useEffect(() => {
    params.then((p) => setLocale(p.locale ?? "en"));
  }, [params]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("page", page.toString());
      sp.set("limit", "30");
      if (search) sp.set("search", search);
      if (sourceId) sp.set("sourceId", sourceId);
      if (isRead) sp.set("isRead", isRead);

      const res = await fetch(`/api/listings?${sp.toString()}`);
      if (!res.ok) {
        toast.error(t.failedToLoad);
        setListings([]);
        return;
      }
      const data = await res.json();
      setListings(data.listings);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error(t.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [page, search, sourceId, isRead]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetch effect; fetchListings updates loading/list state as the fetch progresses (idiomatic async data loading)
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((data) => setSources(data.sources ?? data ?? []))
      .catch(() => {});
  }, []);

  const groups: { label: string; listings: Listing[] }[] = [];
  if (!loading && listings.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayListings = listings.filter((l) => new Date(l.createdAt) >= today);
    const yesterdayListings = listings.filter((l) => {
      const d = new Date(l.createdAt);
      return d >= yesterday && d < today;
    });
    const olderListings = listings.filter((l) => new Date(l.createdAt) < yesterday);

    if (todayListings.length > 0) groups.push({ label: t.today, listings: todayListings });
    if (yesterdayListings.length > 0) groups.push({ label: t.yesterday, listings: yesterdayListings });

    const olderByDate = new Map<string, Listing[]>();
    olderListings.forEach((l) => {
      const dateKey = formatDate(l.createdAt, locale);
      if (!olderByDate.has(dateKey)) olderByDate.set(dateKey, []);
      olderByDate.get(dateKey)!.push(l);
    });
    olderByDate.forEach((groupListings, label) => groups.push({ label, listings: groupListings }));
  }

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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
      </div>

      {loading ? (
        <div className="py-12 text-center text-text-muted">
          {t.loading}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-12 text-center text-text-muted">{t.noResults}</div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label} className="space-y-4">
              <h2 className="text-lg font-semibold text-text border-b border-border pb-2">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} locale={locale} />
                ))}
              </div>
            </div>
          ))}
        </div>
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
