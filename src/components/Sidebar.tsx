"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Filter,
  Bell,
  Globe,
  Activity,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Scan,
  ArrowLeftRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLabels = {
  en: {
    dashboard: "Dashboard",
    listings: "Listings",
    results: "Results",
    filters: "Filters",
    alerts: "Alerts",
    sources: "Sources",
    jobs: "Jobs",
    users: "Users",
    logout: "Logout",
    brand: "DCS Scanner",
    adminSection: "Admin",
    userSection: "User",
    switchToUser: "User View",
    switchToAdmin: "Admin Panel",
    collapse: "Collapse",
    settings: "Settings",
  },
  ar: {
    dashboard: "لوحة التحكم",
    listings: "الإعلانات",
    results: "النتائج",
    filters: "الفلاتر",
    alerts: "التنبيهات",
    sources: "المصادر",
    jobs: "المهام",
    users: "المستخدمون",
    logout: "تسجيل الخروج",
    brand: "DCS Scanner",
    adminSection: "الإدارة",
    userSection: "المستخدم",
    switchToUser: "عرض المستخدم",
    switchToAdmin: "لوحة الإدارة",
    collapse: "تصغير",
    settings: "الإعدادات",
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
  role?: string;
}

export function Sidebar({ currentPath, locale, role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const t = navLabels[locale as keyof typeof navLabels] ?? navLabels.en;
  const isAdmin = role === "ADMIN";

  const userNavItems: NavItem[] = [
    { label: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.results, href: "/dashboard/results", icon: FileText },
    { label: t.filters, href: "/dashboard/filters", icon: Filter },
    { label: t.alerts, href: "/dashboard/alerts", icon: Bell },
  ];

  const adminNavItems: NavItem[] = [
    { label: t.dashboard, href: "/admin", icon: LayoutDashboard },
    { label: t.listings, href: "/admin/listings", icon: FileText },
    { label: t.sources, href: "/admin/sources", icon: Globe },
    { label: t.jobs, href: "/admin/jobs", icon: Activity },
    { label: t.users, href: "/admin/users", icon: Users },
    { label: t.alerts, href: "/admin/notifications", icon: Bell },
    { label: t.settings, href: "/admin/settings", icon: Settings },
  ];

  const isOnAdmin = currentPath.startsWith("/admin");
  const navItems = isOnAdmin ? adminNavItems : userNavItems;

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/dashboard") {
      return currentPath === href;
    }
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
      {/* Brand */}
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* Section label */}
        {!collapsed && isAdmin && (
          <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {isOnAdmin ? t.adminSection : t.userSection}
          </p>
        )}

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

        {/* Role switcher for admins */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="my-3 border-t border-gray-800" />
            )}
            <Link
              href={isOnAdmin ? "/dashboard" : "/admin"}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                "text-primary hover:bg-primary/10",
                collapsed && "justify-center px-0"
              )}
              title={
                collapsed
                  ? isOnAdmin
                    ? t.switchToUser
                    : t.switchToAdmin
                  : undefined
              }
            >
              <ArrowLeftRight className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span>
                  {isOnAdmin ? t.switchToUser : t.switchToAdmin}
                </span>
              )}
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
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
            <span>{t.collapse}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
