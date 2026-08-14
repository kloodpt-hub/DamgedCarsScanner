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
    <Card className={cn("group overflow-hidden transition-all hover:shadow-lg", !read && "ring-1 ring-primary/30")}>
      <div className="relative h-40 bg-surface overflow-hidden">
        {listing.imageUrl && !imgError ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            <Car className="h-12 w-12 opacity-30" />
          </div>
        )}
        <div className="absolute top-2 start-2 flex gap-1.5">
          {!read && (
            <Badge variant="default">{t.new}</Badge>
          )}
          {listing.damageStatus && (
            <Badge variant="warning">{listing.damageStatus}</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-text line-clamp-2 min-h-[2.5rem]">
            {truncate(listing.title, 60)}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
            {listing.year && <span>{listing.year}</span>}
            {listing.mileage != null && (
              <span>{listing.mileage.toLocaleString()} km</span>
            )}
          </div>
        </div>

        {listing.price != null && (
          <p className="text-lg font-bold text-primary">
            {formatCurrency(listing.price)}
          </p>
        )}

        <p className="text-xs text-text-muted">
          {formatDate(listing.createdAt, locale)}
        </p>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <a
            href={listing.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
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
                className="h-7 px-2 text-xs"
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
                className="h-7 px-2 text-xs"
              >
                <Send className="h-3 w-3" />
                {t.notify}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
