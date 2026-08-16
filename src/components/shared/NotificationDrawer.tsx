"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Car, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCsrfToken } from "@/lib/csrf-client";
import { cn, formatDate } from "@/lib/utils";

const labels = {
  en: {
    title: "Notifications",
    empty: "No notifications yet",
    viewAll: "View all",
    close: "Close notifications",
    view: "View listing",
    markRead: "Mark read",
    dismiss: "Dismiss",
    unread: "Unread",
    recent: "Recent",
    justNow: "just now",
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
  },
  ar: {
    title: "الإشعارات",
    empty: "لا توجد إشعارات بعد",
    viewAll: "عرض الكل",
    close: "إغلاق الإشعارات",
    view: "عرض الإعلان",
    markRead: "تحديد كمقروء",
    dismiss: "إغلاق",
    unread: "غير مقروء",
    recent: "الأحدث",
    justNow: "الآن",
    minutesAgo: (n: number) => `منذ ${n} دقيقة`,
    hoursAgo: (n: number) => `منذ ${n} ساعة`,
  },
} as const;

type DrawerLabels = typeof labels.en;

interface NotificationPayload {
  listingId: string;
  title: string;
  price: number | null;
  year: number | null;
  mileage: number | null;
  sourceName: string;
  imageUrl: string | null;
  url: string;
}

interface RecentNotification {
  id: string;
  title: string;
  price: number | null;
  year: number | null;
  mileage: number | null;
  damageStatus: string | null;
  canonicalUrl: string;
  imageUrl: string | null;
  sourceName: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationDrawerContextValue {
  open: () => void;
  close: () => void;
  toggle: () => void;
  unreadCount: number;
}

const NotificationDrawerContext =
  createContext<NotificationDrawerContextValue | null>(null);

function formatPrice(price: number | null | undefined): string {
  return price != null ? `€${price.toLocaleString()}` : "";
}

function metaText(parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((part) => part != null && String(part).length > 0)
    .join(" · ");
}

function relativeTime(createdAt: string, locale: string, t: DrawerLabels): string {
  const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return t.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.hoursAgo(hours);
  return formatDate(createdAt, locale);
}

export function useNotificationDrawer(): NotificationDrawerContextValue {
  const context = useContext(NotificationDrawerContext);
  if (!context) {
    throw new Error(
      "useNotificationDrawer must be used within NotificationDrawerProvider"
    );
  }
  return context;
}

export function NotificationDrawerProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<RecentNotification[]>([]);
  const [live, setLive] = useState<NotificationPayload | null>(null);
  const isRtl = locale === "ar";
  const t = labels[locale as keyof typeof labels] ?? labels.en;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      setRecent(Array.isArray(data.recent) ? data.recent : []);
    } catch {
      // Ignore network errors; the next poll will retry.
    }
  }, []);

  const markRead = useCallback(
    async (listingId: string) => {
      try {
        const csrfToken = await getCsrfToken();
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
          },
          body: JSON.stringify({ listingId }),
        });
        setRecent((prev) =>
          prev.map((item) =>
            item.id === listingId ? { ...item, isRead: true } : item
          )
        );
      } catch {
        // Ignore errors; the count refresh below reconciles state.
      } finally {
        refreshUnreadCount();
      }
    },
    [refreshUnreadCount]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "OPEN_NOTIFICATION") return;
      const payload = event.data?.payload as NotificationPayload | undefined;
      setLive(payload ?? null);
      setIsOpen(true);
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => refreshUnreadCount();
    load();
    const interval = window.setInterval(refreshUnreadCount, 60000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshUnreadCount();
    };
    const onFocus = () => refreshUnreadCount();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  const handleOpenListing = (item: RecentNotification) => {
    if (item.canonicalUrl) {
      window.open(item.canonicalUrl, "_blank", "noopener");
    }
    if (!item.isRead) {
      markRead(item.id);
    }
  };

  const handleLiveView = () => {
    if (!live) return;
    if (live.url) {
      window.open(live.url, "_blank", "noopener");
    }
    markRead(live.listingId);
    setIsOpen(false);
  };

  const handleLiveMarkRead = () => {
    if (!live) return;
    markRead(live.listingId);
    setLive(null);
    setIsOpen(false);
  };

  const handleLiveDismiss = () => {
    setLive(null);
    setIsOpen(false);
  };

  const contextValue = useMemo(
    () => ({ open, close, toggle, unreadCount }),
    [open, close, toggle, unreadCount]
  );

  const listItems = live
    ? recent.filter((item) => item.id !== live.listingId)
    : recent;

  return (
    <NotificationDrawerContext.Provider value={contextValue}>
      {children}
      <div
        onClick={close}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-premium",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        aria-hidden={!isOpen}
        className={cn(
          "fixed top-14 bottom-0 end-0 z-50 flex w-[92vw] max-w-md flex-col border-s border-card-border bg-bg/95 backdrop-blur-xl shadow-ambient",
          isOpen
            ? "visible translate-x-0 [transition:transform_500ms_cubic-bezier(0.32,0.72,0,1),visibility_0s]"
            : cn(
                isRtl ? "-translate-x-full" : "translate-x-full",
                "invisible pointer-events-none [transition:transform_500ms_cubic-bezier(0.32,0.72,0,1),visibility_0s_500ms]"
              )
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-card-border px-4">
          <h2 className="text-base font-bold text-text">{t.title}</h2>
          <button
            onClick={close}
            aria-label={t.close}
            className="-me-2.5 p-2.5 rounded-full text-text-muted transition-all duration-300 ease-premium hover:bg-surface hover:text-text active:scale-[0.96]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {live && (
          <div className="shrink-0 border-b border-card-border bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                {live.imageUrl ? (
                  <Image
                    src={live.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-muted">
                    <Car className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-text">
                  {live.title}
                </p>
                {live.price != null && (
                  <p className="mt-1 text-lg font-bold text-primary">
                    {formatPrice(live.price)}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-text-muted">
                  {metaText([
                    live.year,
                    live.mileage != null ? `${live.mileage.toLocaleString()} km` : null,
                    live.sourceName,
                  ])}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={handleLiveView}>
                {t.view}
              </Button>
              <Button size="sm" variant="outline" onClick={handleLiveMarkRead}>
                {t.markRead}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleLiveDismiss}>
                {t.dismiss}
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {listItems.length === 0 && !live ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-text-muted">
              <Bell className="mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm">{t.empty}</p>
            </div>
          ) : (
            <>
              {live && (
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t.recent}
                </p>
              )}
              <div className="space-y-1 p-2.5">
                {listItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleOpenListing(item)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-2.5 text-start transition-colors",
                      item.isRead
                        ? "border-transparent hover:bg-surface"
                        : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-muted">
                          <Bell className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm",
                          item.isRead ? "text-text-muted" : "font-medium text-text"
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {metaText([formatPrice(item.price), item.year, item.sourceName])}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {relativeTime(item.createdAt, locale, t as DrawerLabels)}
                      </p>
                    </div>
                    {!item.isRead && (
                      <span
                        aria-label={t.unread}
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-card-border p-3">
          <Link
            href={`/${locale}/dashboard/alerts`}
            onClick={close}
            className="flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-primary transition-all duration-300 ease-premium hover:bg-surface hover:text-primary-hover active:scale-[0.98]"
          >
            <Bell className="h-4 w-4" />
            {t.viewAll}
          </Link>
        </div>
      </aside>
    </NotificationDrawerContext.Provider>
  );
}
