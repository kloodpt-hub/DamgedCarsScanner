"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Filter,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Scan,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLabels = {
  en: {
    dashboard: "Dashboard",
    listings: "Listings",
    filters: "Filters",
    alerts: "Alerts",
    logout: "Logout",
    brand: "DCS Scanner",
  },
  ar: {
    dashboard: "لوحة التحكم",
    listings: "الإعلانات",
    filters: "الفلاتر",
    alerts: "التنبيهات",
    logout: "تسجيل الخروج",
    brand: "DCS Scanner",
  },
} as const;

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarProps {
  currentPath: string;
  locale: string;
}

export function Sidebar({ currentPath, locale }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const t = navLabels[locale as keyof typeof navLabels] ?? navLabels.en;

  const navItems: NavItem[] = [
    { label: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.listings, href: "/dashboard/listings", icon: FileText },
    { label: t.filters, href: "/dashboard/filters", icon: Filter },
    { label: t.alerts, href: "/dashboard/alerts", icon: Bell },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(href);
  };

  const isRtl = locale === "ar";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-30 flex flex-col bg-gray-900 text-gray-300 transition-all duration-300",
        isRtl
          ? "right-0 border-s border-gray-800"
          : "left-0 border-e border-gray-800",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-gray-800 px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Scan className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-white whitespace-nowrap">
            {t.brand}
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-3 space-y-1">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? t.logout : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t.logout}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          {isRtl ? (
            collapsed ? (
              <ChevronLeft className="h-5 w-5 shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 shrink-0" />
            )
          ) : collapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" />
          ) : (
            <ChevronLeft className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && (
            <span>{isRtl ? "تصغير" : "Collapse"}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
