"use server";

import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTelegramConfig, getSetting, setSetting } from "@/lib/settings";
import { registerTelegramWebhook as registerWebhook } from "@/lib/telegram";

const CONNECT_TOKEN_TTL_MS = 15 * 60 * 1000;

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createTelegramConnectLink(): Promise<{ url?: string; error?: string }> {
  const userId = await requireAuth();
  const config = await getTelegramConfig();
  if (!config.token || !config.username) {
    return { error: "Telegram bot is not configured" };
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + CONNECT_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramConnectToken: token,
      telegramConnectTokenExpiresAt: expiresAt,
    },
  });

  return { url: `https://t.me/${config.username}?start=${token}` };
}

export async function registerTelegramWebhook(): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const config = await getTelegramConfig();
  if (!config.token) {
    return { ok: false, error: "Telegram bot token is not configured" };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const result = await registerWebhook(webhookUrl);
  if (!result.ok) {
    return { ok: false, error: result.description || "Failed to register webhook" };
  }
  return { ok: true };
}

export async function updateTelegramSettings(input: {
  token?: string;
  username?: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    if (input.token && input.token.trim()) {
      await setSetting("TELEGRAM_BOT_TOKEN", input.token.trim());
    }
    if (input.username && input.username.trim()) {
      await setSetting("TELEGRAM_BOT_USERNAME", input.username.trim().replace(/^@/, ""));
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save settings" };
  }
}

export async function getTelegramSettings() {
  await requireAdmin();
  const config = await getTelegramConfig();
  const webhookSecret = await getSetting("TELEGRAM_WEBHOOK_SECRET");
  return {
    token: config.token ? "••••••••" : null,
    username: config.username,
    hasToken: !!config.token,
    webhookUrl: webhookSecret
      ? `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/telegram/webhook`
      : null,
  };
}
