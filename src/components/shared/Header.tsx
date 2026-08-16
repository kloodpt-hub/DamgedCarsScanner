"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, Globe, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useNotificationDrawer } from "@/components/shared/NotificationDrawer";
import { useSidebar } from "@/components/shared/SidebarProvider";
import { updateUserLocale } from "@/server/actions/settings";
import { cn } from "@/lib/utils";

const labels = {
  en: {
    brand: "Car Deals Hunter",
    localeLabel: "AR",
    localeTitle: "Switch to Arabic",
    themeTitle: "Toggle theme",
    bellTitle: "Notifications",
    logout: "Logout",
  },
  ar: {
    brand: "صائد عروض السيارات",
    localeLabel: "EN",
    localeTitle: "التبديل إلى الإنجليزية",
    themeTitle: "تبديل المظهر",
    bellTitle: "الإشعارات",
    logout: "تسجيل الخروج",
  },
} as const;

interface HeaderProps {
  locale: string;
}

const iconBtnClasses =
  "p-2.5 rounded-full text-text-muted transition-all duration-300 ease-premium hover:bg-surface hover:text-text active:scale-[0.96]";

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname() || "";
  const { theme, toggleTheme } = useTheme();
  const { toggle, unreadCount } = useNotificationDrawer();
  const { collapsed, mounted } = useSidebar();
  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const next = locale === "en" ? "ar" : "en";
  const href = `/${next}${pathname.replace(/^\/(en|ar)(?=\/|$)/, "")}`;
  const offset = !mounted || !collapsed ? "lg:start-64" : "lg:start-17";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[60] h-14 bg-bg/90 backdrop-blur border-b border-border transition-[inset-inline-start] duration-500 ease-premium lg:inset-x-auto lg:end-0",
        offset
      )}
    >
      <div className="flex h-full items-center justify-between gap-2 px-3 sm:px-4">
        <div className={cn("flex items-center gap-2.5", !collapsed && "lg:hidden")}>
          <img
            src="/logo.png"
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg object-cover"
          />
          <span className="hidden sm:inline text-sm font-bold text-text whitespace-nowrap">
            {t.brand}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={href}
            onClick={() => {
              document.cookie = `locale=${next};path=/;max-age=31536000;samesite=lax`;
              updateUserLocale(next).catch(() => {});
            }}
            className={cn(iconBtnClasses, "flex items-center gap-1.5 rounded-full")}
            title={t.localeTitle}
            aria-label={t.localeTitle}
          >
            <Globe className="h-5 w-5" />
            <span className="text-xs font-semibold">{t.localeLabel}</span>
          </Link>

          <button
            onClick={toggle}
            className={cn("relative", iconBtnClasses)}
            title={t.bellTitle}
            aria-label={t.bellTitle}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white ring-2 ring-bg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className={iconBtnClasses}
            title={t.themeTitle}
            aria-label={t.themeTitle}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className={iconBtnClasses}
            title={t.logout}
            aria-label={t.logout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
