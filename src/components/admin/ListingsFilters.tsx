"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface ListingsFiltersProps {
  search: string;
  sourceId: string;
  isRead: string;
  sources: { id: string; name: string }[];
  isRtl: boolean;
}

export function ListingsFilters({
  search,
  sourceId,
  isRead,
  sources,
  isRtl,
}: ListingsFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const routeParams = useParams<{ locale: string }>();
  const locale = routeParams?.locale ?? "en";
  const [isPending, startTransition] = useTransition();

  const submit = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/${locale}/admin/listings?${params.toString()}`);
    });
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card-bg p-4 shadow-ambient lg:flex-row lg:items-center"
      aria-busy={isPending}
    >
      <div className="relative w-full lg:max-w-sm lg:flex-1">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          type="text"
          name="search"
          defaultValue={search}
          placeholder={isRtl ? "بحث..." : "Search..."}
          className="ps-9"
          onChange={(e) => submit("search", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:flex lg:items-center">
        <Select
          name="sourceId"
          defaultValue={sourceId}
          onChange={(e) => submit("sourceId", e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="">{isRtl ? "جميع المصادر" : "All Sources"}</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select
          name="isRead"
          defaultValue={isRead}
          onChange={(e) => submit("isRead", e.target.value)}
          className="w-full sm:w-40"
        >
          <option value="">{isRtl ? "الكل" : "All"}</option>
          <option value="false">{isRtl ? "جديد" : "New"}</option>
          <option value="true">{isRtl ? "مقروء" : "Read"}</option>
        </Select>
      </div>
    </div>
  );
}
