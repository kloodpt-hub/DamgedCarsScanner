"use client";

import { useState } from "react";
import { Images, X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const labels = {
  en: {
    viewImages: "View Images",
    loading: "Loading...",
    noImages: "No additional images available",
    close: "Close",
  },
  ar: {
    viewImages: "عرض الصور",
    loading: "جاري التحميل...",
    noImages: "لا توجد صور إضافية متاحة",
    close: "إغلاق",
  },
} as const;

interface ImageGalleryProps {
  listingId: string;
  canonicalUrl: string;
  mainImageUrl?: string | null;
  locale?: string;
}

export function ImageGallery({
  listingId,
  canonicalUrl,
  mainImageUrl,
  locale = "en",
}: ImageGalleryProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoomed, setZoomed] = useState<string | null>(null);
  const t = labels[locale as keyof typeof labels] ?? labels.en;

  const handleOpen = async () => {
    setOpen(true);
    if (images !== null) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/images`);
      if (!res.ok) {
        setImages([]);
        return;
      }
      const data = await res.json();
      setImages(data.images ?? []);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images?.filter((img) => img !== mainImageUrl) ?? [];
  const hasExtra = filteredImages.length > 0;

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-border/70 transition-all duration-300 ease-premium hover:bg-primary/10 hover:ring-primary/30"
      >
        <Images className="h-3 w-3" />
        {t.viewImages}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            setOpen(false);
            setZoomed(null);
          }}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-card-bg ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-text">{t.viewImages}</h3>
              <button
                onClick={() => {
                  setOpen(false);
                  setZoomed(null);
                }}
                className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-surface transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(85vh - 56px)" }}>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-text-muted gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.loading}
                </div>
              ) : !hasExtra ? (
                <p className="py-16 text-center text-sm text-text-muted">{t.noImages}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setZoomed(img)}
                      className="group relative overflow-hidden rounded-xl bg-surface ring-1 ring-border/50 hover:ring-primary/50 transition-all"
                    >
                      <img
                        src={img}
                        alt={`Image ${i + 1}`}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {zoomed && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
              onClick={() => setZoomed(null)}
            >
              <img
                src={zoomed}
                alt="Zoomed"
                className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain ring-1 ring-border"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
