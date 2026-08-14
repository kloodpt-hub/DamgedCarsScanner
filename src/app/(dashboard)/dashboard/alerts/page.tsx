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
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

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
      enabled: "Enabled",
      disabled: "Disabled",
      notSupported: "Not supported in this browser",
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
      enabled: "مفعّل",
      disabled: "معطّل",
      notSupported: "غير مدعوم في هذا المتصفح",
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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AlertsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const [locale, setLocale] = useState("en");
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramBotUsername, setTelegramBotUsername] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
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
        setPushSupported(data.pushSupported);
        setRecentNotifications(data.recentNotifications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleTestEmail = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/notifications/test-email", { method: "POST" });
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
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error(t.push.notSupported);
      return;
    }
    const permission = await Notification.requestPermission();
    setPushEnabled(permission === "granted");
    if (permission === "granted") {
      toast.success(t.push.enabled);

      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js");
        } catch {
          // Service worker registration failed, but notifications still work
        }
      }
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
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
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
            <div className="flex items-center justify-between">
              <Badge variant={pushEnabled ? "success" : "default"}>
                {pushEnabled ? t.push.enabled : t.push.disabled}
              </Badge>
              {!pushEnabled && (
                <Button onClick={handleEnablePush} size="sm">
                  {t.push.enable}
                </Button>
              )}
            </div>
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
