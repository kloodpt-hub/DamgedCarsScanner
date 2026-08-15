"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";

const labels = {
  en: {
    title: "Car Deals Hunter",
    subtitle: "Create your account",
    name: "Full Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signUp: "Create Account",
    signingUp: "Creating account...",
    hasAccount: "Already have an account?",
    login: "Sign in",
    nameRequired: "Name is required",
    emailRequired: "Email is required",
    passwordRequired: "Password is required",
    passwordMin: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    emailExists: "An account with this email already exists",
    networkError: "Network error. Please try again.",
    success: "Account created successfully! Redirecting...",
  },
  ar: {
    title: "صائد عروض السيارات",
    subtitle: "إنشاء حساب جديد",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    signUp: "إنشاء حساب",
    signingUp: "جاري إنشاء الحساب...",
    hasAccount: "لديك حساب بالفعل؟",
    login: "تسجيل الدخول",
    nameRequired: "الاسم مطلوب",
    emailRequired: "البريد الإلكتروني مطلوب",
    passwordRequired: "كلمة المرور مطلوبة",
    passwordMin: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    passwordMismatch: "كلمتا المرور غير متطابقتين",
    emailExists: "يوجد حساب بهذا البريد الإلكتروني بالفعل",
    networkError: "خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
    success: "تم إنشاء الحساب بنجاح! جاري التحويل...",
  },
} as const;

type Locale = keyof typeof labels;

export default function RegisterPage() {
  const router = useRouter();
  const routeParams = useParams<{ locale: string }>();
  const locale = routeParams?.locale ?? "en";

  const [localeState] = useState<Locale>(locale as Locale);
  const t = labels[localeState];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate(): boolean {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    if (!name.trim()) errors.name = t.nameRequired;
    if (!email.trim()) errors.email = t.emailRequired;
    if (!password) errors.password = t.passwordRequired;
    else if (password.length < 8) errors.password = t.passwordMin;
    if (password !== confirmPassword)
      errors.confirmPassword = t.passwordMismatch;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(t.emailExists);
        } else {
          setError(data.error || t.networkError);
        }
        return;
      }

      setSuccess(t.success);
      setTimeout(() => router.push(`/${locale}/login`), 1500);
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text">{t.title}</h1>
          <p className="text-text-muted mt-2">{t.subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              {t.name}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`input ${fieldErrors.name ? "border-danger focus:ring-danger/50" : ""}`}
              placeholder="John Doe"
              autoComplete="name"
              disabled={loading}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.name}</p>
            )}
          </div>

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
              className={`input ${fieldErrors.email ? "border-danger focus:ring-danger/50" : ""}`}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
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
                className={`input pr-12 ${fieldErrors.password ? "border-danger focus:ring-danger/50" : ""}`}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-text-muted hover:text-text transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-danger">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">
              {t.confirmPassword}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }}
                className={`input pr-12 ${fieldErrors.confirmPassword ? "border-danger focus:ring-danger/50" : ""}`}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-text-muted hover:text-text transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-danger">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.signingUp}
              </>
            ) : (
              t.signUp
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          {t.hasAccount}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-primary hover:text-primary-hover transition-colors"
          >
            {t.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
