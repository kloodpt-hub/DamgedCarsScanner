"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Code, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSource, updateSource } from "@/server/actions/sources";

const LEBONCOIN_DEFAULTS = {
  listingContainer: '[data-qa-id="aditem_container"], [data-qa-id="listitem_ad"], .styles_adCard__',
  title: '[data-qa-id="aditem_title"], [data-qa-id="subject"], h2, .textHeading',
  price: '[data-qa-id="aditem_price"], [data-qa-id="price"], .adPrice, [class*="price"]',
  year: '[data-qa-id="criteria_value"], [class*="year"], [data-qa-id="aditem_date"]',
  mileage: '[data-qa-id="criteria_value"], [data-qa-id="item_params"] span, [class*="mileage"]',
  damageStatus: '[data-qa-id="aditem_description"], [class*="damage"], [class*="state"]',
  description: '[data-qa-id="aditem_description"], [data-qa-id="ad_description"], .textDescription',
  imageUrl: "img",
  link: 'a[data-qa-id="aditem_container"], a[data-qa-id="listitem_ad"], a[href*="/ad/"]',
  nextPage: 'button[data-qa-id="pagination_next"], a[data-qa-id="pagination_next"], [aria-label="Page suivante"]',
};

const AUTOSCOUT24_DEFAULTS = {
  listingContainer: '[data-testid="sr-listing-item"], [data-testid="list-item"], .cl-list-element',
  title: '[data-testid="vehicle-title"], [data-testid="title"], .heading, h2, .vehicle-title',
  price: '[data-testid="price"], [class*="price"], .price, [data-testid="listing-price"]',
  year: '[data-testid="vehicle-registration"], [data-testid="first-registration"], .first-registration, [class*="registration"]',
  mileage: '[data-testid="vehicle-mileage"], [data-testid="mileage"], .mileage, [class*="km"]',
  damageStatus: '[data-testid="vehicle-condition"], [class*="condition"], [class*="damage"]',
  description: '[data-testid="vehicle-details"], [data-testid="seller-details"], .seller-details, [class*="description"]',
  imageUrl: "img",
  link: 'a[data-testid="listing-link"], a[data-testid="listing-detail-link"], a[href*="/listing/"]',
  nextPage: 'button[aria-label="Next page"], a[aria-label="Next page"], [data-testid="pagination-next"], [class*="next"]',
};

const GENERIC_DEFAULTS = {
  listingContainer: "",
  title: "",
  price: "",
  year: "",
  mileage: "",
  damageStatus: "",
  description: "",
  imageUrl: "",
  link: "",
  nextPage: "",
};

const SCHADEAUTOS_DEFAULTS = {
  listingContainer: "a.schadeautos-card",
  title: ".schadeautos-card__title",
  price: ".schadeautos-card__price",
  year: ".schadeautos-card__footer .schadeautos-card__stat:nth-child(1) span",
  mileage: ".schadeautos-card__footer .schadeautos-card__stat:nth-child(3) span",
  damageStatus: "",
  description: ".schadeautos-card__subtitle",
  imageUrl: ".schadeautos-card__image",
  link: "a.schadeautos-card",
  nextPage: ".schadeautos-pagination__nav--next",
};

type SelectorField = keyof typeof GENERIC_DEFAULTS;

const SELECTOR_FIELDS: { key: SelectorField; label: string; placeholder: string }[] = [
  { key: "listingContainer", label: "Listing Container", placeholder: "CSS selector for each listing card" },
  { key: "title", label: "Title", placeholder: "CSS selector for listing title" },
  { key: "price", label: "Price", placeholder: "CSS selector for price element" },
  { key: "year", label: "Year", placeholder: "CSS selector for year/registration" },
  { key: "mileage", label: "Mileage", placeholder: "CSS selector for mileage" },
  { key: "damageStatus", label: "Damage Status", placeholder: "CSS selector for damage/condition" },
  { key: "description", label: "Description", placeholder: "CSS selector for description text" },
  { key: "imageUrl", label: "Image URL", placeholder: 'CSS selector for image (e.g. "img")' },
  { key: "link", label: "Link", placeholder: "CSS selector for listing link" },
  { key: "nextPage", label: "Next Page", placeholder: "CSS selector for pagination next button" },
];

function getDefaultsForAdapter(type: string): Record<SelectorField, string> {
  switch (type) {
    case "leboncoin":
      return { ...LEBONCOIN_DEFAULTS };
    case "autoscout24":
      return { ...AUTOSCOUT24_DEFAULTS };
    case "schadeautos":
      return { ...SCHADEAUTOS_DEFAULTS };
    default:
      return { ...GENERIC_DEFAULTS };
  }
}

interface SourceFormProps {
  source?: {
    id: string;
    name: string;
    baseUrl: string;
    adapterType: string;
    selectors: unknown;
    isActive: boolean;
    scrapeIntervalMinutes: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
  locale?: string;
}

export function SourceForm({ source, onSuccess, onCancel, locale = "en" }: SourceFormProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const isEdit = !!source;

  const [name, setName] = useState(source?.name ?? "");
  const [baseUrl, setBaseUrl] = useState(source?.baseUrl ?? "");
  const [adapterType, setAdapterType] = useState(source?.adapterType ?? "generic");
  const [scrapeIntervalMinutes, setScrapeIntervalMinutes] = useState(
    source?.scrapeIntervalMinutes ?? 60
  );
  const [isActive, setIsActive] = useState(source?.isActive ?? true);
  const [useCustomJson, setUseCustomJson] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const initSelectorValues = (): Record<SelectorField, string> => {
    const defaults = getDefaultsForAdapter(source?.adapterType ?? "generic");
    if (source?.selectors && typeof source.selectors === "object") {
      const sel = source.selectors as Record<string, string>;
      const fields = Object.keys(GENERIC_DEFAULTS) as SelectorField[];
      for (const f of fields) {
        if (sel[f] !== undefined && sel[f] !== "") {
          defaults[f] = sel[f];
        }
      }
    }
    return defaults;
  };

  const [selectorValues, setSelectorValues] = useState<Record<SelectorField, string>>(initSelectorValues);
  const [customJson, setCustomJson] = useState(
    source?.selectors ? JSON.stringify(source.selectors, null, 2) : "{}"
  );

  const getDefaults = useCallback(() => getDefaultsForAdapter(adapterType), [adapterType]);

  const [prevAdapterType, setPrevAdapterType] = useState(adapterType);
  if (adapterType !== prevAdapterType && !isEdit) {
    setPrevAdapterType(adapterType);
    const defaults = getDefaultsForAdapter(adapterType);
    setSelectorValues(defaults);
    setCustomJson(JSON.stringify(defaults, null, 2));
  }

  const buildSelectorsFromFields = (): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const f of SELECTOR_FIELDS) {
      const val = selectorValues[f.key]?.trim() ?? "";
      if (val) result[f.key] = val;
    }
    return result;
  };

  const getSelectorsJson = (): string => {
    if (useCustomJson) return customJson;
    return JSON.stringify(buildSelectorsFromFields(), null, 2);
  };

  const handleAdapterChange = (newType: string) => {
    setAdapterType(newType);
  };

  const handleFillDefaults = () => {
    const defaults = getDefaultsForAdapter(adapterType);
    setSelectorValues(defaults);
    setCustomJson(JSON.stringify(defaults, null, 2));
    toast.success(isRtl ? "تم تعبئة القيم الافتراضية" : "Default selectors filled");
  };

  const handleSelectorFieldChange = (key: SelectorField, value: string) => {
    const next = { ...selectorValues, [key]: value };
    setSelectorValues(next);
    setCustomJson(JSON.stringify(
      Object.fromEntries(SELECTOR_FIELDS.map((f) => [f.key, next[f.key]])),
      null,
      2
    ));
  };

  const handleCustomJsonChange = (value: string) => {
    setCustomJson(value);
    try {
      const parsed = JSON.parse(value);
      const fields = Object.keys(GENERIC_DEFAULTS) as SelectorField[];
      const synced: Record<SelectorField, string> = { ...selectorValues };
      for (const f of fields) {
        synced[f] = parsed[f] ?? "";
      }
      setSelectorValues(synced);
    } catch {
      // invalid JSON, don't sync
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = isRtl ? "الاسم مطلوب" : "Name is required";
    if (!baseUrl.trim()) {
      errs.baseUrl = isRtl ? "الرابط مطلوب" : "URL is required";
    } else {
      try {
        new URL(baseUrl);
      } catch {
        errs.baseUrl = isRtl ? "رابط غير صالح" : "Invalid URL";
      }
    }
    const jsonToCheck = getSelectorsJson();
    try {
      JSON.parse(jsonToCheck);
    } catch {
      errs.selectors = isRtl ? "JSON غير صالح" : "Invalid JSON";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const selectors = JSON.parse(getSelectorsJson());
      if (isEdit) {
        await updateSource(source!.id, {
          name,
          baseUrl,
          adapterType,
          scrapeIntervalMinutes,
          isActive,
          selectors,
        });
        toast.success(isRtl ? "تم التحديث" : "Updated successfully");
      } else {
        await createSource({
          name,
          baseUrl,
          adapterType,
          scrapeIntervalMinutes,
          isActive,
          selectors,
        });
        toast.success(isRtl ? "تم الإنشاء" : "Created successfully");
      }
      onSuccess?.();
      router.refresh();
    } catch {
      toast.error(isRtl ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const adapterHelperText: Record<string, { en: string; ar: string }> = {
    leboncoin: {
      en: "Optimized for Leboncoin.fr. Default selectors target common listing page structures.",
      ar: "محسّن لموقع ليبونكوان. المحددات الافتراضية تستهدف هياكل صفحات الإعلانات الشائعة.",
    },
    autoscout24: {
      en: "Optimized for AutoScout24.com. Default selectors target common listing page structures.",
      ar: "محسّن لموقع أوتو سكوت 24. المحددات الافتراضية تستهدف هياكل صفحات الإعلانات الشائعة.",
    },
    generic: {
      en: "Generic adapter. You'll need to provide custom CSS selectors for your target site.",
      ar: "محول عام. ستحتاج إلى تقديم محددات CSS مخصصة لموقعك المستهدف.",
    },
    schadeautos: {
      en: "Optimized for WordPress sites using the Schadeautos plugin (e.g. auto-didact.nl). Reads data from data-* attributes for reliable extraction.",
      ar: "محسّن لمواقع WordPress التي تستخدم إضافة Schadeautos. يقرأ البيانات من سمات data-* لاستخراج موثوق.",
    },
    debels: {
      en: "Optimized for Debels.com damage cars promo page. Parses the promo grid directly without custom selectors.",
      ar: "محسّن لصفحة عروض سيارات التصادم في موقع Debels. يقرأ شبكة العروض مباشرة دون الحاجة إلى محددات مخصصة.",
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text">
          {isRtl ? "اسم المصدر" : "Source Name"}
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!errors.name}
          placeholder={isRtl ? "مثال: موقع سيارات" : "e.g., Car Site"}
        />
        {errors.name && (
          <p className="text-xs text-danger">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-text">
          {isRtl ? "الرابط الأساسي" : "Base URL"}
        </label>
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          error={!!errors.baseUrl}
          placeholder="https://www.leboncoin.fr/recherche?category=2&text=damage"
          dir="ltr"
        />
        {errors.baseUrl && (
          <p className="text-xs text-danger">{errors.baseUrl}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text">
            {isRtl ? "نوع المحول" : "Adapter Type"}
          </label>
          <Select
            value={adapterType}
            onChange={(e) => handleAdapterChange(e.target.value)}
          >
            <option value="generic">Generic</option>
            <option value="leboncoin">Leboncoin</option>
            <option value="autoscout24">AutoScout24</option>
            <option value="schadeautos">Schadeautos (WordPress)</option>
            <option value="debels">Debels</option>
          </Select>
          {adapterHelperText[adapterType] && (
            <p className="text-xs text-text-muted mt-1">
              {adapterHelperText[adapterType][isRtl ? "ar" : "en"]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-text">
            {isRtl ? "فترة السحب (دقيقة)" : "Interval (minutes)"}
          </label>
          <Input
            type="number"
            min={1}
            value={scrapeIntervalMinutes}
            onChange={(e) => setScrapeIntervalMinutes(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-text">
            {isRtl ? "المحددات" : "Selectors"}
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFillDefaults}
              className="h-7 px-2 text-xs gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              {isRtl ? "القيم الافتراضية" : "Default Selectors"}
            </Button>
            <Button
              type="button"
              variant={useCustomJson ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setUseCustomJson(!useCustomJson)}
              className="h-7 px-2 text-xs gap-1"
            >
              <Code className="h-3 w-3" />
              {isRtl ? "JSON مخصص" : "Custom JSON"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-text-muted">
          {isRtl
            ? "المحولات المدمجة (leboncoin، autoscout24، schadeautos، debels) تتبع تلقائيًا باستخدام منطق مدمج ولا تتطلب هذه المحددات. المحددات اختيارية وتُستخدم فقط كمُتجاوزات عند استخدام محول generic لموقع مخصص."
            : "Built-in adapters (leboncoin, autoscout24, schadeautos, debels) scrape automatically using built-in logic and do not require these selectors. Selectors are optional overrides only needed when using the generic adapter for a custom site."}
        </p>

        {useCustomJson ? (
          <Textarea
            value={customJson}
            onChange={(e) => handleCustomJsonChange(e.target.value)}
            error={!!errors.selectors}
            className="font-mono text-xs min-h-[160px]"
            placeholder='{"listingContainer": "...", "title": "...", ...}'
            spellCheck={false}
          />
        ) : (
          <div className="space-y-3 rounded-lg border border-border bg-input-bg/30 p-3">
            {SELECTOR_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-text-muted">
                  {field.label}
                </label>
                <Input
                  value={selectorValues[field.key] ?? ""}
                  onChange={(e) => handleSelectorFieldChange(field.key, e.target.value)}
                  placeholder={
                    getDefaults()[field.key] || field.placeholder
                  }
                  dir="ltr"
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>
        )}
        {errors.selectors && (
          <p className="text-xs text-danger">{errors.selectors}</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface/50 p-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
          <p className="text-xs text-text-muted">
            {isRtl
              ? "سيتم التحقق من المحددات عند تشغيل أداة السحب. يمكنك ترك الحقول فارغة لاستخدام القيم الافتراضية للمحول المختار."
              : "Selectors will be validated when you run the scraper. Leave fields empty to use the adapter's defaults."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
          />
          <span className="text-sm text-text">
            {isRtl ? "نشط" : "Active"}
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {isEdit
            ? isRtl
              ? "تحديث"
              : "Update"
            : isRtl
              ? "إنشاء"
              : "Create"}
        </Button>
      </div>
    </form>
  );
}
