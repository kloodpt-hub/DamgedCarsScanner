"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFilter, updateFilter } from "@/server/actions/filters";

const labels = {
  en: {
    filterName: "Filter Name",
    minYear: "Min Year",
    maxYear: "Max Year",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    damageStatus: "Damage Status",
    excludedKeywords: "Excluded Keywords (comma-separated)",
    minMileage: "Min Mileage",
    maxMileage: "Max Mileage",
    save: "Save",
    cancel: "Cancel",
    creating: "Saving...",
    nameRequired: "Filter name is required",
    filterUpdated: "Filter updated",
    filterCreated: "Filter created",
    failedToSave: "Failed to save filter",
  },
  ar: {
    filterName: "اسم الفلتر",
    minYear: "الحد الأدنى للسنة",
    maxYear: "الحد الأقصى للسنة",
    minPrice: "الحد الأدنى للسعر",
    maxPrice: "الحد الأقصى للسعر",
    damageStatus: "حالة الضرر",
    excludedKeywords: "الكلمات المستبعدة (مفصولة بفاصلة)",
    minMileage: "الحد الأدنى للمسافة",
    maxMileage: "الحد الأقصى للمسافة",
    save: "حفظ",
    cancel: "إلغاء",
    creating: "جاري الحفظ...",
    nameRequired: "اسم الفلتر مطلوب",
    filterUpdated: "تم تحديث الفلتر",
    filterCreated: "تم إنشاء الفلتر",
    failedToSave: "فشل حفظ الفلتر",
  },
} as const;

interface FilterData {
  id?: string;
  name: string;
  minYear?: number | null;
  maxYear?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  damageStatus?: string | null;
  excludedKeywords?: string[];
  minMileage?: number | null;
  maxMileage?: number | null;
}

interface FilterFormProps {
  filter?: FilterData;
  onSuccess: () => void;
  onCancel: () => void;
  locale: string;
}

export function FilterForm({ filter, onSuccess, onCancel, locale }: FilterFormProps) {
  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const isEdit = !!filter?.id;

  const [name, setName] = useState(filter?.name ?? "");
  const [minYear, setMinYear] = useState(filter?.minYear?.toString() ?? "");
  const [maxYear, setMaxYear] = useState(filter?.maxYear?.toString() ?? "");
  const [minPrice, setMinPrice] = useState(filter?.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filter?.maxPrice?.toString() ?? "");
  const [damageStatus, setDamageStatus] = useState(filter?.damageStatus ?? "");
  const [excludedKeywords, setExcludedKeywords] = useState(
    filter?.excludedKeywords?.join(", ") ?? ""
  );
  const [minMileage, setMinMileage] = useState(filter?.minMileage?.toString() ?? "");
  const [maxMileage, setMaxMileage] = useState(filter?.maxMileage?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t.nameRequired);
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        minYear: minYear ? parseInt(minYear) : undefined,
        maxYear: maxYear ? parseInt(maxYear) : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        damageStatus: damageStatus || undefined,
        excludedKeywords: excludedKeywords
          ? excludedKeywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [],
        minMileage: minMileage ? parseInt(minMileage) : undefined,
        maxMileage: maxMileage ? parseInt(maxMileage) : undefined,
      };

      if (isEdit && filter?.id) {
        await updateFilter(filter.id, data);
      } else {
        await createFilter(data);
      }

      toast.success(isEdit ? t.filterUpdated : t.filterCreated);
      onSuccess();
    } catch {
      toast.error(t.failedToSave);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">{t.filterName}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.filterName}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t.minYear}</label>
          <Input
            type="number"
            value={minYear}
            onChange={(e) => setMinYear(e.target.value)}
            placeholder="2015"
            min={1900}
            max={2100}
          />
        </div>
        <div>
          <label className="label">{t.maxYear}</label>
          <Input
            type="number"
            value={maxYear}
            onChange={(e) => setMaxYear(e.target.value)}
            placeholder="2024"
            min={1900}
            max={2100}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t.minPrice}</label>
          <Input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="1000"
            min={0}
          />
        </div>
        <div>
          <label className="label">{t.maxPrice}</label>
          <Input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="50000"
            min={0}
          />
        </div>
      </div>

      <div>
        <label className="label">{t.damageStatus}</label>
        <Input
          value={damageStatus}
          onChange={(e) => setDamageStatus(e.target.value)}
          placeholder="e.g. accident, fire, flood"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t.minMileage}</label>
          <Input
            type="number"
            value={minMileage}
            onChange={(e) => setMinMileage(e.target.value)}
            placeholder="0"
            min={0}
          />
        </div>
        <div>
          <label className="label">{t.maxMileage}</label>
          <Input
            type="number"
            value={maxMileage}
            onChange={(e) => setMaxMileage(e.target.value)}
            placeholder="200000"
            min={0}
          />
        </div>
      </div>

      <div>
        <label className="label">{t.excludedKeywords}</label>
        <Input
          value={excludedKeywords}
          onChange={(e) => setExcludedKeywords(e.target.value)}
          placeholder="scrap, parts only, non-runner"
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? t.creating : t.save}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
