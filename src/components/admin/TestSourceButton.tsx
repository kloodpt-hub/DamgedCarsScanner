"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestSourceButtonProps {
  sourceId: string;
  locale: string;
}

export function TestSourceButton({ sourceId, locale }: TestSourceButtonProps) {
  const [loading, setLoading] = useState(false);
  const isRtl = locale === "ar";

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scraper/test/${sourceId}`);
      const data = await res.json();
      if (res.ok) {
        const previewSnippet = data.htmlPreview
          ? data.htmlPreview.slice(0, 300).replace(/\s+/g, " ")
          : "N/A";
        const message = [
          `Listings: ${data.listingsCount}`,
          data.firstListing ? `First: ${data.firstListing.title}` : "",
          `HTML preview: ${previewSnippet}`,
        ]
          .filter(Boolean)
          .join("\n");
        toast.info(message, { duration: 10000 });
      } else {
        toast.error(data.error || (isRtl ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(isRtl ? "فشل في اختبار المصدر" : "Failed to test source");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleTest}
      disabled={loading}
      title={isRtl ? "اختبار" : "Test"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FlaskConical className="h-4 w-4" />
      )}
    </Button>
  );
}
