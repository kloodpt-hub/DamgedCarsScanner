"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSource, updateSource } from "@/server/actions/sources";

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
  const [selectorsText, setSelectorsText] = useState(
    source?.selectors ? JSON.stringify(source.selectors, null, 2) : "{}"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
    try {
      JSON.parse(selectorsText);
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
      const selectors = JSON.parse(selectorsText);
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
          placeholder="https://example.com"
          dir="ltr"
        />
        {errors.baseUrl && (
          <p className="text-xs text-danger">{errors.baseUrl}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text">
            {isRtl ? "نوع المحول" : "Adapter Type"}
          </label>
          <Select
            value={adapterType}
            onChange={(e) => setAdapterType(e.target.value)}
          >
            <option value="generic">Generic</option>
            <option value="leboncoin">Leboncoin</option>
            <option value="autoscout24">AutoScout24</option>
          </Select>
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
        <label className="block text-sm font-medium text-text">
          {isRtl ? "المحددات (JSON)" : "Selectors (JSON)"}
        </label>
        <Textarea
          value={selectorsText}
          onChange={(e) => setSelectorsText(e.target.value)}
          error={!!errors.selectors}
          className="font-mono text-xs min-h-[160px]"
          placeholder='{"listingContainer": "...", "title": "...", ...}'
          spellCheck={false}
        />
        {errors.selectors && (
          <p className="text-xs text-danger">{errors.selectors}</p>
        )}
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
