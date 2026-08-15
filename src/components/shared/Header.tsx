"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, Globe, LogOut, Moon, Scan, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useNotificationDrawer } from "@/components/shared/NotificationDrawer";
import { cn } from "@/lib/utils";

const labels = {
  en: {
    brand: "DCS Scanner",
    localeLabel: "AR",
    localeTitle: "Switch to Arabic",
    themeTitle: "Toggle theme",
    bellTitle: "Notifications",
    logout: "Logout",
  },
  ar: {
    brand: "DCS Scanner",
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

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname() || "";
  const { theme, toggleTheme } = useTheme();
  const { toggle, unreadCount } = useNotificationDrawer();
  const isRtl = locale === "ar";
  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const next = locale === "en" ? "ar" : "en";
  const href = `/${next}${pathname.replace(/^\/(en|ar)(?=\/|$)/, "")}`;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 h-14 bg-bg/90 backdrop-blur border-b border-card-border lg:inset-x-auto",
        isRtl ? "lg:left-0 lg:right-64" : "lg:left-64 lg:right-0"
      )}
    >
      <div className="flex h-full items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Scan className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline text-sm font-bold text-text whitespace-nowrap">
            {t.brand}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={href}
            className="flex items-center gap-1.5 p-2.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
            title={t.localeTitle}
            aria-label={t.localeTitle}
          >
            <Globe className="h-5 w-5" />
            <span className="text-xs font-semibold">{t.localeLabel}</span>
          </Link>

          <button
            onClick={toggle}
            className="relative p-2.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
            title={t.bellTitle}
            aria-label={t.bellTitle}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
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
            className="p-2.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
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
