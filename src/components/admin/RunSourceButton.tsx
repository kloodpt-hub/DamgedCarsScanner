"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCsrfToken } from "@/lib/csrf-client";

interface RunSourceButtonProps {
  sourceId: string;
  locale: string;
}

export function RunSourceButton({ sourceId, locale }: RunSourceButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isRtl = locale === "ar";

  const handleRun = async () => {
    setLoading(true);
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/scraper/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({ sourceId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          isRtl
            ? `تم: ${data.listingsFound} إعلان، ${data.newListings} جديد`
            : `Done: ${data.listingsFound} listings, ${data.newListings} new`
        );
        router.refresh();
      } else {
        toast.error(data.error || (isRtl ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(isRtl ? "فشل في تنفيذ المهمة" : "Failed to run job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRun}
      disabled={loading}
      title={isRtl ? "تشغيل الآن" : "Run Now"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  );
}
