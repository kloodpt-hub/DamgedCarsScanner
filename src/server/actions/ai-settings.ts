"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/lib/settings";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !(session.user as { role?: string }).role || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized: admin only");
  }
  return session;
}

export async function getAiSettings() {
  await requireAdmin();
  const [enabled, apiUrl, apiKey, model] = await Promise.all([
    getSetting("AI_ASSESSMENT_ENABLED"),
    getSetting("AI_API_URL"),
    getSetting("AI_API_KEY"),
    getSetting("AI_MODEL"),
  ]);
  return {
    enabled: enabled === "true",
    apiUrl: apiUrl || "",
    apiKey: apiKey ? apiKey.slice(0, 4) + "••••••••" + apiKey.slice(-4) : "",
    hasApiKey: !!apiKey,
    model: model || "gpt-4o-mini",
  };
}

export async function updateAiSettings(input: {
  enabled?: boolean;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    if (input.enabled !== undefined) {
      await setSetting("AI_ASSESSMENT_ENABLED", input.enabled ? "true" : "false");
    }
    if (input.apiUrl !== undefined) {
      await setSetting("AI_API_URL", input.apiUrl.trim());
    }
    if (input.apiKey !== undefined && input.apiKey.trim()) {
      await setSetting("AI_API_KEY", input.apiKey.trim());
    }
    if (input.model !== undefined) {
      await setSetting("AI_MODEL", input.model.trim());
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save" };
  }
}
