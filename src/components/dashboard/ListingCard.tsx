"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Check,
  Send,
  Car,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { markAsRead, markAsNotified } from "@/server/actions/listings";
import { cn, formatCurrency, formatDate, truncate } from "@/lib/utils";

const labels = {
  en: {
    view: "View",
    markRead: "Mark Read",
    notify: "Notify",
    read: "Read",
    new: "New",
    failed: "Failed",
    markedRead: "Marked as read",
    notified: "Notification sent",
    year: "Year",
    mileage: "Mileage",
    price: "Price",
    date: "Date",
  },
  ar: {
    view: "عرض",
    markRead: "تحديد كمقروء",
    notify: "إشعار",
    read: "مقروء",
    new: "جديد",
    failed: "فشل",
    markedRead: "تم التحديد كمقروء",
    notified: "تم الإرسال",
    year: "السنة",
    mileage: "عدد الكيلومترات",
    price: "السعر",
    date: "التاريخ",
  },
} as const;

interface Listing {
  id: string;
  title: string;
  price: number | null;
  year: number | null;
  mileage: number | null;
  damageStatus: string | null;
  imageUrl: string | null;
  canonicalUrl: string;
  isRead: boolean;
  isNotified: boolean;
  createdAt: Date | string;
}

interface ListingCardProps {
  listing: Listing;
  locale: string;
}

export function ListingCard({ listing, locale }: ListingCardProps) {
  const [read, setRead] = useState(listing.isRead);
  const [notified, setNotified] = useState(listing.isNotified);
  const [imgError, setImgError] = useState(false);
  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const isRtl = locale === "ar";

  const handleMarkRead = async () => {
    try {
      await markAsRead(listing.id);
      setRead(true);
      toast.success(t.markedRead);
    } catch {
      toast.error(t.failed);
    }
  };

  const handleNotify = async () => {
    try {
      await markAsNotified(listing.id);
      setNotified(true);
      toast.success(t.notified);
    } catch {
      toast.error(t.failed);
    }
  };

  return (
    <div
      className={cn(
        "group rounded-2xl bg-surface/70 p-1.5 ring-1 ring-border/80",
        "transition-all duration-500 ease-premium hover:-translate-y-1 hover:shadow-ambient hover:ring-border",
        !read && "ring-primary/30"
      )}
    >
      <Card className="overflow-hidden rounded-[calc(1rem-0.375rem)] border-card-border p-0 shadow-none">
        <div className="relative aspect-[16/9] overflow-hidden bg-surface">
          {listing.imageUrl && !imgError ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              <Car className="h-10 w-10 opacity-30" />
            </div>
          )}
          <div className="absolute top-2.5 start-2.5 z-10 flex flex-wrap gap-1.5">
            {!read && (
              <Badge variant="default">{t.new}</Badge>
            )}
            {listing.damageStatus && (
              <Badge variant="warning">{listing.damageStatus}</Badge>
            )}
          </div>
        </div>

        <CardContent className="space-y-3 p-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-snug text-text line-clamp-2 min-h-[2.5rem]">
              {truncate(listing.title, 60)}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div className="min-w-0">
              <p className="text-xs text-text-muted">{t.year}</p>
              <p className="mt-0.5 text-sm font-medium text-text break-words">
                {listing.year ?? "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted">{t.mileage}</p>
              <p className="mt-0.5 text-sm font-medium text-text break-words">
                {listing.mileage != null
                  ? `${listing.mileage.toLocaleString()} km`
                  : "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted">{t.price}</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-primary break-words">
                {listing.price != null ? formatCurrency(listing.price) : "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted">{t.date}</p>
              <p className="mt-0.5 text-sm font-medium text-text break-words">
                {formatDate(listing.createdAt, locale)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-card-border/70">
            <a
              href={listing.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-border/70 transition-all duration-300 ease-premium hover:bg-primary/10 hover:ring-primary/30"
            >
              <ExternalLink className="h-3 w-3" />
              {t.view}
            </a>

            <div className="ms-auto flex items-center gap-1">
              {!read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkRead}
                  className="h-9 px-2.5 text-xs"
                >
                  <Check className="h-3 w-3" />
                  {t.markRead}
                </Button>
              )}
              {!notified && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNotify}
                  className="h-9 px-2.5 text-xs"
                >
                  <Send className="h-3 w-3" />
                  {t.notify}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
