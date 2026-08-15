import { prisma } from "./prisma";
import { getTelegramConfig } from "./settings";
import { sendTelegramMessage, sendTelegramPhoto } from "./telegram";
import { getMessages } from "./telegram/messages";
import { sendListingAlert } from "./email";
import {
  sendPushNotification,
  isPushConfigured,
  type RichPushPayload,
} from "./push";

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
      select: {
        id: true,
        email: true,
        name: true,
        telegramChatId: true,
        telegramPaused: true,
        locale: true,
        pushSubscriptions: true,
      },
    }),
    prisma.scraperSource.findUnique({
      where: { id: listing.sourceId },
      select: { name: true },
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const sourceName = source?.name ?? "Unknown";
  const telegramConfig = await getTelegramConfig();

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
    if (user.telegramChatId && telegramConfig.token && !user.telegramPaused) {
      try {
        const m = getMessages(user.locale === "ar" ? "ar" : "en");
        const caption = m.listingCaption(
          listing.title,
          listing.price != null
            ? "€" + listing.price.toLocaleString()
            : "N/A",
          listing.year != null ? String(listing.year) : "N/A",
          listing.mileage != null
            ? listing.mileage.toLocaleString() + " km"
            : "N/A",
          listing.damageStatus ?? "N/A",
          listing.canonicalUrl
        );
        if (listing.imageUrl) {
          await sendTelegramPhoto(user.telegramChatId, listing.imageUrl, caption);
        } else {
          await sendTelegramMessage(user.telegramChatId, caption);
        }
      } catch (err) {
        console.error("[notifications] Telegram failed:", err);
      }
    }

    // 3. Web Push
    if (isPushConfigured() && user.pushSubscriptions.length > 0) {
      for (const sub of user.pushSubscriptions) {
        const payload: RichPushPayload = {
          title: `New match: ${listing.title}`,
          body: `€${listing.price?.toLocaleString() ?? 'N/A'} · ${listing.year ?? 'N/A'} · ${sourceName}`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `listing-${listing.id}`,
          renotify: false,
          actions: [
            { action: "view", title: "View" },
            { action: "dismiss", title: "Dismiss" },
          ],
          data: {
            url: listing.canonicalUrl,
            listingId: listing.id,
            title: listing.title,
            price: listing.price,
            year: listing.year,
            mileage: listing.mileage,
            sourceName,
            imageUrl: listing.imageUrl,
          },
        };
        if (listing.imageUrl) {
          payload.image = listing.imageUrl;
        }
        await sendPushNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          payload
        );
      }
    }
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: { isNotified: true },
  });
}
