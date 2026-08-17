"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

const labels = {
  en: {
    viewImages: "View Images",
    loading: "Loading...",
    noImages: "No additional images available",
    close: "Close",
    imageCounter: (current: number, total: number) => `${current} / ${total}`,
  },
  ar: {
    viewImages: "عرض الصور",
    loading: "جاري التحميل...",
    noImages: "لا توجد صور إضافية متاحة",
    close: "إغلاق",
    imageCounter: (current: number, total: number) => `${current} / ${total}`,
  },
} as const;

/* ── Carousel Sub-Component ───────────────────────────────────────── */

interface ImageCarouselProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

function ImageCarousel({ images, initialIndex = 0, onClose }: ImageCarouselProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning || idx === current) return;
      const clamped = Math.max(0, Math.min(idx, total - 1));
      setIsTransitioning(true);
      setCurrent(clamped);
      setTimeout(() => setIsTransitioning(false), 350);
    },
    [current, isTransitioning, total],
  );

  const prev = useCallback(() => goTo(current - 1), [goTo, current]);
  const next = useCallback(() => goTo(current + 1), [goTo, current]);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Home") goTo(0);
      if (e.key === "End") goTo(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, goTo, total]);

  /* Scroll active thumbnail into view */
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const active = container.children[current] as HTMLElement | undefined;
    if (!active) return;
    const left = active.offsetLeft - container.offsetWidth / 2 + active.offsetWidth / 2;
    container.scrollTo({ left, behavior: "smooth" });
  }, [current]);

  /* Touch / Swipe */
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDelta) > 50) {
      if (touchDelta < 0) next();
      else prev();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  const isRtl =
    typeof document !== "undefined" &&
    document.documentElement.dir === "rtl";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Main Image Area ── */}
      <div
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10 select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Sliding track */}
        <div
          className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            transform: `translateX(${
              (isRtl ? 1 : -1) * current * 100 + (isRtl ? 1 : -1) * (touchDelta / (typeof window !== "undefined" ? window.innerWidth : 1)) * 100
            }%)`,
          }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="relative h-full min-w-full shrink-0"
            >
              <img
                src={src}
                alt={`Image ${i + 1}`}
                className="h-full w-full object-cover"
                loading={Math.abs(i - current) <= 1 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {current > 0 && (
          <button
            onClick={isRtl ? next : prev}
            aria-label="Previous image"
            className="absolute top-1/2 -translate-y-1/2 start-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/70 hover:text-white hover:scale-105 opacity-0 md:opacity-100 hover:focus-visible:outline-2 hover:focus-visible:outline-offset-2 hover:focus-visible:outline-primary max-md:!opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {current < total - 1 && (
          <button
            onClick={isRtl ? prev : next}
            aria-label="Next image"
            className="absolute top-1/2 -translate-y-1/2 end-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/70 hover:text-white hover:scale-105 opacity-0 md:opacity-100 hover:focus-visible:outline-2 hover:focus-visible:outline-offset-2 hover:focus-visible:outline-primary max-md:!opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Counter badge – top-right */}
        <div className="absolute top-3 end-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md ring-1 ring-white/10 tabular-nums">
          {current + 1} / {total}
        </div>
      </div>

      {/* ── Pagination Dots ── */}
      {total <= 20 && (
        <div className="flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                i === current
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Thumbnail Strip ── */}
      <div
        ref={thumbsRef}
        className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to image ${i + 1}`}
            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ring-offset-2 ring-offset-card-bg ${
              i === current
                ? "ring-2 ring-primary scale-[1.03]"
                : "ring-1 ring-white/10 opacity-50 hover:opacity-80 hover:ring-white/20"
            }`}
          >
            <img
              src={src}
              alt={`Thumb ${i + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main ImageGallery Component ──────────────────────────────────── */

interface ImageGalleryProps {
  listingId: string;
  canonicalUrl: string;
  mainImageUrl?: string | null;
  locale?: string;
}

export function ImageGallery({
  listingId,
  mainImageUrl,
  locale = "en",
}: ImageGalleryProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
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

  const filteredImages =
    images?.filter((img) => img !== mainImageUrl) ?? [];
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
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-card-bg/95 ring-1 ring-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] animate-[slide-up-fade_0.4s_ease-[cubic-bezier(0.32,0.72,0,1)]]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="text-sm font-semibold text-text">
                {t.viewImages}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-surface transition-colors duration-200"
                aria-label={t.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(85vh - 56px)" }}>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-text-muted gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.loading}
                </div>
              ) : !hasExtra ? (
                <p className="py-16 text-center text-sm text-text-muted">
                  {t.noImages}
                </p>
              ) : (
                <ImageCarousel
                  images={filteredImages}
                  onClose={() => setOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
