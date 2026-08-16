"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterForm } from "@/components/dashboard/FilterForm";
import { deleteFilter } from "@/server/actions/filters";

interface FilterData {
  id: string;
  name: string;
  minYear: number | null;
  maxYear: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  damageStatus: string | null;
  excludedKeywords: string[];
  minMileage: number | null;
  maxMileage: number | null;
  sourceIds?: string[];
  isActive: boolean;
  createdAt: string;
}

const labels = {
  en: {
    title: "My Filters",
    addFilter: "Add Filter",
    editFilter: "Edit Filter",
    noFilters: "No filters yet. Create one to get started.",
    active: "Active",
    matched: "Matched",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this filter?",
    min: "Min",
    max: "Max",
    year: "Year",
    price: "Price",
    mileage: "Mileage",
    damage: "Damage",
    keywords: "Keywords",
    none: "None",
    loading: "Loading...",
    filtersCount: "filters",
    failedToLoad: "Failed to load filters",
    failed: "Failed",
  },
  ar: {
    title: "فلاتري",
    addFilter: "إضافة فلتر",
    editFilter: "تعديل الفلتر",
    noFilters: "لا توجد فلاتر بعد. أنشئ واحداً للبدء.",
    active: "نشط",
    matched: "مطابق",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد من حذف هذا الفلتر؟",
    min: "الحد الأدنى",
    max: "الحد الأقصى",
    year: "السنة",
    price: "السعر",
    mileage: "المسافة",
    damage: "الضرر",
    keywords: "الكلمات",
    none: "لا شيء",
    loading: "جاري التحميل...",
    filtersCount: "فلتر",
    failedToLoad: "فشل تحميل الفلاتر",
    failed: "فشل",
  },
} as const;

export default function FiltersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("en");
  const [filters, setFilters] = useState<FilterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFilter, setEditingFilter] = useState<FilterData | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);

  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const isRtl = locale === "ar";

  useEffect(() => {
    params.then((p) => setLocale(p.locale ?? "en"));
  }, [params]);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/filters");
      if (!res.ok) {
        toast.error(t.failedToLoad);
        setFilters([]);
        return;
      }
      const data = await res.json();
      setFilters(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetch effect; fetchFilters updates loading/list state as the fetch progresses (idiomatic async data loading)
    fetchFilters();
  }, [fetchFilters]);

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    setDeleting(id);
    try {
      await deleteFilter(id);
      setFilters((prev) => prev.filter((f) => f.id !== id));
      toast.success(t.delete);
    } catch {
      toast.error(t.failed);
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (filter: FilterData) => {
    setEditingFilter(filter);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingFilter(undefined);
    fetchFilters();
  };

  const getFilterSummary = (filter: FilterData) => {
    const parts: string[] = [];
    if (filter.minYear || filter.maxYear) {
      parts.push(`${t.year}: ${filter.minYear ?? "?"} - ${filter.maxYear ?? "?"}`);
    }
    if (filter.minPrice || filter.maxPrice) {
      parts.push(`${t.price}: ${filter.minPrice ?? "?"} - ${filter.maxPrice ?? "?"}`);
    }
    if (filter.minMileage || filter.maxMileage) {
      parts.push(`${t.mileage}: ${filter.minMileage ?? "?"} - ${filter.maxMileage ?? "?"}`);
    }
    if (filter.damageStatus) {
      parts.push(`${t.damage}: ${filter.damageStatus}`);
    }
    if (filter.excludedKeywords?.length) {
      parts.push(`${t.keywords}: ${filter.excludedKeywords.join(", ")}`);
    }
    if (filter.sourceIds?.length) {
      parts.push(`Sources: ${filter.sourceIds.length}`);
    }
    return parts.length > 0 ? parts.join(" | ") : t.none;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
            {t.title}
          </p>
          <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        </div>
        <Button onClick={() => { setEditingFilter(undefined); setShowForm(true); }} className="rounded-full">
          <Plus className="h-4 w-4" />
          {t.addFilter}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-surface/70 p-1.5 ring-1 ring-border/80">
          <Card className="rounded-[calc(1rem-0.375rem)] shadow-none">
            <CardHeader className="mb-5 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {editingFilter ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <CardTitle className="text-base">
                  {editingFilter ? t.editFilter : t.addFilter}
                </CardTitle>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditingFilter(undefined); }}
                className="p-2.5 -m-2.5 rounded-lg text-text-muted transition-all duration-300 ease-premium hover:text-text hover:bg-surface active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              <FilterForm
                key={editingFilter?.id ?? "new"}
                filter={editingFilter}
                locale={locale}
                onSuccess={handleFormSuccess}
                onCancel={() => { setShowForm(false); setEditingFilter(undefined); }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-text-muted">
          {t.loading}
        </div>
      ) : filters.length === 0 ? (
        <div className="rounded-2xl bg-surface/70 p-1.5 ring-1 ring-border/80">
          <div className="rounded-[calc(1rem-0.375rem)] border border-dashed border-border bg-card-bg py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text-muted">
              <Filter className="h-5 w-5" />
            </div>
            <p className="text-sm text-text-muted">{t.noFilters}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => (
            <Card
              key={filter.id}
              className="transition-all duration-500 ease-premium hover:-translate-y-0.5 hover:shadow-ambient hover:border-primary/25"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-text">{filter.name}</h3>
                      <Badge variant={filter.isActive ? "success" : "secondary"}>
                        {t.active}
                      </Badge>
                    </div>
                    <p className="truncate text-xs leading-relaxed text-text-muted">
                      {getFilterSummary(filter)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(filter)}
                      className="p-2.5 -m-2.5 rounded-lg text-text-muted transition-all duration-300 ease-premium hover:text-primary hover:bg-surface active:scale-95"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(filter.id)}
                      disabled={deleting === filter.id}
                      className="p-2.5 -m-2.5 rounded-lg text-text-muted transition-all duration-300 ease-premium hover:text-danger hover:bg-surface active:scale-95 disabled:opacity-50"
                    >
                      {deleting === filter.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
