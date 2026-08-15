import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";
import {
  checkCsrf,
  getCsrfTokenFromCookie,
  CSRF_COOKIE_NAMES,
} from "@/lib/csrf";

function makeRequest(
  cookies: Record<string, string>,
  headers: Record<string, string> = {}
): NextRequest {
  const req = {
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value === undefined ? undefined : { name, value };
      },
    },
    headers: new Headers(headers),
  } as unknown as NextRequest;
  return req;
}

describe("getCsrfTokenFromCookie", () => {
  it("returns the part before the | separator", () => {
    const req = makeRequest({ [CSRF_COOKIE_NAMES[1]]: "abc123|hash123" });
    expect(getCsrfTokenFromCookie(req)).toBe("abc123");
  });

  it("returns null when no csrf cookie is present", () => {
    const req = makeRequest({});
    expect(getCsrfTokenFromCookie(req)).toBeNull();
  });
});

describe("checkCsrf", () => {
  it("returns null when no csrf cookie is present (lenient bootstrap)", () => {
    const req = makeRequest({});
    expect(checkCsrf(req)).toBeNull();
  });

  it("returns a 403 response when the X-CSRF-Token header is missing", () => {
    const req = makeRequest({ [CSRF_COOKIE_NAMES[1]]: "abc123|hash123" });
    const res = checkCsrf(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  it("returns a 403 response when header token does not match cookie token", () => {
    const req = makeRequest(
      { [CSRF_COOKIE_NAMES[1]]: "abc123|hash123" },
      { "x-csrf-token": "wrong-token" }
    );
    const res = checkCsrf(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  it("returns null when header token matches cookie token", () => {
    const req = makeRequest(
      { [CSRF_COOKIE_NAMES[1]]: "abc123|hash123" },
      { "x-csrf-token": "abc123" }
    );
    expect(checkCsrf(req)).toBeNull();
  });

  it("prefers the __Host-authjs.csrf-token cookie when both are present", () => {
    const req = makeRequest(
      {
        "__Host-authjs.csrf-token": "hostToken123|hostHash",
        [CSRF_COOKIE_NAMES[1]]: "plainToken456|plainHash",
      },
      { "x-csrf-token": "hostToken123" }
    );
    expect(getCsrfTokenFromCookie(req)).toBe("hostToken123");
    expect(checkCsrf(req)).toBeNull();
  });

  it("fails when only the non-__Host cookie matches but __Host takes precedence", () => {
    const req = makeRequest(
      {
        "__Host-authjs.csrf-token": "hostToken123|hostHash",
        [CSRF_COOKIE_NAMES[1]]: "plainToken456|plainHash",
      },
      { "x-csrf-token": "plainToken456" }
    );
    const res = checkCsrf(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });
});
