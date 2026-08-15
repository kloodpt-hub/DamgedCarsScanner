"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ArrowLeftRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLabels = {
  en: {
    dashboard: "Dashboard",
    listings: "Listings",
    results: "Results",
    myResults: "My Results",
    filters: "Filters",
    alerts: "Alerts",
    sources: "Sources",
    jobs: "Jobs",
    users: "Users",
    logout: "Logout",
    brand: "Car Deals Hunter",
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
    myResults: "نتائجي",
    filters: "الفلاتر",
    alerts: "التنبيهات",
    sources: "المصادر",
    jobs: "المهام",
    users: "المستخدمون",
    logout: "تسجيل الخروج",
    brand: "صائد عروض السيارات",
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
  locale: string;
  role?: string;
}

export function Sidebar({ locale, role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("sidebar-collapsed") === "true"
  );
  const rawPathname = usePathname() || "";
  const pathname = rawPathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  const t = navLabels[locale as keyof typeof navLabels] ?? navLabels.en;
  const isAdmin = role === "ADMIN";
  const isRtl = locale === "ar";

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const userNavItems: NavItem[] = [
    { label: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.results, href: "/dashboard/results", icon: FileText },
    { label: t.filters, href: "/dashboard/filters", icon: Filter },
    { label: t.alerts, href: "/dashboard/alerts", icon: Bell },
  ];

  const adminNavItems: NavItem[] = [
    { label: t.dashboard, href: "/admin", icon: LayoutDashboard },
    { label: t.myResults, href: "/admin/my-results", icon: FileText },
    { label: t.listings, href: "/admin/listings", icon: FileText },
    { label: t.sources, href: "/admin/sources", icon: Globe },
    { label: t.jobs, href: "/admin/jobs", icon: Activity },
    { label: t.users, href: "/admin/users", icon: Users },
    { label: t.alerts, href: "/admin/notifications", icon: Bell },
    { label: t.settings, href: "/admin/settings", icon: Settings },
  ];

  const isOnAdmin = pathname.startsWith("/admin");
  const navItems = isOnAdmin ? adminNavItems : userNavItems;

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarInner = (
    <>
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-gray-800 px-4 shrink-0",
          collapsed && "justify-center px-0"
        )}
      >
        <img
          src="/logo.png"
          alt=""
          className="h-8 w-8 shrink-0 rounded-lg object-cover"
        />
        {!collapsed && (
          <span className="text-lg font-bold text-white whitespace-nowrap">
            {t.brand}
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
              href={`/${locale}${item.href}`}
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

        {isAdmin && (
          <>
            {!collapsed && <div className="my-3 border-t border-gray-800" />}
            <Link
              href={`/${locale}${isOnAdmin ? "/dashboard" : "/admin"}`}
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

      <div className="border-t border-gray-800 p-3 space-y-1 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
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
          onClick={toggleCollapsed}
          className={cn(
            "hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors",
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
          {!collapsed && <span>{t.collapse}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 z-30 flex-col bg-gray-900 text-gray-300 transition-all duration-300",
          isRtl
            ? "right-0 border-s border-gray-800"
            : "left-0 border-e border-gray-800",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {sidebarInner}
      </aside>
    </>
  );
}
