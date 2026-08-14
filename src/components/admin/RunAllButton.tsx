"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAllJobs } from "@/server/actions/jobs";

interface RunAllButtonProps {
  locale: string;
}

export function RunAllButton({ locale }: RunAllButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isRtl = locale === "ar";

  const handleRun = async () => {
    setLoading(true);
    try {
      const result = await runAllJobs();
      if (result?.success && result.results) {
        const total = result.results.reduce((a, r) => a + r.listingsFound, 0);
        const newListings = result.results.reduce((a, r) => a + r.newListings, 0);
        toast.success(
          isRtl
            ? `تم الانتهاء: ${total} إعلان، ${newListings} جديد`
            : `Done: ${total} listings, ${newListings} new`
        );
        router.refresh();
      } else {
        toast.error(isRtl ? "فشل في تنفيذ المهام" : "Failed to run scrapers");
      }
    } catch {
      toast.error(isRtl ? "فشل في تنفيذ المهام" : "Failed to run jobs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleRun} loading={loading} disabled={loading}>
      <Play className="h-4 w-4" />
      {isRtl ? "تشغيل الكل" : "Run All Scrapers"}
    </Button>
  );
}
