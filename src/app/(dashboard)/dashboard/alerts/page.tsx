import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { getDictionary, type Locale } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, CheckCircle, AlertCircle, Wifi, Mail } from "lucide-react";

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "en" } = await params;
  const t = await getDictionary(locale as Locale);

  const session = await auth();
  const userId = session?.user?.id;

  const hasSmtp = !!process.env.SMTP_HOST;

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
        <h1 className="text-2xl font-bold text-text">{t.alerts.title}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-surface">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{t.alerts.telegramStatus}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {hasTelegram ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-success" />
                    <Badge variant="success">{t.alerts.connected}</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-text-muted" />
                    <Badge variant="secondary">{t.alerts.notConnected}</Badge>
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
              <p className="text-sm font-medium text-text">{t.alerts.webPush}</p>
              <p className="text-xs text-text-muted mt-1">
                {t.alerts.enablePush}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-surface">
              <Mail className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{t.alerts.emailStatus}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {hasSmtp ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                    <Badge variant="success">{t.alerts.smtpConfigured}</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-text-muted" />
                    <Badge variant="secondary">{t.alerts.smtpNotConfigured}</Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.alerts.notificationHistory}</CardTitle>
        </CardHeader>
        <CardContent>
          {notifiedListings.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>{t.alerts.noHistory}</p>
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
                    {t.alerts.telegram}
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
