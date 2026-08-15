import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { getTelegramConfig } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      telegramChatId: true,
      email: true,
      pushSubscriptions: { select: { id: true } },
    },
  });

  const recentNotifications = await prisma.listing.findMany({
    where: {
      isNotified: true,
      matchedFilters: { some: { userId: session.user.id } },
    },
    include: { source: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const telegramConfig = await getTelegramConfig();

  return NextResponse.json({
    emailConfigured: isEmailConfigured(),
    telegramConnected: !!user?.telegramChatId,
    telegramBotUsername: telegramConfig.username || "",
    pushSubscriptionCount: user?.pushSubscriptions.length ?? 0,
    pushSupported: true,
    pushConfigured:
      !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      !!process.env.VAPID_PRIVATE_KEY,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    recentNotifications,
  });
}
