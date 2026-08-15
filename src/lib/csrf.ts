import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const CSRF_COOKIE_NAMES = [
  "__Host-authjs.csrf-token",
  "authjs.csrf-token",
];

export function getCsrfTokenFromCookie(
  request: NextRequest
): string | null {
  for (const name of CSRF_COOKIE_NAMES) {
    const value = request.cookies.get(name)?.value;
    if (value) {
      return value.split("|")[0]?.trim() ?? null;
    }
  }
  return null;
}

export function checkCsrf(request: NextRequest): NextResponse | null {
  const cookieToken = getCsrfTokenFromCookie(request);

  if (cookieToken === null) return null;

  const headerToken = request.headers.get("x-csrf-token");
  if (!headerToken) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }

  const headerBuffer = Buffer.from(headerToken);
  const cookieBuffer = Buffer.from(cookieToken);

  if (headerBuffer.length !== cookieBuffer.length) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }

  const valid = timingSafeEqual(headerBuffer, cookieBuffer);
  if (!valid) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }

  return null;
}
