import { prisma } from "./prisma";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export interface TelegramConfig {
  token: string | null;
  username: string | null;
}

export async function getTelegramConfig(): Promise<TelegramConfig> {
  const [dbToken, dbUsername] = await Promise.all([
    getSetting("TELEGRAM_BOT_TOKEN"),
    getSetting("TELEGRAM_BOT_USERNAME"),
  ]);

  const envToken = process.env.TELEGRAM_BOT_TOKEN || null;
  const envUsername = process.env.TELEGRAM_BOT_USERNAME || null;

  const token = dbToken || envToken;
  const username = dbUsername || envUsername;

  if (!dbToken && envToken) {
    try {
      await setSetting("TELEGRAM_BOT_TOKEN", envToken);
    } catch {
      // backfill is best-effort; env fallback keeps notifications working
    }
  }
  if (!dbUsername && envUsername) {
    try {
      await setSetting("TELEGRAM_BOT_USERNAME", envUsername);
    } catch {
      // backfill is best-effort; env fallback keeps notifications working
    }
  }

  return { token, username };
}
