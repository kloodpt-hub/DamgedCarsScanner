"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Mail,
  MessageCircle,
  Send,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCsrfToken } from "@/lib/csrf-client";
import { createTelegramConnectLink, disconnectTelegram } from "@/server/actions/telegram";
import {
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  isPushSupported,
  isIosDevice,
  isIosPwa,
  getIosPushHint,
} from "@/lib/push-client";

const labels = {
  en: {
    title: "Notifications",
    subtitle: "Configure how you receive alerts for new matching listings",
    email: {
      title: "Email Notifications",
      description: "Receive alerts directly in your inbox",
      testSend: "Send Test Email",
      configured: "Configured",
      notConfigured: "Not configured by admin",
      testSent: "Test email sent!",
      testFailed: "Failed to send test email",
    },
    telegram: {
      title: "Telegram Bot",
      description: "Get instant alerts via Telegram",
      connect: "Connect Telegram Bot",
      connected: "Connected",
      notConnected: "Not connected",
      disconnect: "Disconnect",
      disconnected: "Telegram disconnected",
      disconnectFailed: "Failed to disconnect Telegram. Try again later.",
      setupHint: "Click the button below to open Telegram and connect your account",
      connectFailed: "Could not create Telegram connection link. Try again later.",
    },
    push: {
      title: "Web Push Notifications",
      description: "Get alerts directly in your browser",
      enable: "Enable Push Notifications",
      disable: "Disable Push Notifications",
      enabled: "Enabled",
      disabled: "Disabled",
      notSupported: "Not supported in this browser",
      notConfigured: "Push notifications not configured by admin",
      enableFailed: "Failed to enable push notifications. Try again later.",
      disableSuccess: "Push notifications disabled",
      disableFailed: "Failed to disable push notifications",
      allowFirst:
        "Push only works after you allow notifications. Click Enable and choose Allow in the browser dialog.",
      notSaved:
        "Your browser is subscribed but the server has no saved subscription. Click Disable, then Enable again to fix this.",
      blockedText:
        "Notifications are blocked by your browser. Enable them in your site settings or browser permissions, then try again.",
      iosHint: getIosPushHint("en"),
    },
    history: {
      title: "Recent Notifications",
      empty: "No notifications yet",
      new: "New",
    },
  },
  ar: {
    title: "الإشعارات",
    subtitle: "تكوين طريقة تلقي التنبيهات للإعلانات المطابقة الجديدة",
    email: {
      title: "إشعارات البريد الإلكتروني",
      description: "تلق التنبيهات مباشرة في بريدك",
      testSend: "إرسال بريد تجريبي",
      configured: "تم التكوين",
      notConfigured: "لم يُكوَّن من قبل المسؤول",
      testSent: "تم إرسال البريد التجريبي!",
      testFailed: "فشل إرسال البريد التجريبي",
    },
    telegram: {
      title: "بوت تيليجرام",
      description: "تلق تنبيهات فورية عبر تيليجرام",
      connect: "ربط بوت تيليجرام",
      connected: "متصل",
      notConnected: "غير متصل",
      disconnect: "قطع الاتصال",
      disconnected: "تم قطع الاتصال بتيليجرام",
      disconnectFailed: "فشل قطع الاتصال بتيليجرام. حاول مجددًا لاحقًا.",
      setupHint: "انقر على الزر أدناه لفتح تيليجرام وربط حسابك",
      connectFailed: "تعذر إنشاء رابط ربط تيليجرام. حاول مجددًا لاحقًا.",
    },
    push: {
      title: "إشعارات الويب",
      description: "تلق تنبيهات مباشرة في متصفحك",
      enable: "تفعيل إشعارات الويب",
      disable: "تعطيل إشعارات الويب",
      enabled: "مفعّل",
      disabled: "معطّل",
      notSupported: "غير مدعوم في هذا المتصفح",
      notConfigured: "الإشعارات غير مكوّنة من قبل المسؤول",
      enableFailed: "فشل تفعيل الإشعارات. حاول مرة أخرى لاحقًا.",
      disableSuccess: "تم تعطيل إشعارات الويب",
      disableFailed: "فشل تعطيل إشعارات الويب",
      allowFirst:
        "تعمل الإشعارات فقط بعد السماح بها. اضغط تفعيل واختر السماح في نافذة المتصفح.",
      notSaved:
        "متصفحك مشترك في الإشعارات لكن الخادم لا يملك اشتراكًا محفوظًا. اضغط «تعطيل» ثم «تفعيل» مرة أخرى لإصلاح ذلك.",
      blockedText:
        "تم حظر الإشعارات بواسطة المتصفح. فعّلها من إعدادات الموقع أو أذونات المتصفح ثم حاول مرة أخرى.",
      iosHint: getIosPushHint("ar"),
    },
    history: {
      title: "الإشعارات الأخيرة",
      empty: "لا توجد إشعارات بعد",
      new: "جديد",
    },
  },
} as const;

interface NotificationListing {
  id: string;
  title: string;
  imageUrl: string | null;
  createdAt: string;
  source: { name: string } | null;
}

export default function AlertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("en");
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramBotUsername, setTelegramBotUsername] = useState("");
  const [browserSubscribed, setBrowserSubscribed] = useState(false);
  const [serverPushCount, setServerPushCount] = useState(0);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushBlocked, setPushBlocked] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationListing[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const t = labels[locale as keyof typeof labels] ?? labels.en;

  useEffect(() => {
    params.then((p) => setLocale(p.locale ?? "en"));
  }, [params]);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetch("/api/notifications/status").then((r) => r.json());
      setEmailConfigured(data.emailConfigured);
      setTelegramConnected(data.telegramConnected);
      setTelegramBotUsername(data.telegramBotUsername || "");
      setPushSupported(data.pushSupported && isPushSupported());
      setServerPushCount(data.pushSubscriptionCount || 0);
      setRecentNotifications(data.recentNotifications || []);
    } catch {
      // ignore transient failures; next poll will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      void loadStatus();
    }, 0);
    const interval = setInterval(loadStatus, 10_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [loadStatus]);

  useEffect(() => {
    isSubscribed()
      .then((subscribed) => setBrowserSubscribed(subscribed))
      .catch(() => {});
  }, []);

  const pushEnabled = browserSubscribed && serverPushCount > 0;

  const iosHint = pushSupported && isIosDevice() && !isIosPwa();

  const handleTestEmail = async () => {
    setSending(true);
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/notifications/test-email", {
        method: "POST",
        headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t.email.testSent);
      } else {
        toast.error(t.email.testFailed);
      }
    } catch {
      toast.error(t.email.testFailed);
    } finally {
      setSending(false);
    }
  };

  const handleEnablePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    setPushBlocked(false);
    try {
      const result = await subscribeToPush();
      if (result.ok) {
        setBrowserSubscribed(true);
        setServerPushCount(1);
        toast.success(t.push.enabled);
        return;
      }
      if (result.reason === "denied") {
        setPushBlocked(true);
        return;
      }
      if (result.reason === "no-vapid") {
        toast.error(t.push.notConfigured);
        return;
      }
      if (result.reason === "no-permission" || result.reason === "default") {
        toast(t.push.allowFirst);
        return;
      }
      if (result.reason === "unsupported") {
        toast.error(t.push.notSupported);
        return;
      }
      toast.error(t.push.enableFailed);
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisablePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      const result = await unsubscribeFromPush();
      if (result.ok) {
        setBrowserSubscribed(false);
        setServerPushCount(0);
        toast.success(t.push.disableSuccess);
      } else {
        toast.error(t.push.disableFailed);
      }
    } finally {
      setPushBusy(false);
    }
  };

  const [telegramBusy, setTelegramBusy] = useState(false);

  const handleConnectTelegram = async () => {
    if (telegramBusy || !telegramBotUsername) return;
    setTelegramBusy(true);
    try {
      const result = await createTelegramConnectLink();
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(result.error || t.telegram.connectFailed);
      }
    } catch {
      toast.error(t.telegram.connectFailed);
    } finally {
      setTelegramBusy(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (telegramBusy) return;
    setTelegramBusy(true);
    try {
      const result = await disconnectTelegram();
      if (result.ok) {
        setTelegramConnected(false);
        toast.success(t.telegram.disconnected);
      } else {
        toast.error(result.error || t.telegram.disconnectFailed);
      }
    } catch {
      toast.error(t.telegram.disconnectFailed);
    } finally {
      setTelegramBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-text">{t.title}</h1>
          <p className="text-text-muted text-sm mt-1">{t.subtitle}</p>
        </div>
        <div className="py-12 text-center text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
          {t.title}
        </p>
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <p className="text-sm text-text-muted">{t.subtitle}</p>
      </div>

      {/* Email Notifications */}
      <Card className="transition-all duration-500 ease-premium hover:-translate-y-0.5 hover:shadow-ambient">
        <CardHeader className="mb-4 flex flex-row items-start gap-3 space-y-0 pb-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <CardTitle className="text-base">{t.email.title}</CardTitle>
            <CardDescription className="mt-1">{t.email.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          {emailConfigured ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border/70 bg-surface/50 px-3.5 py-3 sm:px-4">
              <Badge variant="success">
                <CheckCircle className="me-1 h-3 w-3" />
                {t.email.configured}
              </Badge>
              <Button onClick={handleTestEmail} disabled={sending} size="sm" className="rounded-full">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t.email.testSend}
              </Button>
            </div>
          ) : (
            <Badge variant="warning">
              <AlertCircle className="me-1 h-3 w-3" />
              {t.email.notConfigured}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card className="transition-all duration-500 ease-premium hover:-translate-y-0.5 hover:shadow-ambient">
        <CardHeader className="mb-4 flex flex-row items-start gap-3 space-y-0 pb-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <CardTitle className="text-base">{t.telegram.title}</CardTitle>
            <CardDescription className="mt-1">{t.telegram.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          {telegramConnected ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border/70 bg-surface/50 px-3.5 py-3 sm:px-4">
              <Badge variant="success">
                <CheckCircle className="me-1 h-3 w-3" />
                {t.telegram.connected}
              </Badge>
              <Button
                onClick={handleDisconnectTelegram}
                variant="outline"
                size="sm"
                disabled={telegramBusy}
                className="rounded-full"
              >
                {telegramBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {t.telegram.disconnect}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border/70 bg-surface/50 px-3.5 py-3 sm:px-4">
              <p className="text-xs text-text-muted">{t.telegram.setupHint}</p>
              <Button
                onClick={handleConnectTelegram}
                disabled={!telegramBotUsername || telegramBusy}
                className="rounded-full"
              >
                {telegramBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {t.telegram.connect}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Web Push */}
      <Card className="transition-all duration-500 ease-premium hover:-translate-y-0.5 hover:shadow-ambient">
        <CardHeader className="mb-4 flex flex-row items-start gap-3 space-y-0 pb-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <CardTitle className="text-base">{t.push.title}</CardTitle>
            <CardDescription className="mt-1">{t.push.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          {pushSupported ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border/70 bg-surface/50 px-3.5 py-3 sm:px-4">
                <Badge variant={pushEnabled ? "success" : "default"}>
                  {pushEnabled ? t.push.enabled : t.push.disabled}
                </Badge>
                {pushEnabled ? (
                  <Button
                    onClick={handleDisablePush}
                    size="sm"
                    variant="outline"
                    disabled={pushBusy}
                    className="rounded-full"
                  >
                    {t.push.disable}
                  </Button>
                ) : (
                  <Button onClick={handleEnablePush} size="sm" disabled={pushBusy} className="rounded-full">
                    {t.push.enable}
                  </Button>
                )}
              </div>
              {pushBlocked && (
                <p className="mt-3 text-xs text-danger">{t.push.blockedText}</p>
              )}
              {!pushEnabled && browserSubscribed && (
                <p className="mt-3 text-xs text-warning">{t.push.notSaved}</p>
              )}
              {iosHint && !pushEnabled && (
                <p className="mt-3 text-xs text-warning">{t.push.iosHint}</p>
              )}
            </>
          ) : (
            <Badge variant="warning">
              <AlertCircle className="me-1 h-3 w-3" />
              {t.push.notSupported}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card className="transition-all duration-500 ease-premium hover:-translate-y-0.5 hover:shadow-ambient">
        <CardHeader className="mb-0 flex flex-row items-center gap-3 space-y-0 pb-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-text-muted ring-1 ring-border/70">
            <Bell className="h-5 w-5" />
          </div>
          <CardTitle className="text-base">{t.history.title}</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          {recentNotifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">{t.history.empty}</p>
          ) : (
            <div className="divide-y divide-border/60">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface ring-1 ring-border/60">
                    {n.imageUrl ? (
                      <img
                        src={n.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Bell className="h-4 w-4 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{n.title}</p>
                    <p className="text-xs text-text-muted">{n.source?.name}</p>
                  </div>
                  <Badge variant="default" className="shrink-0">
                    {t.history.new}
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
