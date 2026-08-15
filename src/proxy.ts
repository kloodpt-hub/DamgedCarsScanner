import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { locales, isLocale, defaultLocale, type Locale } from "@/lib/i18n/routing";

const protectedRoutes = ["/dashboard", "/admin"];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function getSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://accounts.google.com https://www.googleapis.com https://fcm.googleapis.com https://android.googleapis.com https://updates.push.services.mozilla.com; frame-ancestors 'none'"
  );
  return response;
}

function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const entries = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q = "q=1"] = part.trim().split(";q=");
      const quality = parseFloat(q.trim()) || 0;
      return { tag: tag.trim().toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const entry of entries) {
    const lang = entry.tag;
    if (lang.startsWith("ar")) return "ar";
    if (lang.startsWith("en")) return "en";
  }
  return defaultLocale;
}

// Saved locale priority: explicit `locale` cookie (most recent choice) →
// signed-in user's saved locale from the session JWT → accept-language → default.
async function resolveSavedLocale(request: NextRequest): Promise<Locale> {
  const cookieLocale = request.cookies.get("locale")?.value;
  if (typeof cookieLocale === "string" && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    });
    const tokenLocale = token?.locale;
    if (typeof tokenLocale === "string" && isLocale(tokenLocale)) {
      return tokenLocale;
    }
  } catch {
    // ignore — fall through to accept-language
  }

  return detectLocale(request.headers.get("accept-language"));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-app paths (static assets, _next, favicon) — just add security headers
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js"
  ) {
    return getSecurityHeaders(NextResponse.next());
  }

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (!pathnameHasLocale) {
    // Redirect to the saved/preferred locale-prefixed path
    const savedLocale = await resolveSavedLocale(request);
    const newUrl = new URL(`/${savedLocale}${pathname}`, request.url);
    // Preserve search params
    newUrl.search = request.nextUrl.search;
    return getSecurityHeaders(NextResponse.redirect(newUrl));
  }

  // Extract locale from the path
  const localeMatch = pathname.match(/^\/(en|ar)(?=\/|$)/);
  const locale = localeMatch?.[1] as Locale | undefined;

  if (!locale || !isLocale(locale)) {
    // Should not happen given the check above, but guard anyway
    return getSecurityHeaders(NextResponse.next());
  }

  // Strip the locale prefix to get the bare path
  const barePath = pathname.replace(/^\/(en|ar)/, "") || "/";

  // Read NextAuth session token
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Redirect authenticated users away from / and /login
  if ((barePath === "/" || barePath === "/login") && sessionToken) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return getSecurityHeaders(NextResponse.redirect(dashboardUrl));
  }

  // Auth check for protected routes
  if (isProtectedRoute(barePath)) {
    if (!sessionToken) {
      const loginUrl = new URL(`/${locale}`, request.url);
      loginUrl.searchParams.set("callbackUrl", `/${locale}${barePath}`);
      return getSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return getSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\..*).*)"],
};
