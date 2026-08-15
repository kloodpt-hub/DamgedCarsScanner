import { getTelegramConfig } from "./settings";

export async function sendTelegramMessage(
  chatId: string,
  text: string
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
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    }
  );
  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
  };
  return data;
}

export async function registerTelegramWebhook(
  webhookUrl: string
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
      }),
    }
  );
  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
  };
  return data;
}
