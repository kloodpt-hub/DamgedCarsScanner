import { prisma } from "./prisma";
import { sendListingAlert } from "./email";
import { sendPushNotification, isPushConfigured } from "./push";

export async function notifyNewListing(
  listing: {
    id: string;
    title: string;
    price: number | null;
    year: number | null;
    mileage: number | null;
    damageStatus: string | null;
    canonicalUrl: string;
    imageUrl: string | null;
    sourceId: string;
  },
  matchedFilters: { id: string; name: string; userId: string }[]
): Promise<void> {
  if (matchedFilters.length === 0) return;

  const userIds = [...new Set(matchedFilters.map((f) => f.userId))];
  const [users, source] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true, telegramChatId: true, pushSubscriptions: true },
    }),
    prisma.scraperSource.findUnique({
      where: { id: listing.sourceId },
      select: { name: true },
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const sourceName = source?.name ?? "Unknown";

  for (const filter of matchedFilters) {
    const user = userMap.get(filter.userId);
    if (!user) continue;

    // 1. Email
    if (user.email) {
      await sendListingAlert(
        { email: user.email, name: user.name },
        { ...listing, source: { name: sourceName } },
        { name: filter.name }
      );
    }

    // 2. Telegram
    if (user.telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const text = `🚗 New match: ${listing.title}\n💰 Price: ${listing.price ? '€' + listing.price.toLocaleString() : 'N/A'}\n📅 Year: ${listing.year ?? 'N/A'}\n🔗 ${listing.canonicalUrl}`;
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.telegramChatId,
            text,
            parse_mode: "HTML",
          }),
        });
      } catch (err) {
        console.error("[notifications] Telegram failed:", err);
      }
    }

    // 3. Web Push
    if (isPushConfigured() && user.pushSubscriptions.length > 0) {
      for (const sub of user.pushSubscriptions) {
        await sendPushNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          {
            title: `New match: ${listing.title}`,
            body: `€${listing.price?.toLocaleString() ?? 'N/A'} · ${listing.year ?? 'N/A'} · ${sourceName}`,
            url: listing.canonicalUrl,
          }
        );
      }
    }
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: { isNotified: true },
  });
}
