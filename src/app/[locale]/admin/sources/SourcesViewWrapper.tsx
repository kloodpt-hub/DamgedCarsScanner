"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCatalogByCountry, type SiteCatalogEntry } from "@/lib/scraper/catalog";
import { toast } from "sonner";
import { createSource } from "@/server/actions/sources";
import { getDefaultsForAdapter } from "@/lib/scraper/adapter-defaults";

interface SourcesViewWrapperProps {
  children: React.ReactNode;
  existingSourceIds: string[];
  locale: string;
}

function AvailableSourcesSection({
  existingSourceIds,
  locale,
}: {
  existingSourceIds: string[];
  locale: string;
}) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  const groups = getCatalogByCountry();

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          (e.nameAr && e.nameAr.includes(search)) ||
          e.adapterType.toLowerCase().includes(q) ||
          group.country.toLowerCase().includes(q)
        );
      }),
    }))
    .filter((g) => g.entries.length > 0);

  const handleQuickAdd = async (site: SiteCatalogEntry) => {
    setAddingId(site.id);
    try {
      const defaults = getDefaultsForAdapter(site.adapterType);
      await createSource({
        name: site.name,
        baseUrl: site.baseUrl,
        adapterType: site.adapterType,
        scrapeIntervalMinutes: site.defaultInterval,
        isActive: false,
        selectors: defaults,
      });
      toast.success(
        isRtl
          ? `تمت إضافة ${site.nameAr ?? site.name}`
          : `Added ${site.name}`
      );
      router.refresh();
    } catch {
      toast.error(isRtl ? "فشل في الإضافة" : "Failed to add");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isRtl ? "بحث في المواقع..." : "Search sites..."}
          className="ps-9"
        />
      </div>

      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <div
            key={group.country}
            className="rounded-2xl border border-border/40 bg-surface/50 p-4"
          >
            <div
              className={`flex items-center gap-2.5 mb-3 ${isRtl ? "flex-row-reverse" : ""}`}
            >
              <span className="text-xl">{group.countryFlag}</span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text">
                {group.country}
              </h3>
              <span className="text-xs text-text-muted">
                ({group.entries.length}{" "}
                {isRtl ? "موقع" : "sites"})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {group.entries.map((site) => {
                const isAdded = existingSourceIds.includes(site.id);
                return (
                  <div
                    key={site.id}
                    className={`rounded-xl border p-3 transition-all duration-200 ${
                      isAdded
                        ? "border-success/30 bg-success/5 opacity-60"
                        : "border-border/40 bg-card-bg hover:border-primary/30 hover:bg-surface/60"
                    }`}
                  >
                    <div
                      className={`flex items-start justify-between gap-2 ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {isRtl && site.nameAr ? site.nameAr : site.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className="mt-1 text-[10px]"
                        >
                          {site.adapterType}
                        </Badge>
                      </div>
                      {isAdded ? (
                        <Badge
                          variant="success"
                          className="shrink-0 text-[10px]"
                        >
                          ✓ {isRtl ? "مضيف" : "Added"}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-7 px-2 text-xs"
                          disabled={addingId === site.id}
                          onClick={() => handleQuickAdd(site)}
                        >
                          {addingId === site.id
                            ? "..."
                            : isRtl
                              ? "+ إضافة"
                              : "+ Add"}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-2">
                      {isRtl && site.descriptionAr
                        ? site.descriptionAr
                        : site.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">
            {isRtl ? "لا توجد نتائج" : "No results found"}
          </p>
        )}
      </div>
    </div>
  );
}

export function SourcesViewWrapper({
  children,
  existingSourceIds,
  locale,
}: SourcesViewWrapperProps) {
  const isRtl = locale === "ar";
  const [view, setView] = useState<"active" | "available">("active");

  return (
    <div className="space-y-4">
      <div
        className={`flex gap-1 rounded-xl bg-surface/70 p-1 ring-1 ring-border/40 w-fit ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <button
          onClick={() => setView("active")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            view === "active"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-text-muted hover:text-text"
          }`}
        >
          {isRtl ? "المصادر النشطة" : "Active Sources"}
        </button>
        <button
          onClick={() => setView("available")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            view === "available"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-text-muted hover:text-text"
          }`}
        >
          {isRtl ? "المصادر المتاحة" : "Available Sources"}
        </button>
      </div>

      {view === "active" && children}
      {view === "available" && (
        <AvailableSourcesSection
          existingSourceIds={existingSourceIds}
          locale={locale}
        />
      )}
    </div>
  );
}
