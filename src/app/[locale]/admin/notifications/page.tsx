import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { isEmailConfigured } from "@/lib/email";
import { getTelegramConfig } from "@/lib/settings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  Send,
  CheckCircle,
  Globe,
  Users,
  Hash,
} from "lucide-react";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = "en" } = await params;
  const t = await getDictionary(locale as Locale);
  const isRtl = locale === "ar";

  const hasEmail = isEmailConfigured();
  const fromEmail = process.env.FROM_EMAIL || "-";
  const hasResendKey = !!process.env.RESEND_API_KEY;

  const telegramConfig = await getTelegramConfig();
  const hasTelegramBot = !!telegramConfig.token;
  const hasVapid = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

  function maskValue(val?: string): string {
    if (!val) return "";
    if (val.length <= 8) return "•".repeat(val.length);
    return val.slice(0, 4) + "•".repeat(Math.max(4, val.length - 8)) + val.slice(-4);
  }

  const [
    notifiedListings,
    telegramUsers,
    totalNotifiedListings,
    totalUsersWithNotifications,
    pushSubscriptionCount,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: { isNotified: true },
      include: { source: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.user.findMany({
      where: { telegramChatId: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        telegramChatId: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.count({ where: { isNotified: true } }),
    prisma.user.count({
      where: {
        OR: [
          { telegramChatId: { not: null } },
          { pushSubscriptions: { some: {} } },
        ],
      },
    }),
    prisma.pushSubscription.count(),
  ]);

  const lastNotified = notifiedListings.length > 0 ? notifiedListings[0].updatedAt : null;

  const sectionHeading = "text-lg font-semibold text-text";

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-bold text-text">{t.alerts.title}</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage email, Telegram, and push notification channels.
          </p>
        </div>
      </div>

      {/* Section 1: Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Mail className="h-5 w-5 text-primary" />
            <span>{t.alerts.emailStatus}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium text-text`}>Status:</span>
            {hasEmail ? (
              <Badge variant="success">{t.alerts.emailConfigured}</Badge>
            ) : (
              <Badge variant="secondary">{t.alerts.emailNotConfigured}</Badge>
            )}
          </div>

          {hasEmail ? (
            <div className="rounded-lg border border-border p-4 bg-surface/50 space-y-2 text-sm">
              <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
                <span className="text-text-muted">Provider</span>
                <span className="text-text font-medium">Resend</span>
              </div>
              <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
                <span className="text-text-muted">API Key</span>
                <span className="text-text font-medium font-mono">
                  {hasResendKey ? maskValue(process.env.RESEND_API_KEY) : "-"}
                </span>
              </div>
              <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
                <span className="text-text-muted">From</span>
                <span className="text-text font-medium">{fromEmail}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border p-4 bg-surface/50 space-y-2 text-sm text-text-muted">
              <p className="font-medium text-text">Setup Instructions:</p>
              <p>Add the following environment variables to your <code className="text-primary">.env</code> file:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><code className="text-primary">RESEND_API_KEY</code> - Your Resend API key</li>
                <li><code className="text-primary">FROM_EMAIL</code> - Sender email address</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Telegram Bot Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Send className="h-5 w-5 text-accent" />
            <span>Telegram Bot</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text">Status:</span>
            {hasTelegramBot ? (
              <Badge variant="success">{t.alerts.connected}</Badge>
            ) : (
              <Badge variant="secondary">{t.alerts.notConnected}</Badge>
            )}
          </div>

          {hasTelegramBot ? (
            <>
              <div className="rounded-lg border border-border p-4 bg-surface/50 space-y-2 text-sm">
                <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
                  <span className="text-text-muted">Bot Token</span>
                  <span className="text-text font-medium font-mono">
                    {maskValue(telegramConfig.token ?? "")}
                  </span>
                </div>
                <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
                  <span className="text-text-muted">Linked Users</span>
                  <span className="text-text font-medium">{telegramUsers.length}</span>
                </div>
              </div>

              {telegramUsers.length > 0 && (
                <div className="rounded-lg border border-border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface/50 text-text-muted">
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Chat ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telegramUsers.map((user) => (
                        <tr key={user.id} className="border-t border-border">
                          <td className="px-4 py-2 text-text font-medium">{user.name ?? "-"}</td>
                          <td className="px-4 py-2 text-text-muted">{user.email}</td>
                          <td className="px-4 py-2 text-text-muted font-mono text-xs">
                            {user.telegramChatId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {telegramUsers.length === 0 && (
                <p className="text-text-muted text-sm">No users have linked their Telegram accounts yet.</p>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-border p-4 bg-surface/50 space-y-2 text-sm text-text-muted">
              <p className="font-medium text-text">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li>Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> on Telegram</li>
                <li>Set <code className="text-primary">TELEGRAM_BOT_TOKEN</code> env var with the token you receive</li>
                <li>Users can link their chat ID by messaging the bot and using <code className="text-primary">/start</code></li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Web Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Bell className="h-5 w-5 text-success" />
            <span>Web Push Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text">Status:</span>
            {hasVapid ? (
              <Badge variant="success">VAPID Configured</Badge>
            ) : (
              <Badge variant="secondary">Not Configured</Badge>
            )}
          </div>

          <div className="rounded-lg border border-border p-4 bg-surface/50 space-y-2 text-sm">
            <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
              <span className="text-text-muted">Active Push Subscriptions</span>
              <span className="text-text font-medium">{pushSubscriptionCount}</span>
            </div>
          </div>

          {!hasVapid && (
            <div className="rounded-lg border border-border p-4 bg-surface/50 text-sm text-text-muted">
              <p className="font-medium text-text mb-2">Setup Instructions:</p>
              <p>Add the following environment variables to enable web push:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><code className="text-primary">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> - VAPID public key</li>
                <li><code className="text-primary">VAPID_PRIVATE_KEY</code> - VAPID private key</li>
              </ul>
              <p className="mt-2">Generate keys with <code className="text-primary">npx web-push generate-vapid-keys</code></p>
            </div>
          )}

          <p className="text-text-muted text-xs italic">
            Web push delivery is a placeholder for future implementation.
          </p>
        </CardContent>
      </Card>

      {/* Section 4: Notification Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Globe className="h-5 w-5 text-primary" />
            <span>Notification Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4 bg-surface/50 text-center">
              <Hash className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-text">{totalNotifiedListings}</p>
              <p className="text-sm text-text-muted">Total Listings Notified</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-surface/50 text-center">
              <Users className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-text">{totalUsersWithNotifications}</p>
              <p className="text-sm text-text-muted">Users with Notifications Enabled</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-surface/50 text-center">
              <Bell className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-text">
                {lastNotified ? formatDate(lastNotified, locale) : "-"}
              </p>
              <p className="text-sm text-text-muted">Last Notification Sent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Mail className="h-5 w-5 text-primary" />
            <span>{t.alerts.notificationHistory}</span>
            <Badge variant="default" className="ml-2">{notifiedListings.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifiedListings.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>{t.alerts.noHistory}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifiedListings.map((listing) => (
                <div
                  key={listing.id}
                  className={`flex items-center gap-3 rounded-lg border border-border p-3 ${isRtl ? "flex-row-reverse" : ""}`}
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
                  <Badge variant="success" className="shrink-0">
                    Notified
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
