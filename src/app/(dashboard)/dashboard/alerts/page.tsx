import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, CheckCircle, AlertCircle, Wifi } from "lucide-react";

const labels = {
  en: {
    title: "Alerts & Notifications",
    telegramStatus: "Telegram Connection",
    webPush: "Web Push Notifications",
    notificationHistory: "Notification History",
    connected: "Connected",
    notConnected: "Not Connected",
    enablePush: "Enable Push Notifications",
    testNotification: "Send Test Notification",
    noHistory: "No notifications sent yet",
    listing: "Listing",
    sentAt: "Sent At",
    via: "Via",
    telegram: "Telegram",
    web: "Web Push",
  },
  ar: {
    title: "التنبيهات والإشعارات",
    telegramStatus: "حالة اتصال تيليجرام",
    webPush: "إشعارات الويب",
    notificationHistory: "سجل الإشعارات",
    connected: "متصل",
    notConnected: "غير متصل",
    enablePush: "تفعيل إشعارات الويب",
    testNotification: "إرسال إشعار تجريبي",
    noHistory: "لم يتم إرسال إشعارات بعد",
    listing: "الإعلان",
    sentAt: "تم الإرسال في",
    via: " عبر ",
    telegram: "تيليجرام",
    web: "ويب",
  },
} as const;

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "en" } = await params;
  const t = labels[locale as keyof typeof labels] ?? labels.en;
  const isRtl = locale === "ar";

  const session = await auth();
  const userId = session?.user?.id;

  const [telegramUser, notifiedListings] = await Promise.all([
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { telegramChatId: true },
        })
      : null,
    userId
      ? prisma.listing.findMany({
          where: {
            isNotified: true,
            matchedFilters: { some: { userId } },
          },
          include: { source: true },
          orderBy: { updatedAt: "desc" },
          take: 50,
        })
      : [],
  ]);

  const hasTelegram = !!telegramUser?.telegramChatId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-surface">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{t.telegramStatus}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {hasTelegram ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-success" />
                    <Badge variant="success">{t.connected}</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-text-muted" />
                    <Badge variant="secondary">{t.notConnected}</Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-surface">
              <Bell className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{t.webPush}</p>
              <p className="text-xs text-text-muted mt-1">
                {t.enablePush}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.notificationHistory}</CardTitle>
        </CardHeader>
        <CardContent>
          {notifiedListings.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>{t.noHistory}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifiedListings.map((listing: {
                id: string;
                title: string;
                imageUrl: string | null;
                source: { name: string };
                updatedAt: Date | string;
              }) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-surface flex items-center justify-center overflow-hidden">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Bell className="h-4 w-4 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {listing.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {listing.source.name} &middot; {formatDate(listing.updatedAt, locale)}
                    </p>
                  </div>
                  <Badge variant="default" className="shrink-0">
                    {t.telegram}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
