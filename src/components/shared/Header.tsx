"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/shared/ThemeProvider";
import {
  Sun,
  Moon,
  Globe,
  LogOut,
  ChevronDown,
  ArrowLeft,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const labels = {
  en: {
    title: "Damaged Cars Scanner",
    language: "العربية",
    logout: "Logout",
    themeToggle: "Toggle theme",
    languageToggle: "Switch language",
  },
  ar: {
    title: "ماسح السيارات المتضررة",
    language: "EN",
    logout: "تسجيل الخروج",
    themeToggle: "تبديل السمة",
    languageToggle: "تغيير اللغة",
  },
} as const;

interface HeaderProps {
  locale: string;
  showBack?: boolean;
}

export function Header({ locale, showBack = false }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const t = labels[locale as keyof typeof labels] ?? labels.en;

  function handleLanguageSwitch() {
    const newLocale = locale === "en" ? "ar" : "en";
    const path = window.location.pathname;
    const segments = path.split("/");
    if (segments[1] === "en" || segments[1] === "ar") {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join("/") || `/${newLocale}`);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 text-text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-text">{t.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-text-muted hover:text-text hover:bg-surface transition-colors"
            aria-label={t.themeToggle}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={handleLanguageSwitch}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-surface transition-colors"
            aria-label={t.languageToggle}
          >
            <Globe className="h-4 w-4" />
            {t.language}
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline max-w-[150px] truncate">
                {session?.user?.email ?? "User"}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  userMenuOpen && "rotate-180"
                )}
              />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute end-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-card-bg p-1.5 shadow-lg">
                  <div className="px-3 py-2 border-b border-border mb-1.5">
                    <p className="text-sm font-medium text-text truncate">
                      {session?.user?.email}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {session?.user?.role}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.logout}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
