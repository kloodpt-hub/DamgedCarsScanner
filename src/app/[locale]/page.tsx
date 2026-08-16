"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Scan,
  Bell,
  Filter,
  Globe,
  UserRound,
  Send,
  Mail,
  SlidersHorizontal,
  CopyCheck,
  Languages,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LandingHeader } from "@/components/shared/LandingHeader";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";

const labels = {
  en: {
    // Branding
    appName: "Car Deals Hunter",
    tagline: "Discover damaged car deals across multiple sites automatically",
    getStarted: "Get Started",
    viewFeatures: "See what you get",
    heroNote: "Free forever. No credit card required.",
    bottomCtaTitle: "Ready to find your next deal?",
    bottomCtaDesc:
      "Join free, add your sources, set filters, and get alerts the moment a matching car is listed.",
    // How it works
    howTitle: "How it works",
    stepSignInTitle: "Sign up or sign in",
    stepSignInDesc: "Create a free account in seconds to start tracking car deals.",
    step1Title: "Add your sources",
    step1Desc: "Configure car listing sites to monitor — auto-didact.nl, Leboncoin, AutoScout24 and more.",
    step2Title: "Set your filters",
    step2Desc: "Define year, price, mileage, and damage criteria. Only matching cars appear in your results.",
    step3Title: "Get instant alerts",
    step3Desc: "Receive email or Telegram notifications the moment a matching car is listed.",
    step4Title: "Track everything",
    step4Desc: "All scraped cars are stored for deduplication. You only see what matches your filters.",
    featuresTitle: "What you get",
    features: [
      {
        icon: Send,
        title: "Telegram bot",
        desc: "Manage filters and receive car photos right in Telegram.",
      },
      {
        icon: Mail,
        title: "Email alerts",
        desc: "Instant notifications the moment a matching car is listed.",
      },
      {
        icon: Globe,
        title: "Multi-source",
        desc: "Monitor several listing sites from one dashboard.",
      },
      {
        icon: SlidersHorizontal,
        title: "Smart filters",
        desc: "Price, year, mileage, damage status and keyword exclusions.",
      },
      {
        icon: CopyCheck,
        title: "Deduplication",
        desc: "Repeated listings are stored and never shown twice.",
      },
      {
        icon: Languages,
        title: "Two languages",
        desc: "English and Arabic interface.",
      },
    ],
    // Login form
    signIn: "Sign In",
    signInSubtitle: "Sign in to your account",
    email: "Email",
    password: "Password",
    signingIn: "Signing in...",
    googleSignIn: "Continue with Google",
    or: "or",
    noAccount: "Don't have an account?",
    register: "Create one",
    invalidCredentials: "Invalid email or password",
    networkError: "Network error. Please try again.",
    emailRequired: "Email is required",
    passwordRequired: "Password is required",
    googleError: "Google sign-in failed. Make sure Google OAuth is configured.",
  },
  ar: {
    appName: "صائد عروض السيارات",
    tagline: "اكتشف عروض السيارات المتضررة عبر مواقع متعددة تلقائياً",
    getStarted: "ابدأ الآن",
    viewFeatures: "شاهد ما ستحصل عليه",
    heroNote: "مجاني للأبد. لا حاجة لبطاقة ائتمان.",
    bottomCtaTitle: "جاهز للعثور على صفقتك القادمة؟",
    bottomCtaDesc:
      "انضم مجانًا، أضف مصادرك، اضبط الفلاتر، واحصل على تنبيهات فور إدراج سيارة مطابقة.",
    // How it works
    howTitle: "كيف يعمل",
    stepSignInTitle: "سجّل أو ادخل إلى حسابك",
    stepSignInDesc: "أنشئ حساباً مجانياً في ثوانٍ لتبدأ بتتبع عروض السيارات.",
    step1Title: "أضف مصادرك",
    step1Desc: "قم بتكوين مواقع قوائم السيارات لمراقبتها — auto-didact.nl، ليبونكوان، أوتو سكوت 24 والمزيد.",
    step2Title: "اضبط الفلاتر",
    step2Desc: "حدد معايير السنة والسعر والمسافة والضرر. السيارات المطابقة فقط تظهر في نتائجك.",
    step3Title: "احصل على تنبيهات فورية",
    step3Desc: "تلق إشعارات البريد الإلكتروني أو تيليجرام فور إدراج سيارة مطابقة.",
    step4Title: "تتبع كل شيء",
    step4Desc: "يتم تخزين جميع السيارات المسحوبة لإزالة التكرار. أنت ترى فقط ما يطابق فلاترك.",
    featuresTitle: "ماذا تحصل عليه",
    features: [
      {
        icon: Send,
        title: "بوت تيليجرام",
        desc: "أدر الفلاتر واستقبل صور السيارات مباشرة في تيليجرام.",
      },
      {
        icon: Mail,
        title: "تنبيهات البريد الإلكتروني",
        desc: "إشعارات فورية بمجرد إدراج سيارة مطابقة.",
      },
      {
        icon: Globe,
        title: "مصادر متعددة",
        desc: "راقب عدة مواقع قوائم من لوحة تحكم واحدة.",
      },
      {
        icon: SlidersHorizontal,
        title: "فلاتر ذكية",
        desc: "السعر، السنة، المسافة، حالة الضرر واستبعاد الكلمات المفتاحية.",
      },
      {
        icon: CopyCheck,
        title: "إزالة التكرار",
        desc: "يتم تخزين القوائم المتكررة ولا تظهر مرتين أبداً.",
      },
      {
        icon: Languages,
        title: "لغتان",
        desc: "واجهة باللغتين الإنجليزية والعربية.",
      },
    ],
    signIn: "تسجيل الدخول",
    signInSubtitle: "تسجيل الدخول إلى حسابك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signingIn: "جاري تسجيل الدخول...",
    googleSignIn: "المتابعة مع Google",
    or: "أو",
    noAccount: "ليس لديك حساب؟",
    register: "إنشاء حساب",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    networkError: "خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
    emailRequired: "البريد الإلكتروني مطلوب",
    passwordRequired: "كلمة المرور مطلوبة",
    googleError: "فشل تسجيل الدخول عبر Google. تأكد من تكوين Google OAuth.",
  },
} as const;

type Locale = keyof typeof labels;

type Step = {
  icon: LucideIcon;
  title: string;
  desc: string;
  cta?: string;
  scrollTo?: string;
};

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams<{ locale: string }>();
  const locale = routeParams?.locale ?? "en";
  const isRtl = locale === "ar";
  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}/dashboard`;

  const [localeState] = useState<Locale>(locale as Locale);
  const t = labels[localeState];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = t.emailRequired;
    if (!password) errors.password = t.passwordRequired;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t.invalidCredentials);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
      // If we get here without redirect, something went wrong
    } catch {
      setError(t.googleError);
    } finally {
      setGoogleLoading(false);
    }
  }

  const steps: Step[] = [
    {
      icon: UserRound,
      title: t.stepSignInTitle,
      desc: t.stepSignInDesc,
      cta: t.getStarted,
      scrollTo: "auth-form",
    },
    { icon: Globe, title: t.step1Title, desc: t.step1Desc },
    { icon: Filter, title: t.step2Title, desc: t.step2Desc },
    { icon: Bell, title: t.step3Title, desc: t.step3Desc },
    { icon: Scan, title: t.step4Title, desc: t.step4Desc },
  ];

  const scrollToAuth = () =>
    document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <LandingHeader locale={locale} />

      {/* Ambient background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -start-24 h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -end-24 h-[24rem] w-[24rem] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="flex min-h-[100dvh] items-center py-28 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] items-center gap-14 lg:gap-20">
            {/* Left: value proposition */}
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-card-border bg-surface/70 px-4 py-2 shadow-ambient">
                  <span className="text-sm sm:text-base font-extrabold text-text">
                    {t.appName}
                  </span>
                </div>

                <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text leading-[1.08] tracking-tight">
                  {t.tagline}
                </h1>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={scrollToAuth}
                    className="group inline-flex items-center gap-3 rounded-full bg-primary ps-6 pe-1.5 py-1.5 text-sm font-medium text-white transition-all duration-300 ease-premium hover:bg-primary-hover active:scale-[0.98]"
                  >
                    {t.getStarted}
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 transition-transform duration-300 ease-premium group-hover:scale-105",
                        isRtl
                          ? "group-hover:-translate-x-0.5"
                          : "group-hover:translate-x-0.5"
                      )}
                    >
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("features")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-card-border bg-bg px-6 py-3 text-sm font-medium text-text transition-all duration-300 ease-premium hover:bg-surface active:scale-[0.98]"
                  >
                    {t.viewFeatures}
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Right: auth card */}
            <Reveal delay={150}>
              <div
                id="auth-form"
                className="rounded-[2rem] p-1.5 bg-surface/50 ring-1 ring-card-border"
              >
                <div className="rounded-[calc(2rem-0.375rem)] bg-bg p-6 sm:p-8 shadow-ambient">
                  <div className="mb-7 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Scan className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-text">
                      {t.signInSubtitle}
                    </h2>
                  </div>

                  {error && (
                    <div className="mb-5 flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 p-3.5 text-sm text-danger">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Google Sign In */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    className="w-full flex items-center justify-center gap-3 rounded-full border border-card-border bg-bg px-6 py-3 text-sm font-medium text-text transition-all duration-300 ease-premium hover:bg-surface active:scale-[0.98] disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {t.googleSignIn}
                  </button>

                  {/* Divider */}
                  <div className="my-6 flex items-center gap-4">
                    <span className="h-px flex-1 bg-card-border" />
                    <span className="rounded-full border border-card-border px-3 py-0.5 text-[11px] uppercase tracking-wide text-text-muted">
                      {t.or}
                    </span>
                    <span className="h-px flex-1 bg-card-border" />
                  </div>

                  {/* Email/Password Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="label">
                        {t.email}
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFieldErrors((prev) => ({
                            ...prev,
                            email: undefined,
                          }));
                        }}
                        className={`input ${fieldErrors.email ? "border-danger" : ""}`}
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={loading || googleLoading}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs text-danger">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="label">
                        {t.password}
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldErrors((prev) => ({
                              ...prev,
                              password: undefined,
                            }));
                          }}
                          className={`input pe-10 ${fieldErrors.password ? "border-danger" : ""}`}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={loading || googleLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors duration-300 ease-premium hover:text-text"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="mt-1 text-xs text-danger">
                          {fieldErrors.password}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="btn-primary w-full rounded-full py-3"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.signingIn}
                        </>
                      ) : (
                        t.signIn
                      )}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-text-muted">
                    {t.noAccount}{" "}
                    <Link
                      href={`/${locale}/register`}
                      className="font-medium text-primary transition-colors duration-300 ease-premium hover:text-primary-hover"
                    >
                      {t.register}
                    </Link>
                  </p>

                  <p className="mt-5 text-center text-xs text-text-muted">
                    {t.heroNote}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 sm:py-28">
          <Reveal>
            <h2 className="inline-flex items-center rounded-full border border-card-border bg-surface px-4 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              {t.howTitle}
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const featured = i === 0;
              return (
                <Reveal
                  key={i}
                  delay={i * 90}
                  className={cn(featured && "md:col-span-2")}
                >
                  <div
                    className={cn(
                      "group relative h-full overflow-hidden rounded-[1.75rem] ring-1 ring-card-border transition-all duration-500 ease-premium hover:-translate-y-1 active:scale-[0.99]",
                      featured
                        ? "bg-gradient-to-br from-primary/10 via-surface to-surface p-7 shadow-ambient"
                        : "bg-surface p-6 hover:ring-primary/40"
                    )}
                  >
                    <span className="absolute top-6 end-6 text-[11px] font-bold text-text-muted/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-500 ease-premium group-hover:scale-110 group-hover:-rotate-6">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-text">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {step.desc}
                    </p>
                    {step.cta && step.scrollTo && (
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById(step.scrollTo!)
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="btn-primary mt-6 w-full rounded-full"
                      >
                        {step.cta}
                      </button>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* What you get */}
        <section id="features" className="py-24 sm:py-28">
          <Reveal>
            <h2 className="inline-flex items-center rounded-full border border-card-border bg-surface px-4 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              {t.featuresTitle}
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {t.features.map((feature, i) => {
              const Icon = feature.icon;
              const wide = i === 0 || i === 3 || i === 5;
              return (
                <Reveal
                  key={i}
                  delay={(i % 3) * 90}
                  className={cn(wide && "lg:col-span-2")}
                >
                  <div className="group h-full rounded-[1.75rem] ring-1 ring-card-border bg-surface p-7 transition-all duration-500 ease-premium hover:-translate-y-1 hover:ring-primary/40 active:scale-[0.99]">
                    <div
                      className={cn(
                        wide ? "lg:flex lg:items-start lg:gap-6" : ""
                      )}
                    >
                      <div className="mb-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-500 ease-premium group-hover:scale-110 group-hover:-rotate-6 lg:mb-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text">
                          {feature.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-text-muted leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 sm:py-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-surface ring-1 ring-card-border">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 w-72 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
              />
              <div className="relative px-6 py-16 sm:px-12 sm:py-24 text-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
                  {t.bottomCtaTitle}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-text-muted leading-relaxed">
                  {t.bottomCtaDesc}
                </p>
                <button
                  type="button"
                  onClick={scrollToAuth}
                  className="group mx-auto mt-8 inline-flex items-center gap-3 rounded-full bg-primary ps-6 pe-1.5 py-1.5 text-sm font-medium text-white transition-all duration-300 ease-premium hover:bg-primary-hover active:scale-[0.98]"
                >
                  {t.getStarted}
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 transition-transform duration-300 ease-premium group-hover:scale-105",
                      isRtl
                        ? "group-hover:-translate-x-0.5"
                        : "group-hover:translate-x-0.5"
                    )}
                  >
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </span>
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
