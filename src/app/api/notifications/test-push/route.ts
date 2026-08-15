import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkCsrf } from "@/lib/csrf";
import {
  sendPushNotification,
  isPushConfigured,
  type RichPushPayload,
} from "@/lib/push";

export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const userId = session.user.id;
  const [subscriptions, latestListing] = await Promise.all([
    prisma.pushSubscription.findMany({ where: { userId } }),
    prisma.listing.findFirst({
      where: { isNotified: true, matchedFilters: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      include: { source: { select: { name: true } } },
    }),
  ]);

  if (subscriptions.length === 0) {
    return NextResponse.json({ error: "no_subscriptions" }, { status: 400 });
  }

  const sourceName = latestListing?.source?.name ?? null;
  const payload: RichPushPayload = {
    title: latestListing
      ? `New match: ${latestListing.title}`
      : "Test notification",
    body: latestListing
      ? `€${latestListing.price?.toLocaleString() ?? "N/A"} · ${latestListing.year ?? "N/A"} · ${sourceName}`
      : "Your push notifications are working.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: latestListing ? `listing-${latestListing.id}` : undefined,
    renotify: false,
    actions: [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
    data: {
      url: latestListing?.canonicalUrl ?? "/",
      listingId: latestListing?.id,
      title: latestListing?.title,
      price: latestListing?.price,
      year: latestListing?.year,
      mileage: latestListing?.mileage,
      sourceName,
      imageUrl: latestListing?.imageUrl,
    },
  };

  if (latestListing?.imageUrl) {
    payload.image = latestListing.imageUrl;
  }

  const results = [];
  for (const sub of subscriptions) {
    const ok = await sendPushNotification(
      { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
      payload
    );
    results.push({ endpoint: sub.endpoint.slice(-40), ok });
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  console.log(`[push] test-push: sent=${sent} failed=${failed}`);

  return NextResponse.json({ success: sent > 0, sent, failed, results });
}
