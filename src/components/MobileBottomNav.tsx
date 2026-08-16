"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeftRight,
  Bell,
  FileText,
  Filter,
  Globe,
  LayoutDashboard,
  MoreHorizontal,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const labels = {
  en: {
    dashboard: "Dashboard",
    results: "Results",
    filters: "Filters",
    alerts: "Alerts",
    listings: "Listings",
    sources: "Sources",
    more: "More",
    myResults: "My Results",
    jobs: "Jobs",
    users: "Users",
    notifications: "Notifications",
    settings: "Settings",
    userView: "User View",
  },
  ar: {
    dashboard: "لوحة التحكم",
    results: "النتائج",
    filters: "الفلاتر",
    alerts: "التنبيهات",
    listings: "الإعلانات",
    sources: "المصادر",
    more: "المزيد",
    myResults: "نتائجي",
    jobs: "المهام",
    users: "المستخدمون",
    notifications: "التنبيهات",
    settings: "الإعدادات",
    userView: "عرض المستخدم",
  },
} as const;

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface MobileBottomNavProps {
  locale: string;
  role?: string;
}

export function MobileBottomNav({ locale, role }: MobileBottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const rawPathname = usePathname() || "";
  const pathname = rawPathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const isAdmin = role === "ADMIN";
  const isRtl = locale === "ar";

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const userItems: NavItem[] = [
    { label: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.results, href: "/dashboard/results", icon: FileText },
    { label: t.filters, href: "/dashboard/filters", icon: Filter },
    { label: t.alerts, href: "/dashboard/alerts", icon: Bell },
  ];

  const adminMainItems: NavItem[] = [
    { label: t.dashboard, href: "/admin", icon: LayoutDashboard },
    { label: t.listings, href: "/admin/listings", icon: FileText },
    { label: t.sources, href: "/admin/sources", icon: Globe },
  ];

  const adminMoreItems: NavItem[] = [
    { label: t.myResults, href: "/admin/my-results", icon: FileText },
    { label: t.jobs, href: "/admin/jobs", icon: Activity },
    { label: t.users, href: "/admin/users", icon: Users },
    { label: t.notifications, href: "/admin/notifications", icon: Bell },
    { label: t.settings, href: "/admin/settings", icon: Settings },
  ];

  const items = isAdmin ? adminMainItems : userItems;
  const isInMore = isAdmin && adminMoreItems.some((item) => isActive(item.href));

  useEffect(() => {
    if (!sheetOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally close the sheet whenever the route changes; resetting state on prop change is the documented use of this pattern
    setSheetOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-bg/95 backdrop-blur-xl border-t border-card-border pb-[env(safe-area-inset-bottom)]"
        aria-label={t.more}
      >
        <div className="grid h-16 grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs transition-all duration-300 ease-premium active:scale-[0.98]",
                  active ? "text-primary" : "text-text-muted hover:text-text"
                )}
                title={item.label}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-300 ease-premium",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => setSheetOpen(true)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-xs transition-all duration-300 ease-premium active:scale-[0.98]",
                sheetOpen || isInMore ? "text-primary" : "text-text-muted hover:text-text"
              )}
              title={t.more}
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-300 ease-premium",
                  (sheetOpen || isInMore) && "bg-primary/10"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
              </span>
              <span>{t.more}</span>
            </button>
          )}
        </div>
      </nav>

      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))]",
              "rounded-t-3xl border-t border-card-border bg-bg/95 shadow-ambient backdrop-blur-xl"
            )}
          >
            <div className="flex flex-col p-3 pt-4">
              <div
                className={cn(
                  "mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-border",
                  isRtl && "ms-auto me-auto"
                )}
              />
              {adminMoreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ease-premium active:scale-[0.98]",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-text hover:bg-surface"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="my-2 border-t border-card-border" />
              <Link
                href={`/${locale}/dashboard`}
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-primary transition-all duration-300 ease-premium hover:bg-primary/10 active:scale-[0.98]"
              >
                <ArrowLeftRight className="h-5 w-5 shrink-0" />
                <span>{t.userView}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
