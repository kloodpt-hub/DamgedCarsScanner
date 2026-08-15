// Client-side helper for CSRF protection.
// Must be awaited before each mutating request and the token sent in the
// `X-CSRF-Token` header so the server can match it against the next-auth
// `authjs.csrf-token` cookie.

export async function getCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/csrf", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.csrfToken ?? null;
  } catch {
    return null;
  }
}
