"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  MessageCircle,
  Send,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCsrfToken } from "@/lib/csrf-client";
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
      setupHint: "Click the button below to open Telegram and connect your account",
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
      setupHint: "انقر على الزر أدناه لفتح تيليجرام وربط حسابك",
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
  source: { name: string };
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
  const [pushEnabled, setPushEnabled] = useState(false);
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

  useEffect(() => {
    fetch("/api/notifications/status")
      .then((r) => r.json())
      .then((data) => {
        setEmailConfigured(data.emailConfigured);
        setTelegramConnected(data.telegramConnected);
        setTelegramBotUsername(data.telegramBotUsername || "");
        setPushSupported(data.pushSupported && isPushSupported());
        setRecentNotifications(data.recentNotifications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    isSubscribed()
      .then((subscribed) => setPushEnabled(subscribed))
      .catch(() => {});
  }, []);

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
        setPushEnabled(true);
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
        setPushEnabled(false);
        toast.success(t.push.disableSuccess);
      } else {
        toast.error(t.push.disableFailed);
      }
    } finally {
      setPushBusy(false);
    }
  };

  const telegramBotUrl = telegramBotUsername
    ? `https://t.me/${telegramBotUsername}?start=connect`
    : "#";

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <p className="text-text-muted text-sm mt-1">{t.subtitle}</p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t.email.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-muted">{t.email.description}</p>
          {emailConfigured ? (
            <div className="flex items-center justify-between">
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t.email.configured}
              </Badge>
              <Button onClick={handleTestEmail} disabled={sending} size="sm">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                {t.email.testSend}
              </Button>
            </div>
          ) : (
            <Badge variant="warning">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t.email.notConfigured}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            {t.telegram.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-muted">{t.telegram.description}</p>
          {telegramConnected ? (
            <Badge variant="success">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t.telegram.connected}
            </Badge>
          ) : (
            <>
              <p className="text-xs text-text-muted">{t.telegram.setupHint}</p>
              <a
                href={telegramBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                aria-disabled={!telegramBotUsername}
                style={!telegramBotUsername ? { opacity: 0.5, pointerEvents: "none" } : undefined}
              >
                <ExternalLink className="h-4 w-4" />
                {t.telegram.connect}
              </a>
            </>
          )}
        </CardContent>
      </Card>

      {/* Web Push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t.push.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-muted">{t.push.description}</p>
          {pushSupported ? (
            <>
              <div className="flex items-center justify-between">
                <Badge variant={pushEnabled ? "success" : "default"}>
                  {pushEnabled ? t.push.enabled : t.push.disabled}
                </Badge>
                {pushEnabled ? (
                  <Button
                    onClick={handleDisablePush}
                    size="sm"
                    variant="outline"
                    disabled={pushBusy}
                  >
                    {t.push.disable}
                  </Button>
                ) : (
                  <Button onClick={handleEnablePush} size="sm" disabled={pushBusy}>
                    {t.push.enable}
                  </Button>
                )}
              </div>
              {pushBlocked && (
                <p className="text-xs text-danger">{t.push.blockedText}</p>
              )}
              {iosHint && !pushEnabled && (
                <p className="text-xs text-warning">{t.push.iosHint}</p>
              )}
            </>
          ) : (
            <Badge variant="warning">{t.push.notSupported}</Badge>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t.history.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">{t.history.empty}</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface/50"
                >
                  <div className="h-8 w-8 rounded bg-surface flex items-center justify-center shrink-0">
                    {n.imageUrl ? (
                      <img
                        src={n.imageUrl}
                        alt=""
                        className="h-full w-full object-cover rounded"
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
