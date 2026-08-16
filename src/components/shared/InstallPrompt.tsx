"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Download, Gift, Globe, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { isIosDevice } from "@/lib/push-client";

const labels = {
  en: {
    title: "Install Car Deals Hunter",
    subtitle: "Get the app on your device for faster access and instant alerts.",
    install: "Install App Now",
    close: "Close",
    iosHint: "Tap Share, then Add to Home Screen",
    notAvailable: "Use your browser menu to install this app",
    features: [
      { icon: Bell, text: "Instant alerts on new deals" },
      { icon: Globe, text: "Multiple platforms in one place" },
      { icon: SlidersHorizontal, text: "Smart filters & rules" },
      { icon: Gift, text: "Free forever" },
    ],
  },
  ar: {
    title: "تثبيت صائد عروض السيارات",
    subtitle: "احصل على التطبيق على جهازك للوصول الأسرع والتنبيهات الفورية.",
    install: "ثبّت التطبيق الآن",
    close: "إغلاق",
    iosHint: "اضغط مشاركة، ثم أضف إلى الشاشة الرئيسية",
    notAvailable: "استخدم قائمة المتصفح لتثبيت هذا التطبيق",
    features: [
      { icon: Bell, text: "تنبيهات فورية على العروض الجديدة" },
      { icon: Globe, text: "منصات متعددة في مكان واحد" },
      { icon: SlidersHorizontal, text: "فلاتر وقواعد ذكية" },
      { icon: Gift, text: "مجاني للأبد" },
    ],
  },
} as const;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const INSTALLED_KEY = "install-prompt-installed";
const VISITS_KEY = "install-prompt-visits";
const DISMISSED_KEY = "install-prompt-dismissed-at";
const SESSION_VISITED_KEY = "install-prompt-visited";

export function InstallPrompt({ locale = "en" }: { locale?: string }) {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const visits = useRef(0);

  const t = labels[locale === "ar" ? "ar" : "en"];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const setInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        // Ignore storage access errors.
      }
      setShow(false);
    };

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      localStorage.getItem(INSTALLED_KEY) === "1"
    ) {
      setInstalled();
      return;
    }

    let currentVisits = 0;
    try {
      currentVisits = Number(localStorage.getItem(VISITS_KEY) || "0");
    } catch {
      // Ignore storage access errors.
    }
    if (!sessionStorage.getItem(SESSION_VISITED_KEY)) {
      try {
        sessionStorage.setItem(SESSION_VISITED_KEY, "1");
      } catch {
        // Ignore storage access errors.
      }
      currentVisits += 1;
      try {
        localStorage.setItem(VISITS_KEY, String(currentVisits));
      } catch {
        // Ignore storage access errors.
      }
    }
    visits.current = currentVisits;

    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || "0");
    } catch {
      // Ignore storage access errors.
    }

    const shouldShow = dismissedAt === 0 ? true : currentVisits - dismissedAt >= 3;
    if (!shouldShow) return;

    const timer = setTimeout(() => setShow(true), 4000);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
    };
    const onAppInstalled = () => setInstalled();

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const recordDismissal = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(visits.current));
    } catch {
      // Ignore storage access errors.
    }
  };

  const handleInstall = async () => {
    const promptEvent = deferredPrompt.current;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          try {
            localStorage.setItem(INSTALLED_KEY, "1");
          } catch {
            // Ignore storage access errors.
          }
          setShow(false);
          return;
        }
      } catch {
        // Ignore prompt errors; fall through to dismissal handling.
      }
      recordDismissal();
      setShow(false);
      return;
    }
    if (isIosDevice()) {
      toast(t.iosHint);
      return;
    }
    toast(t.notAvailable);
  };

  const handleClose = () => {
    recordDismissal();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 lg:bottom-4 z-[55] flex justify-center px-4 pointer-events-none animate-[slide-up-fade_0.5s_cubic-bezier(0.32,0.72,0,1)]">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-card-border bg-bg/95 p-4 shadow-ambient backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text">{t.title}</h3>
            <p className="mt-0.5 text-xs text-text-muted">{t.subtitle}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstall}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-success text-sm font-semibold text-white transition-all duration-300 ease-premium hover:brightness-95 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            {t.install}
          </button>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.close}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger transition-all duration-300 ease-premium hover:bg-danger/20 active:scale-[0.96]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          {t.features.map((feature) => {
            const FeatureIcon = feature.icon;
            return (
              <li key={feature.text} className="flex items-center gap-2 text-xs text-text-muted">
                <FeatureIcon className="h-3.5 w-3.5 shrink-0 text-success" />
                <span className="min-w-0">{feature.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
