"use client";

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
import { useSidebar } from "@/components/shared/SidebarProvider";

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
  const { collapsed, toggle: toggleCollapsed } = useSidebar();
  const rawPathname = usePathname() || "";
  const pathname = rawPathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  const t = navLabels[locale as keyof typeof navLabels] ?? navLabels.en;
  const isAdmin = role === "ADMIN";
  const isRtl = locale === "ar";

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

  const navItemClasses = cn(
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-premium active:scale-[0.98]",
    collapsed && "justify-center px-0"
  );

  const sidebarInner = (
    <>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!collapsed && isAdmin && (
          <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
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
                navItemClasses,
                active
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-surface hover:text-text"
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <span
                  className="absolute start-0 inset-y-2 w-1 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            {!collapsed && <div className="my-3 border-t border-card-border" />}
            <Link
              href={`/${locale}${isOnAdmin ? "/dashboard" : "/admin"}`}
              className={cn(
                navItemClasses,
                "text-primary hover:bg-primary/10"
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

      <div className="border-t border-card-border p-3 space-y-1 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className={cn(
            navItemClasses,
            "w-full text-text-muted hover:bg-surface hover:text-text"
          )}
          title={collapsed ? t.logout : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t.logout}</span>}
        </button>

        <button
          onClick={toggleCollapsed}
          aria-label={t.collapse}
          className={cn(
            navItemClasses,
            "hidden lg:flex w-full text-text-muted hover:bg-surface hover:text-text"
          )}
          title={collapsed ? t.collapse : undefined}
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
          "hidden lg:flex fixed inset-y-0 z-30 flex-col rounded-e-2xl bg-card-bg text-text shadow-ambient transition-all duration-500 ease-premium",
          isRtl
            ? "right-0 border-s border-card-border"
            : "left-0 border-e border-card-border",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {sidebarInner}
      </aside>
    </>
  );
}
