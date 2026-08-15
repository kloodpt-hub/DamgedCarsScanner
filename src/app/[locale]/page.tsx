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
  Search,
  Bell,
  Filter,
  Globe,
  UserRound,
  Send,
  Mail,
  SlidersHorizontal,
  CopyCheck,
  Languages,
} from "lucide-react";

const labels = {
  en: {
    // Branding
    appName: "Car Deals Hunter",
    tagline: "Discover damaged car deals across multiple sites automatically",
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

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams<{ locale: string }>();
  const locale = routeParams?.locale ?? "en";
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

  const steps = [
    { icon: UserRound, title: t.stepSignInTitle, desc: t.stepSignInDesc },
    { icon: Globe, title: t.step1Title, desc: t.step1Desc },
    { icon: Filter, title: t.step2Title, desc: t.step2Desc },
    { icon: Bell, title: t.step3Title, desc: t.step3Desc },
    { icon: Scan, title: t.step4Title, desc: t.step4Desc },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-bg">
      {/* Left: Explanation / Branding */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-20 bg-surface relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl object-cover" />
            <span className="text-2xl font-bold text-text">{t.appName}</span>
          </div>

          {/* Tagline */}
          <p className="text-lg text-text-muted mb-10 leading-relaxed">
            {t.tagline}
          </p>

          {/* How it works */}
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">
            {t.howTitle}
          </h2>

          <div className="space-y-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-muted mt-1 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6 mt-10">
            {t.featuresTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="rounded-lg bg-surface border border-card-border p-3"
                >
                  <Icon className="h-4 w-4 text-primary mb-2" />
                  <h3 className="text-xs font-semibold text-text">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center px-6 py-12 lg:px-12 bg-bg">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-text">{t.signIn}</h1>
            <p className="text-text-muted text-sm mt-1">{t.signInSubtitle}</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text hover:bg-surface/80 transition-colors disabled:opacity-50"
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
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted uppercase">{t.or}</span>
            <div className="flex-1 h-px bg-border" />
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
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`input ${fieldErrors.email ? "border-danger" : ""}`}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading || googleLoading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>
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
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`input pr-10 ${fieldErrors.password ? "border-danger" : ""}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading || googleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
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
                <p className="mt-1 text-xs text-danger">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-primary w-full"
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
              className="font-medium text-primary hover:text-primary-hover transition-colors"
            >
              {t.register}
            </Link>
          </p>
        </div>
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
