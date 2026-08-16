"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { updateUserLocale } from "@/server/actions/settings";

const labels = {
  en: {
    brand: "Car Deals Hunter",
    localeLabel: "AR",
    localeTitle: "Switch to Arabic",
    themeTitle: "Toggle theme",
    cta: "Get Started",
  },
  ar: {
    brand: "صائد عروض السيارات",
    localeLabel: "EN",
    localeTitle: "التبديل إلى الإنجليزية",
    themeTitle: "تبديل المظهر",
    cta: "ابدأ الآن",
  },
} as const;

interface LandingHeaderProps {
  locale: string;
}

export function LandingHeader({ locale }: LandingHeaderProps) {
  const pathname = usePathname() || "";
  const { theme, toggleTheme } = useTheme();
  const isRtl = locale === "ar";
  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const next = locale === "en" ? "ar" : "en";
  const href = `/${next}${pathname.replace(/^\/(en|ar)(?=\/|$)/, "")}`;

  return (
    <header className="fixed inset-x-0 top-0 z-[60] h-14 bg-bg/90 backdrop-blur border-b border-card-border">
      <div className="flex h-full items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
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
            className="flex items-center gap-1.5 p-2.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
            title={t.localeTitle}
            aria-label={t.localeTitle}
          >
            <Globe className="h-5 w-5" />
            <span className="text-xs font-semibold">{t.localeLabel}</span>
          </Link>

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
            type="button"
            onClick={() =>
              document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth" })
            }
            className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            {t.cta}
          </button>
        </div>
      </div>
    </header>
  );
}
