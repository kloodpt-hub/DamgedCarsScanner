import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { sendTelegramMessage } from "@/lib/telegram";

interface TelegramUpdate {
  message?: {
    chat?: { id: number };
    text?: string;
  };
}

const MESSAGES = {
  welcome:
    "Welcome! Please connect your account directly from your dashboard settings on the web app.",
  invalid:
    "Invalid or expired connection link. Please request a new link from your account settings.",
  connected:
    "Your account has been successfully connected! You will receive instant notifications here.",
  stopped: "Your Telegram notifications have been disabled.",
};

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
  const parts = message.text.trim().split(/\s+/);
  const command = parts[0]?.toLowerCase();

  try {
    switch (command) {
      case "/start":
        if (parts[1]) {
          await handleConnect(chatId, parts[1]);
        } else {
          await sendTelegramMessage(chatId, MESSAGES.welcome);
        }
        break;
      case "/stop":
      case "/disconnect":
        await handleDisconnect(chatId);
        break;
      default:
        await sendTelegramMessage(chatId, MESSAGES.welcome);
    }
  } catch (error) {
    console.error("[telegram] handler failed:", error);
  }

  return NextResponse.json({ ok: true });
}

async function handleConnect(chatId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { telegramConnectToken: token },
  });

  if (!user || !user.telegramConnectTokenExpiresAt) {
    await sendTelegramMessage(chatId, MESSAGES.invalid);
    return;
  }

  if (user.telegramConnectTokenExpiresAt.getTime() < Date.now()) {
    await sendTelegramMessage(chatId, MESSAGES.invalid);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: chatId,
      telegramConnectToken: null,
      telegramConnectTokenExpiresAt: null,
    },
  });

  await sendTelegramMessage(chatId, MESSAGES.connected);
}

async function handleDisconnect(chatId: string) {
  await prisma.user.updateMany({
    where: { telegramChatId: chatId },
    data: { telegramChatId: null },
  });
  await sendTelegramMessage(chatId, MESSAGES.stopped);
}

export const dynamic = "force-dynamic";
