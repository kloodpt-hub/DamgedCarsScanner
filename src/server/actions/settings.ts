"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/i18n/routing";

const ALLOWED_ENV_KEYS = new Set([
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_BOT_USERNAME",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
]);

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

function getRenderConfig() {
  const apiKey = process.env.RENDER_API_KEY;
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!apiKey || !serviceId) {
    throw new Error("Render API not configured");
  }
  return { apiKey, serviceId };
}

async function renderFetch(path: string, init: RequestInit) {
  const { apiKey, serviceId } = getRenderConfig();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(
    `https://api.render.com/v1/services/${serviceId}${path}`,
    { ...init, headers }
  );
  if (!response.ok) {
    throw new Error(`Render API error ${response.status}`);
  }
  return response;
}

export async function updateEnvVar(key: string, value: string) {
  await requireAdmin();
  if (!ALLOWED_ENV_KEYS.has(key)) {
    throw new Error("Unsupported key");
  }
  if (!value.trim()) {
    throw new Error("Value required");
  }
  await renderFetch(`/env-vars/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
  return { ok: true };
}

export async function redeployService() {
  await requireAdmin();
  await renderFetch("/deploys", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return { ok: true };
}

export async function updateUserLocale(locale: string) {
  try {
    if (!isLocale(locale)) return;
    const session = await auth();
    if (!session?.user) return;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale },
    });
  } catch {
    // Fail silently — navigation should still proceed.
  }
}
