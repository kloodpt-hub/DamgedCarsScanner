"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";

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
    <div className="flex flex-col sm:flex-row gap-3" aria-busy={isPending}>
      <input
        type="text"
        name="search"
        defaultValue={search}
        placeholder={isRtl ? "بحث..." : "Search..."}
        className="input flex-1 max-w-sm"
        onChange={(e) => submit("search", e.target.value)}
      />
      <select
        name="sourceId"
        defaultValue={sourceId}
        className="input"
        onChange={(e) => submit("sourceId", e.target.value)}
      >
        <option value="">{isRtl ? "جميع المصادر" : "All Sources"}</option>
        {sources.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <select
        name="isRead"
        defaultValue={isRead}
        className="input"
        onChange={(e) => submit("isRead", e.target.value)}
      >
        <option value="">{isRtl ? "الكل" : "All"}</option>
        <option value="false">{isRtl ? "جديد" : "New"}</option>
        <option value="true">{isRtl ? "مقروء" : "Read"}</option>
      </select>
    </div>
  );
}
