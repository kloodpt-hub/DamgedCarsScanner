"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
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
  },
} as const;

export default function FiltersPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
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
      const data = await res.json();
      setFilters(data);
    } catch {
      toast.error("Failed to load filters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
      toast.error("Failed");
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
    return parts.length > 0 ? parts.join(" | ") : t.none;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t.title}</h1>
          <p className="text-text-muted text-sm mt-1">
            {filters.length} {t.filtersCount}
          </p>
        </div>
        <Button onClick={() => { setEditingFilter(undefined); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          {t.addFilter}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {editingFilter ? t.editFilter : t.addFilter}
            </CardTitle>
            <button
              onClick={() => { setShowForm(false); setEditingFilter(undefined); }}
              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <FilterForm
              filter={editingFilter}
              locale={locale}
              onSuccess={handleFormSuccess}
              onCancel={() => { setShowForm(false); setEditingFilter(undefined); }}
            />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-12 text-center text-text-muted">
          {t.loading}
        </div>
      ) : filters.length === 0 ? (
        <div className="py-12 text-center text-text-muted">{t.noFilters}</div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => (
            <Card key={filter.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text">{filter.name}</h3>
                      <Badge variant={filter.isActive ? "success" : "secondary"}>
                        {t.active}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {getFilterSummary(filter)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(filter)}
                      className="p-1.5 rounded text-text-muted hover:text-primary hover:bg-surface transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(filter.id)}
                      disabled={deleting === filter.id}
                      className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-surface transition-colors disabled:opacity-50"
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
