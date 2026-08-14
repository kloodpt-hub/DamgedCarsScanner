"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Check,
  Send,
  Trash2,
} from "lucide-react";
import { markAsRead, markAsNotified, deleteListing } from "@/server/actions/listings";

const labels = {
  en: {
    markRead: "Mark as Read",
    notify: "Notify",
    view: "View",
    delete: "Delete",
    success: "Done",
    failed: "Failed",
  },
  ar: {
    markRead: "تحديد كمقروء",
    notify: "إشعار",
    view: "عرض",
    delete: "حذف",
    success: "تم",
    failed: "فشل",
  },
} as const;

interface ListingsActionsProps {
  listingId: string;
  canonicalUrl: string;
  isRead: boolean;
  isNotified: boolean;
  locale: string;
}

export function ListingsActions({
  listingId,
  canonicalUrl,
  isRead: initialRead,
  isNotified: initialNotified,
  locale,
}: ListingsActionsProps) {
  const [isRead, setIsRead] = useState(initialRead);
  const [isNotified, setIsNotified] = useState(initialNotified);
  const t = labels[locale as keyof typeof labels] ?? labels.en;

  const handleMarkRead = async () => {
    try {
      await markAsRead(listingId);
      setIsRead(true);
      toast.success(t.success);
    } catch {
      toast.error(t.failed);
    }
  };

  const handleNotify = async () => {
    try {
      await markAsNotified(listingId);
      setIsNotified(true);
      toast.success(t.success);
    } catch {
      toast.error(t.failed);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListing(listingId);
      toast.success(t.success);
      window.location.reload();
    } catch {
      toast.error(t.failed);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <a
        href={canonicalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded text-text-muted hover:text-primary hover:bg-surface transition-colors"
        title={t.view}
      >
        <ExternalLink className="h-4 w-4" />
      </a>
      {!isRead && (
        <button
          onClick={handleMarkRead}
          className="p-1.5 rounded text-text-muted hover:text-success hover:bg-surface transition-colors"
          title={t.markRead}
        >
          <Check className="h-4 w-4" />
        </button>
      )}
      {!isNotified && (
        <button
          onClick={handleNotify}
          className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-surface transition-colors"
          title={t.notify}
        >
          <Send className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={handleDelete}
        className="p-1.5 rounded text-text-muted hover:text-destructive hover:bg-surface transition-colors"
        title={t.delete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
