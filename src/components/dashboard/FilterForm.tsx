"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createFilter, updateFilter } from "@/server/actions/filters";

interface Source {
  id: string;
  name: string;
}

const labels = {
  en: {
    filterName: "Filter Name",
    minYear: "Min Year",
    maxYear: "Max Year",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    priceType: "Price Type",
    priceTypeAny: "Any",
    priceTypeGross: "Gross (Export)",
    priceTypeNet: "Net",
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
    sources: "Sources",
    allSources: "All sources",
    noSources: "No sources available",
    sourcesSelected: (count: number) => `${count} selected`,
    excludeHeavyDamage: "Exclude heavily damaged cars",
    brands: "Brands",
    allBrands: "All brands",
    noBrands: "No brands available",
    brandsSelected: (count: number) => `${count} selected`,
    maxDamageLevel: "Maximum Damage Level",
    maxDamageLevelNone: "Show all (no damage filter)",
    maxDamageLevelLight: "Exclude moderate, heavy, and total loss",
    maxDamageLevelModerate: "Exclude heavy and total loss only",
    maxDamageLevelHeavy: "Exclude total loss only",
    maxDamageLevelTotalLoss: "Keyword matching only (default)",
  },
  ar: {
    filterName: "اسم الفلتر",
    minYear: "الحد الأدنى للسنة",
    maxYear: "الحد الأقصى للسنة",
    minPrice: "الحد الأدنى للسعر",
    maxPrice: "الحد الأقصى للسعر",
    priceType: "نوع السعر",
    priceTypeAny: "أي",
    priceTypeGross: "السعر الإجمالي (تصدير)",
    priceTypeNet: "السعر الصافي",
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
    sources: "المصادر",
    allSources: "كل المصادر",
    noSources: "لا توجد مصادر متاحة",
    sourcesSelected: (count: number) => `تم اختيار ${count}`,
    excludeHeavyDamage: "استبعاد السيارات المتضررة بشدة",
    brands: "العلامات التجارية",
    allBrands: "كل العلامات",
    noBrands: "لا توجد علامات متاحة",
    brandsSelected: (count: number) => `تم اختيار ${count}`,
    maxDamageLevel: "الحد الأقصى لمستوى الضرر",
    maxDamageLevelNone: "عرض الكل (بدون فلتر ضرر)",
    maxDamageLevelLight: "استبعاد متوسط وشديد وخاسر",
    maxDamageLevelModerate: "استبعاد شديد وخاسر فقط",
    maxDamageLevelHeavy: "استبعاد خاسر فقط",
    maxDamageLevelTotalLoss: "مطابقة الكلمات المفتاحية فقط (افتراضي)",
  },
} as const;

interface FilterData {
  id?: string;
  name: string;
  minYear?: number | null;
  maxYear?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  priceType?: string;
  damageStatus?: string | null;
  excludedKeywords?: string[];
  minMileage?: number | null;
  maxMileage?: number | null;
  sourceIds?: string[];
  excludeHeavyDamage?: boolean;
  brands?: string[];
  maxDamageLevel?: string;
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
  const [priceType, setPriceType] = useState(filter?.priceType ?? "any");
  const [damageStatus, setDamageStatus] = useState(filter?.damageStatus ?? "");
  const [excludedKeywords, setExcludedKeywords] = useState(
    filter?.excludedKeywords?.join(", ") ?? ""
  );
  const [minMileage, setMinMileage] = useState(filter?.minMileage?.toString() ?? "");
  const [maxMileage, setMaxMileage] = useState(filter?.maxMileage?.toString() ?? "");
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(filter?.sourceIds ?? []);
  const [excludeHeavyDamage, setExcludeHeavyDamage] = useState(filter?.excludeHeavyDamage ?? false);
  const [maxDamageLevel, setMaxDamageLevel] = useState(filter?.maxDamageLevel ?? "total_loss");
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(filter?.brands ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((data) => setSources(data.sources ?? data))
      .catch(() => {});
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => setBrandOptions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
        priceType: priceType as "any" | "gross" | "net",
        damageStatus: damageStatus || undefined,
        excludedKeywords: excludedKeywords
          ? excludedKeywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [],
        minMileage: minMileage ? parseInt(minMileage) : undefined,
        maxMileage: maxMileage ? parseInt(maxMileage) : undefined,
        sourceIds: selectedSourceIds,
        excludeHeavyDamage,
        maxDamageLevel: maxDamageLevel as "none" | "light" | "moderate" | "heavy" | "total_loss",
        brands: selectedBrands,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label>{t.filterName}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.filterName}
        />
      </div>

      <div>
        <Label>{t.sources}</Label>
        {sources.length === 0 ? (
          <p className="text-xs text-text-muted">{t.noSources}</p>
        ) : (
          <MultiSelect
            value={selectedSourceIds}
            onChange={setSelectedSourceIds}
            options={sources.map((s) => ({ value: s.id, label: s.name }))}
            placeholder={t.allSources}
            selectedLabel={t.sourcesSelected}
            ariaLabel={t.sources}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label>{t.minYear}</Label>
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
          <Label>{t.maxYear}</Label>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label>{t.minPrice}</Label>
          <Input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="1000"
            min={0}
          />
        </div>
        <div>
          <Label>{t.maxPrice}</Label>
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
        <Label>{t.priceType}</Label>
        <Select
          value={priceType}
          onChange={(e) => setPriceType(e.target.value)}
        >
          <option value="any">{t.priceTypeAny}</option>
          <option value="gross">{t.priceTypeGross}</option>
          <option value="net">{t.priceTypeNet}</option>
        </Select>
      </div>

      <div>
        <Label>{t.damageStatus}</Label>
        <Select
          value={damageStatus}
          onChange={(e) => setDamageStatus(e.target.value)}
        >
          <option value="">Any</option>
          <option value="Damage">Damage</option>
          <option value="No Damage">No Damage</option>
          <option value="Total Loss">Total Loss</option>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-card-border p-3">
        <Label className="cursor-pointer">{t.excludeHeavyDamage}</Label>
        <Switch
          checked={excludeHeavyDamage}
          onCheckedChange={setExcludeHeavyDamage}
        />
      </div>

      <div>
        <Label>{t.maxDamageLevel}</Label>
        <Select
          value={maxDamageLevel}
          onChange={(e) => setMaxDamageLevel(e.target.value)}
        >
          <option value="total_loss">{t.maxDamageLevelTotalLoss}</option>
          <option value="heavy">{t.maxDamageLevelHeavy}</option>
          <option value="moderate">{t.maxDamageLevelModerate}</option>
          <option value="light">{t.maxDamageLevelLight}</option>
          <option value="none">{t.maxDamageLevelNone}</option>
        </Select>
      </div>

      <div>
        <Label>{t.brands}</Label>
        {brandOptions.length === 0 ? (
          <p className="text-xs text-text-muted">{t.noBrands}</p>
        ) : (
          <MultiSelect
            value={selectedBrands}
            onChange={setSelectedBrands}
            options={brandOptions.map((b) => ({ value: b, label: b }))}
            placeholder={t.allBrands}
            selectedLabel={t.brandsSelected}
            ariaLabel={t.brands}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label>{t.minMileage}</Label>
          <Input
            type="number"
            value={minMileage}
            onChange={(e) => setMinMileage(e.target.value)}
            placeholder="0"
            min={0}
          />
        </div>
        <div>
          <Label>{t.maxMileage}</Label>
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
        <Label>{t.excludedKeywords}</Label>
        <Input
          value={excludedKeywords}
          onChange={(e) => setExcludedKeywords(e.target.value)}
          placeholder="scrap, parts only, non-runner"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-card-border">
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
