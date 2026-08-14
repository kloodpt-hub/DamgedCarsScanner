"use client";

import { useEffect, useState } from "react";
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
  Scan,
  ArrowLeftRight,
  Settings,
  Menu,
  X,
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
    myResults: "نتائجي",
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
  locale: string;
  role?: string;
}

export function Sidebar({ locale, role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() || "";
  const t = navLabels[locale as keyof typeof navLabels] ?? navLabels.en;
  const isAdmin = role === "ADMIN";
  const isRtl = locale === "ar";

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

        {isAdmin && (
          <>
            {!collapsed && <div className="my-3 border-t border-gray-800" />}
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

      <div className="border-t border-gray-800 p-3 space-y-1 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
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
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 start-4 z-40 p-2 rounded-lg bg-gray-900 text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 z-50 flex flex-col bg-gray-900 text-gray-300 transition-transform duration-300 w-64",
          isRtl ? "right-0" : "left-0",
          mobileOpen
            ? "translate-x-0"
            : isRtl
              ? "translate-x-full"
              : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 end-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarInner}
      </aside>

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
