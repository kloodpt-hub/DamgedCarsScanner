import { getTelegramConfig } from "./settings";

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<{ ok: boolean; description?: string }> {
  const { token } = await getTelegramConfig();
  if (!token) {
    return { ok: false, description: "Telegram bot not configured" };
  }
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    }
  );
  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
  };
  return data;
}

export async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption: string,
  replyMarkup?: Record<string, unknown>
): Promise<{ ok: boolean; description?: string }> {
  const { token } = await getTelegramConfig();
  if (!token) {
    return { ok: false, description: "Telegram bot not configured" };
  }
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendPhoto`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: "HTML",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    }
  );
  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
  };
  return data;
}

export async function sendTelegramMediaGroup(
  chatId: string,
  media: Array<{ type: "photo"; media: string; caption?: string; parse_mode?: string }>
): Promise<{ ok: boolean; description?: string }> {
  const { token } = await getTelegramConfig();
  if (!token) {
    return { ok: false, description: "Telegram bot not configured" };
  }
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMediaGroup`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        media,
      }),
    }
  );
  const data = (await response.json()) as { ok: boolean; description?: string };
  return data;
}

export async function registerTelegramWebhook(
  webhookUrl: string,
  secretToken?: string
): Promise<{ ok: boolean; description?: string }> {
  const { token } = await getTelegramConfig();
  if (!token) {
    return { ok: false, description: "Telegram bot not configured" };
  }
  const response = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
        ...(secretToken ? { secret_token: secretToken } : {}),
      }),
    }
  );
  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
  };
  return data;
}
