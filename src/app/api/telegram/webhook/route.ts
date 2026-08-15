import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { handleTelegramMessage } from "@/lib/telegram/bot-handlers";

interface TelegramUpdate {
  message?: {
    chat?: { id: number };
    text?: string;
  };
}

async function secretMatches(request: NextRequest): Promise<boolean> {
  const secret = await getSetting("TELEGRAM_WEBHOOK_SECRET");
  if (!secret) {
    // No secret configured yet (webhook not re-registered); log and allow.
    console.warn("[telegram] webhook called without a registered secret token");
    return true;
  }
  const header = request.headers.get("x-telegram-bot-api-secret-token");
  return header === secret;
}

export async function POST(request: NextRequest) {
  if (!(await secretMatches(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update?.message;
  if (!message?.chat?.id || !message.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);

  try {
    await handleTelegramMessage(chatId, message.text);
  } catch (error) {
    console.error("[telegram] handler failed:", error);
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
