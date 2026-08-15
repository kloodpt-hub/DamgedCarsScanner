import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTelegramConfig } from "@/lib/settings";
import { sendTelegramMessage } from "@/lib/telegram";

interface TelegramUpdate {
  message?: {
    chat?: { id: number };
    text?: string;
  };
}

export async function POST(request: NextRequest) {
  const config = await getTelegramConfig();
  if (!config.token) {
    return NextResponse.json({ ok: false, error: "Bot not configured" }, { status: 500 });
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
  const text = message.text.trim();
  const parts = text.split(/\s+/);
  const command = parts[0]?.toLowerCase();

  if (command === "/start" && parts[1]) {
    await handleConnect(chatId, parts[1]);
    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage(
    chatId,
    "Welcome! To connect your account, open the app, click Connect Telegram, and tap the link again."
  );
  return NextResponse.json({ ok: true });
}

async function handleConnect(chatId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { telegramConnectToken: token },
  });

  if (!user || !user.telegramConnectTokenExpiresAt) {
    await sendTelegramMessage(chatId, "This link is invalid or has expired. Generate a new one from the app.");
    return;
  }

  if (user.telegramConnectTokenExpiresAt.getTime() < Date.now()) {
    await sendTelegramMessage(chatId, "This link has expired. Generate a new one from the app.");
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

  await sendTelegramMessage(chatId, "✅ Connected! You will now receive car listing alerts here.");
}

export const dynamic = "force-dynamic";
