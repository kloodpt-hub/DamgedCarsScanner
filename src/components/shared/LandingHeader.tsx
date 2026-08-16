"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Globe, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { updateUserLocale } from "@/server/actions/settings";
import { cn } from "@/lib/utils";

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

  const iconBtnClasses =
    "flex h-9 items-center justify-center rounded-full text-text-muted transition-all duration-300 ease-premium hover:bg-surface hover:text-text active:scale-[0.96]";

  return (
    <header className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4">
      <nav
        aria-label={t.brand}
        className="mt-6 flex w-max items-center gap-1 rounded-full border border-card-border bg-bg/80 p-1.5 shadow-ambient backdrop-blur-xl"
      >
        <div className="flex items-center gap-2.5 py-1 ps-1.5 pe-2">
          <img
            src="/logo.png"
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
          <span className="hidden sm:inline text-sm font-bold text-text whitespace-nowrap">
            {t.brand}
          </span>
        </div>

        <span className="mx-1 hidden sm:inline h-5 w-px bg-border" />

        <Link
          href={href}
          onClick={() => {
            document.cookie = `locale=${next};path=/;max-age=31536000;samesite=lax`;
            updateUserLocale(next).catch(() => {});
          }}
          className={cn(iconBtnClasses, "gap-1.5 px-2.5 sm:px-3")}
          title={t.localeTitle}
          aria-label={t.localeTitle}
        >
          <Globe className="h-5 w-5" />
          <span className="hidden sm:inline text-xs font-semibold">
            {t.localeLabel}
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          className={cn(iconBtnClasses, "w-9")}
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
            document
              .getElementById("auth-form")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="group flex h-9 items-center gap-2 rounded-full bg-primary ps-4 pe-1.5 text-sm font-medium text-white transition-all duration-300 ease-premium hover:bg-primary-hover active:scale-[0.98]"
        >
          {t.cta}
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 transition-transform duration-300 ease-premium group-hover:scale-105",
              isRtl
                ? "group-hover:-translate-x-0.5"
                : "group-hover:translate-x-0.5"
            )}
          >
            {isRtl ? (
              <ArrowLeft className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </span>
        </button>
      </nav>
    </header>
  );
}
