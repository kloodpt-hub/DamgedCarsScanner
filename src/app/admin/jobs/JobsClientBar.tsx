"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { runAllJobs } from "@/server/actions/jobs";

interface JobsClientBarProps {
  locale: string;
  sources: { id: string; name: string }[];
  currentSourceId?: string;
  currentStatus?: string;
  hasRunning: boolean;
}

export function JobsClientBar({
  locale,
  sources,
  currentSourceId,
  currentStatus,
  hasRunning,
}: JobsClientBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRtl = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const handleRunAll = async () => {
    setLoading(true);
    try {
      const result = await runAllJobs();
      if (result.success && result.results) {
        const total = result.results.reduce((a, r) => a + r.listingsFound, 0);
        const newListings = result.results.reduce((a, r) => a + r.newListings, 0);
        toast.success(
          isRtl
            ? `تم: ${total} إعلان، ${newListings} جديد`
            : `Done: ${total} listings, ${newListings} new`
        );
        router.refresh();
      }
    } catch {
      toast.error(isRtl ? "فشل في تنفيذ المهام" : "Failed to run jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh || !hasRunning) {
      if (autoRefresh && !hasRunning) setAutoRefresh(false);
      return;
    }
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, hasRunning, router]);

  return (
    <div className={`flex flex-wrap items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
      <h1 className="text-2xl font-bold text-text mr-auto">
        {isRtl ? "سجل المهام" : "Job History"}
      </h1>

      <Select
        value={currentSourceId ?? ""}
        onChange={(e) => updateParam("sourceId", e.target.value)}
        className="w-48"
      >
        <option value="">{isRtl ? "جميع المصادر" : "All Sources"}</option>
        {sources.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      <Select
        value={currentStatus ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="w-40"
      >
        <option value="">{isRtl ? "جميع الحالات" : "All Statuses"}</option>
        <option value="pending">{isRtl ? "قيد الانتظار" : "Pending"}</option>
        <option value="running">{isRtl ? "قيد التنفيذ" : "Running"}</option>
        <option value="completed">{isRtl ? "مكتمل" : "Completed"}</option>
        <option value="failed">{isRtl ? "فشل" : "Failed"}</option>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setAutoRefresh(!autoRefresh)}
        className={autoRefresh ? "border-primary text-primary" : ""}
      >
        <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
        {isRtl ? "تحديث تلقائي" : "Auto Refresh"}
      </Button>

      <Button onClick={handleRunAll} loading={loading} size="sm">
        <Play className="h-4 w-4" />
        {isRtl ? "تشغيل الكل" : "Run All"}
      </Button>
    </div>
  );
}
